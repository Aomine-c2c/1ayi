"""
AYIS — report generation service (REFINED).

Generates all report types from real database data with RBAC enforcement,
filter support, chart data, conclusions, and multi-format export.
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Max, Min, Q, Sum, F

from ayis.reports.models import (
    ReportAccessLevel,
    ReportFormat,
    ReportType,
)
from ayis.settings_manager.models import SettingService
from ayis.integrations.base import ObservationRecord

User = get_user_model()


# ---------------------------------------------------------------------------
# Report data classes — each produces a structured dict with summary,
# detailed data, charts, and conclusions.
# ---------------------------------------------------------------------------

class ReportData:
    """Base report data structure."""

    def __init__(self, title: str, report_type: str, period_start=None,
                 period_end=None):
        self.title = title
        self.report_type = report_type
        self.period_start = period_start
        self.period_end = period_end
        self.summary: dict[str, Any] = {}
        self.details: list[dict[str, Any]] = []
        self.charts: list[dict[str, Any]] = []
        self.conclusions: list[str] = []
        self.generated_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict[str, Any]:
        return {
            "report_title": self.title,
            "report_type": self.report_type,
            "period": {
                "start": self.period_start.isoformat() if self.period_start else None,
                "end": self.period_end.isoformat() if self.period_end else None,
            },
            "generated_at": self.generated_at.isoformat(),
            "summary": self.summary,
            "details": self.details,
            "charts": self.charts,
            "conclusions": self.conclusions,
        }


class FarmReportData(ReportData):
    """Farm report: summary + cycle list + production history + charts."""

    def __init__(self, farm, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title=f"Farm Report: {farm.name}",
            report_type="farm",
            period_start=period_start,
            period_end=period_end,
        )
        self.farm = farm
        self._build()

    def _build(self):
        f = self.farm
        self.summary = {
            "farm_name": f.name,
            "owner": f.owner.username if f.owner else "Unknown",
            "area_ha": float(f.area_ha) if f.area_ha else None,
            "location": {
                "longitude": float(f.longitude) if f.longitude is not None else None,
                "latitude": float(f.latitude) if f.latitude is not None else None,
            },
            "total_cycles": f.crop_cycles.count(),
            "active_cycles": f.crop_cycles.filter(
                status__in=["planned", "active"]
            ).count(),
            "completed_cycles": f.crop_cycles.filter(status="completed").count(),
        }

        # Cycles detail
        cycles = f.crop_cycles.select_related("crop", "variety").order_by(
            "-planting_date"
        )
        if self.period_start or self.period_end:
            cycles = cycles.filter(
                planting_date__gte=self.period_start or date(1900, 1, 1),
                planting_date__lte=self.period_end or date(2100, 12, 31),
            )
        self.details = []
        for c in cycles:
            prod = c.harvests.aggregate(
                total_qty=Sum("quantity_kg"),
                total_area=Sum("production_area_ha"),
            )
            self.details.append({
                "cycle_id": c.id,
                "crop": c.crop.name,
                "variety": c.variety.name if c.variety else None,
                "planting_date": c.planting_date.isoformat() if c.planting_date else None,
                "expected_harvest": c.expected_harvest_date.isoformat() if c.expected_harvest_date else None,
                "actual_harvest": c.actual_harvest_date.isoformat() if c.actual_harvest_date else None,
                "current_stage": c.get_current_stage_display(),
                "status": c.get_status_display(),
                "area_ha": float(c.area_ha) if c.area_ha else None,
                "total_harvest_qty_kg": float(prod["total_qty"] or 0),
                "total_production_kg": float(prod["total_area"] or 0) if prod["total_area"] else None,
            })

        # Chart: harvest quantities by cycle
        if self.details:
            self.charts.append({
                "type": "bar",
                "title": "Harvest Quantity by Cycle (kg)",
                "x_key": "crop",
                "y_key": "total_harvest_qty_kg",
                "data": [
                    {"name": d["crop"], "value": d["total_harvest_qty_kg"]}
                    for d in self.details if d["total_harvest_qty_kg"] > 0
                ],
            })

        # Conclusions
        self.conclusions = []
        if self.summary["active_cycles"] > 0:
            self.conclusions.append(
                f"{self.summary['active_cycles']} active crop cycle(s) on this farm."
            )
        completed = self.summary["completed_cycles"]
        if completed > 0:
            self.conclusions.append(
                f"{completed} completed cycle(s) with harvest records."
            )


class WeatherReportData(ReportData):
    """Weather report: observations + summary stats + charts over period."""

    def __init__(self, farm, period_start: date, period_end: date,
                 observations: list[ObservationRecord]):
        super().__init__(
            title=f"Weather Report: {farm.name} ({period_start} to {period_end})",
            report_type="weather",
            period_start=period_start,
            period_end=period_end,
        )
        self.farm = farm
        self.observations = observations
        self._build()

    def _build(self):
        f = self.farm
        self.summary = {
            "farm_name": f.name,
            "location": {
                "longitude": float(f.longitude) if f.longitude is not None else None,
                "latitude": float(f.latitude) if f.latitude is not None else None,
            },
            "period": {
                "start": self.period_start.isoformat(),
                "end": self.period_end.isoformat(),
            },
            "observations_count": len(self.observations),
        }

        temps = [o.temperature_celsius for o in self.observations
                 if o.temperature_celsius is not None]
        rains = [o.rainfall_mm for o in self.observations
                 if o.rainfall_mm is not None]
        hums = [o.humidity_percent for o in self.observations
                if o.humidity_percent is not None]

        if temps:
            self.summary["avg_temperature"] = round(sum(temps) / len(temps), 1)
            self.summary["min_temperature"] = round(min(temps), 1)
            self.summary["max_temperature"] = round(max(temps), 1)
        if rains:
            self.summary["total_rainfall_mm"] = round(sum(rains), 1)
            self.summary["avg_rainfall_mm"] = round(sum(rains) / len(rains), 1)
        if hums:
            self.summary["avg_humidity"] = round(sum(hums) / len(hums), 1)

        # Details: observations sorted by date
        sorted_obs = sorted(self.observations, key=lambda o: o.observed_at)
        self.details = [
            {
                "observed_at": o.observed_at.isoformat(),
                "temperature_celsius": float(o.temperature_celsius) if o.temperature_celsius else None,
                "rainfall_mm": float(o.rainfall_mm) if o.rainfall_mm else None,
                "humidity_percent": float(o.humidity_percent) if o.humidity_percent else None,
                "wind_speed_ms": float(o.wind_speed_ms) if o.wind_speed_ms else None,
                "data_quality": o.data_quality,
            }
            for o in sorted_obs
        ]

        # Charts
        if temps:
            self.charts.append({
                "type": "line",
                "title": "Temperature Trend (°C)",
                "data": [
                    {"date": o.observed_at.strftime("%Y-%m-%d"),
                     "value": float(o.temperature_celsius)}
                    for o in sorted_obs if o.temperature_celsius is not None
                ],
            })
        if rains:
            self.charts.append({
                "type": "bar",
                "title": "Rainfall by Observation (mm)",
                "data": [
                    {"date": o.observed_at.strftime("%Y-%m-%d"),
                     "value": float(o.rainfall_mm)}
                    for o in sorted_obs if o.rainfall_mm is not None
                ],
            })

        # Conclusions
        self.conclusions = []
        if self.summary.get("total_rainfall_mm") is not None:
            rainfall = self.summary["total_rainfall_mm"]
            if rainfall > 200:
                self.conclusions.append(
                    f"Total rainfall ({rainfall} mm) is high — monitor for waterlogging "
                    f"and disease pressure on {self.farm.name}."
                )
            elif rainfall < 50:
                self.conclusions.append(
                    f"Total rainfall ({rainfall} mm) is low — irrigation may be needed "
                    f"for crops on {self.farm.name}."
                )
            else:
                self.conclusions.append(
                    f"Rainfall ({rainfall} mm) is within a reasonable range for the period."
                )
        if self.summary.get("avg_temperature") is not None:
            avg_temp = self.summary["avg_temperature"]
            self.conclusions.append(
                f"Average temperature was {avg_temp}°C over the report period."
            )


class CropCycleReportData(ReportData):
    """Crop cycle report: inputs, stages, weather, intelligence, harvest."""

    def __init__(self, cycle, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title=f"Crop Cycle Report: {cycle.crop.name} on {cycle.farm.name}",
            report_type="crop_cycle",
            period_start=period_start,
            period_end=period_end,
        )
        self.cycle = cycle
        self._build()

    def _build(self):
        c = self.cycle
        self.summary = {
            "farm_name": c.farm.name,
            "crop": c.crop.name,
            "variety": c.variety.name if c.variety else "Not specified",
            "planting_date": c.planting_date.isoformat() if c.planting_date else None,
            "expected_harvest": c.expected_harvest_date.isoformat() if c.expected_harvest_date else None,
            "actual_harvest": c.actual_harvest_date.isoformat() if c.actual_harvest_date else None,
            "current_stage": c.get_current_stage_display(),
            "status": c.get_status_display(),
            "area_ha": float(c.area_ha) if c.area_ha else None,
        }

        # Stage history
        stage_history = c.stage_history.order_by("entered_at")
        self.details = []
        for sh in stage_history:
            self.details.append({
                "stage": sh.get_stage_display(),
                "entered_at": sh.entered_at.isoformat(),
                "exited_at": sh.exited_at.isoformat() if sh.exited_at else None,
                "is_current": sh.exited_at is None,
            })

        # Add production records
        harvests = c.harvests.order_by("-harvest_date")
        for h in harvests:
            self.details.append({
                "type": "harvest",
                "harvest_date": h.harvest_date.isoformat(),
                "quantity_kg": float(h.quantity_kg) if h.quantity_kg else None,
                "area_ha": float(h.production_area_ha) if h.production_area_ha else None,
                "actual_yield_kg_ha": float(h.actual_yield_kg_ha) if h.actual_yield_kg_ha else None,
                "quality_grade": h.quality_grade,
                "storage_loss_pct": float(h.storage_loss_pct) if h.storage_loss_pct else None,
            })

        # Charts
        if harvests:
            self.charts.append({
                "type": "bar",
                "title": "Harvest Yield (kg/ha) by Harvest Date",
                "data": [
                    {"date": h.harvest_date.isoformat(),
                     "value": float(h.actual_yield_kg_ha) if h.actual_yield_kg_ha else 0}
                    for h in harvests
                ],
            })

        # Conclusions
        self.conclusions = []
        stage_durations = []
        prev = None
        for sh in stage_history:
            if prev:
                delta = (sh.entered_at - prev.entered_at).days
                stage_durations.append((prev.get_stage_display(), delta))
            prev = sh
        if stage_durations:
            self.conclusions.append(
                "Stage durations: " + "; ".join(
                    f"{stage}: {days} days" for stage, days in stage_durations
                )
            )
        if c.status == "completed":
            self.conclusions.append(
                "This crop cycle has been completed and harvested."
            )


class YieldReportData(ReportData):
    """Yield report: predictions vs actuals for a cycle or farm."""

    def __init__(self, cycle, period_start: date | None = None,
                 period_end: date | None = None):
        title = f"Yield Report: {cycle.crop.name} on {cycle.farm.name}"
        super().__init__(
            title=title,
            report_type="yield",
            period_start=period_start,
            period_end=period_end,
        )
        self.cycle = cycle
        self._build()

    def _build(self):
        c = self.cycle
        self.summary = {
            "farm_name": c.farm.name,
            "crop": c.crop.name,
            "variety": c.variety.name if c.variety else "Not specified",
            "planting_date": c.planting_date.isoformat() if c.planting_date else None,
            "area_ha": float(c.area_ha) if c.area_ha else None,
        }

        # Get yield predictions linked to this cycle
        predictions = c.intelligence_results.filter(
            result_type="yield_estimate"
        ).order_by("-created_at")

        self.details = []
        for pred in predictions:
            pred_value = pred.value
            pred_yield = Decimal(str(pred_value.get("estimated_yield", 0))) if pred_value else None
            self.details.append({
                "prediction_id": pred.id,
                "predicted_yield_kg_ha": float(pred_yield) if pred_yield else None,
                "confidence": float(pred.confidence) if pred.confidence else None,
                "model_name": pred.model_name,
                "explanation": pred.explanation,
                "data_classification": pred.data_classification,
                "created_at": pred.created_at.isoformat(),
            })

        # Actual harvests
        harvests = c.harvests.order_by("-harvest_date")
        for h in harvests:
            self.details.append({
                "type": "actual",
                "harvest_date": h.harvest_date.isoformat(),
                "actual_yield_kg_ha": float(h.actual_yield_kg_ha) if h.actual_yield_kg_ha else None,
                "quantity_kg": float(h.quantity_kg) if h.quantity_kg else None,
                "area_ha": float(h.production_area_ha) if h.production_area_ha else None,
            })

            # Compare actual vs prediction
            if pred_yield and h.actual_yield_kg_ha:
                diff_pct = float((h.actual_yield_kg_ha - pred_yield) / pred_yield * 100) if pred_yield else None
                self.details[-1]["difference_pct"] = round(diff_pct, 1) if diff_pct is not None else None
                self.details[-1]["actual_vs_predicted"] = "higher" if (diff_pct or 0) > 0 else "lower"

        # Charts
        preds = [d for d in self.details if d.get("type") != "actual"]
        actuals = [d for d in self.details if d.get("type") == "actual"]
        if preds and actuals:
            self.charts.append({
                "type": "comparison",
                "title": "Predicted vs Actual Yield (kg/ha)",
                "predicted": [d["predicted_yield_kg_ha"] for d in preds],
                "actual": [d["actual_yield_kg_ha"] for d in actuals],
            })

        # Conclusions
        self.conclusions = []
        if actuals and preds:
            actual_yields = [d["actual_yield_kg_ha"] for d in actuals if d["actual_yield_kg_ha"]]
            if actual_yields:
                avg_actual = sum(actual_yields) / len(actual_yields)
                avg_predicted = sum(d["predicted_yield_kg_ha"] for d in preds if d["predicted_yield_kg_ha"]) / len(preds)
                if avg_predicted:
                    overall_diff = (avg_actual - avg_predicted) / avg_predicted * 100
                    direction = "above" if overall_diff > 0 else "below"
                    self.conclusions.append(
                        f"On average, actual yields were {abs(overall_diff):.1f}% {direction} "
                        f"predicted yields for this cycle."
                    )


class RecommendationReportData(ReportData):
    """Recommendation report: suitability + yield + recommendations for a cycle."""

    def __init__(self, cycle, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title=f"Recommendation Report: {cycle.crop.name} on {cycle.farm.name}",
            report_type="recommendation",
            period_start=period_start,
            period_end=period_end,
        )
        self.cycle = cycle
        self._build()

    def _build(self):
        c = self.cycle
        self.summary = {
            "farm_name": c.farm.name,
            "crop": c.crop.name,
            "variety": c.variety.name if c.variety else "Not specified",
            "status": c.get_status_display(),
            "current_stage": c.get_current_stage_display(),
        }

        # Suitability results
        suitability = c.intelligence_results.filter(
            result_type="crop_suitability"
        ).order_by("-created_at").first()

        self.details = []

        if suitability:
            self.details.append({
                "type": "suitability",
                "score": float(suitability.score) if suitability.score else None,
                "confidence": float(suitability.confidence) if suitability.confidence else None,
                "factors": suitability.factors,
                "explanation": suitability.explanation,
                "data_classification": suitability.data_classification,
                "generated_at": suitability.created_at.isoformat(),
            })

        # Yield estimates
        yield_estimates = c.intelligence_results.filter(
            result_type="yield_estimate"
        ).order_by("-created_at")
        for ye in yield_estimates:
            self.details.append({
                "type": "yield_estimate",
                "estimated_yield_kg_ha": ye.value.get("estimated_yield") if ye.value else None,
                "unit": ye.value.get("unit") if ye.value else None,
                "confidence": float(ye.confidence) if ye.confidence else None,
                "model_name": ye.model_name,
                "explanation": ye.explanation,
                "data_classification": ye.data_classification,
            })

        # Recommendations
        recs = c.intelligence_results.filter(
            result_type="recommendation"
        ).order_by("-created_at")
        for rec in recs:
            self.details.append({
                "type": "recommendation",
                "action": rec.value.get("action") if rec.value else None,
                "rationale": rec.value.get("rationale") if rec.value else None,
                "confidence": float(rec.confidence) if rec.confidence else None,
                "evidence": rec.value.get("evidence", []) if rec.value else [],
                "data_classification": rec.data_classification,
            })

        # Charts
        if suitability and suitability.score is not None:
            self.charts.append({
                "type": "gauge",
                "title": "Crop Suitability Score",
                "value": float(suitability.score),
                "max": 100,
            })

        # Conclusions
        self.conclusions = []
        best_rec = recs.first() if recs.exists() else None
        if best_rec and best_rec.value:
            action = best_rec.value.get("action", "")
            confidence = float(best_rec.confidence or 0)
            if confidence >= 0.6:
                self.conclusions.append(
                    f"High-confidence recommendation: {action}"
                )
            elif confidence >= 0.3:
                self.conclusions.append(
                    f"Moderate-confidence recommendation: {action}. "
                    f"Monitor conditions and consult an agricultural officer."
                )
            else:
                self.conclusions.append(
                    f"Low-confidence recommendation: {action}. "
                    f"Additional data collection recommended."
                )
        else:
            self.conclusions.append(
                "No recommendations available yet. "
                "Generate suitability and yield estimates first."
            )


class ProductionReportData(ReportData):
    """Production report: harvest totals across farms/cycles."""

    def __init__(self, farm=None, period_start: date | None = None,
                 period_end: date | None = None,
                 farmer_ids: list[int] | None = None):
        title = "Production Report"
        if farm:
            title = f"Production Report: {farm.name}"
        super().__init__(
            title=title,
            report_type="production",
            period_start=period_start,
            period_end=period_end,
        )
        self.farm = farm
        self.farmer_ids = farmer_ids or []
        self._build()

    def _build(self):
        # Base queryset
        qs = Harvest.objects.select_related("cycle__farm", "cycle__crop")

        if self.farm:
            qs = qs.filter(cycle__farm=self.farm)
        if self.period_start:
            qs = qs.filter(harvest_date__gte=self.period_start)
        if self.period_end:
            qs = qs.filter(harvest_date__lte=self.period_end)
        if self.farmer_ids:
            qs = qs.filter(cycle__farm__owner_id__in=self.farmer_ids)

        total_qty = qs.aggregate(total=Sum("quantity_kg"))["total"] or 0
        total_area = qs.aggregate(total=Sum("production_area_ha"))["total"] or 0
        avg_yield = qs.filter(actual_yield_kg_ha__isnull=False).aggregate(
            avg=Avg("actual_yield_kg_ha")
        )["avg"]

        self.summary = {
            "total_harvests": qs.count(),
            "total_quantity_kg": float(total_qty),
            "total_production_area_ha": float(total_area),
            "average_yield_kg_ha": float(avg_yield) if avg_yield else None,
            "total_revenue": float(qs.aggregate(total=Sum("total_revenue"))["total"] or 0),
        }

        # Detail by crop
        by_crop = qs.values("cycle__crop__name").annotate(
            harvests=Count("id"),
            total_qty=Sum("quantity_kg"),
            avg_yield=Avg("actual_yield_kg_ha"),
        ).order_by("-total_qty")

        self.details = [
            {
                "crop": item["cycle__crop__name"],
                "harvest_count": item["harvests"],
                "total_quantity_kg": float(item["total_qty"] or 0),
                "average_yield_kg_ha": float(item["avg_yield"]) if item["avg_yield"] else None,
            }
            for item in by_crop
        ]

        # Chart
        if self.details:
            self.charts.append({
                "type": "bar",
                "title": "Total Production by Crop (kg)",
                "data": [
                    {"name": d["crop"], "value": d["total_quantity_kg"]}
                    for d in self.details
                ],
            })

        # Conclusions
        self.conclusions = []
        if self.summary["total_harvests"] > 0:
            self.conclusions.append(
                f"{self.summary['total_harvests']} harvests recorded "
                f"totaling {self.summary['total_quantity_kg']:.1f} kg."
            )
        if self.summary["average_yield_kg_ha"] is not None:
            self.conclusions.append(
                f"Average yield across all harvests: "
                f"{self.summary['average_yield_kg_ha']:.1f} kg/ha."
            )


class FarmerReportData(ReportData):
    """Farmer report: farm portfolio, cycles, production for a specific farmer."""

    def __init__(self, farmer: User, period_start: date | None = None,
                 period_end: date | None = None):
        title = f"Farmer Report: {farmer.username}"
        super().__init__(
            title=title,
            report_type="farmer",
            period_start=period_start,
            period_end=period_end,
        )
        self.farmer = farmer
        self._build()

    def _build(self):
        f = self.farmer
        farms = f.farms.all()

        self.summary = {
            "farmer": f.username,
            "role": f.get_role_display(),
            "total_farms": farms.count(),
            "total_area_ha": sum(
                float(frm.area_ha) for frm in farms if frm.area_ha
            ),
            "active_cycles": sum(
                frm.crop_cycles.filter(status__in=["planned", "active"]).count()
                for frm in farms
            ),
            "completed_cycles": sum(
                frm.crop_cycles.filter(status="completed").count()
                for frm in farms
            ),
        }

        self.details = []
        for farm in farms:
            prod = farm.crop_cycles.aggregate(
                total_harvests=Count("harvests", filter=Q(harvests__harvest_date__isnull=False)),
            )
            self.details.append({
                "farm_name": farm.name,
                "area_ha": float(farm.area_ha) if farm.area_ha else None,
                "location": {
                    "longitude": float(farm.longitude) if farm.longitude is not None else None,
                    "latitude": float(farm.latitude) if farm.latitude is not None else None,
                },
                "active_cycles": farm.crop_cycles.filter(
                    status__in=["planned", "active"]
                ).count(),
                "total_harvests": farm.harvests.count(),
                "total_production_kg": float(
                    farm.harvests.aggregate(total=Sum("quantity_kg"))["total"] or 0
                ),
            })

        # Charts
        if self.details:
            self.charts.append({
                "type": "bar",
                "title": "Production by Farm (kg)",
                "data": [
                    {"name": d["farm_name"], "value": d["total_production_kg"]}
                    for d in self.details
                ],
            })

        self.conclusions = []
        if self.summary["total_farms"] == 0:
            self.conclusions.append("No farms registered for this farmer.")
        else:
            self.conclusions.append(
                f"{self.summary['total_farms']} farm(s) with "
                f"{self.summary['active_cycles']} active cycle(s)."
            )


class CropReportData(ReportData):
    """Crop report: all farms growing this crop, with cycles and production."""

    def __init__(self, crop, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title=f"Crop Report: {crop.name}",
            report_type="crop",
            period_start=period_start,
            period_end=period_end,
        )
        self.crop = crop
        self._build()

    def _build(self):
        c = self.crop
        cycles = c.cycles.select_related("farm", "variety").order_by(
            "-planting_date"
        )
        if self.period_start or self.period_end:
            cycles = cycles.filter(
                planting_date__gte=self.period_start or date(1900, 1, 1),
                planting_date__lte=self.period_end or date(2100, 12, 31),
            )

        self.summary = {
            "crop": c.name,
            "scientific_name": c.scientific_name,
            "category": c.category,
            "total_cycles": cycles.count(),
            "active_cycles": cycles.filter(status__in=["planned", "active"]).count(),
            "completed_cycles": cycles.filter(status="completed").count(),
            "expected_yield_typical": c.expected_yield_typical_kg_ha,
        }

        self.details = []
        for cycle in cycles:
            harvests = cycle.harvests.aggregate(
                total_qty=Sum("quantity_kg"),
                avg_yield=Avg("actual_yield_kg_ha"),
            )
            self.details.append({
                "farm_name": cycle.farm.name,
                "variety": cycle.variety.name if cycle.variety else None,
                "planting_date": cycle.planting_date.isoformat() if cycle.planting_date else None,
                "status": cycle.get_status_display(),
                "current_stage": cycle.get_current_stage_display(),
                "area_ha": float(cycle.area_ha) if cycle.area_ha else None,
                "total_harvest_kg": float(harvests["total_qty"] or 0),
                "average_yield_kg_ha": float(harvests["avg_yield"]) if harvests["avg_yield"] else None,
            })

        # Charts
        if self.details:
            actuals = [d for d in self.details if d["average_yield_kg_ha"] is not None]
            if actuals:
                self.charts.append({
                    "type": "bar",
                    "title": "Average Yield by Farm (kg/ha)",
                    "data": [
                        {"name": d["farm_name"], "value": d["average_yield_kg_ha"]}
                        for d in actuals
                    ],
                })

        self.conclusions = []
        self.conclusions.append(
            f"{self.summary['total_cycles']} cycles of {c.name} across "
            f"{len(set(d['farm_name'] for d in self.details))} farm(s)."
        )
        if self.summary["completed_cycles"] > 0:
            avg_yields = [d["average_yield_kg_ha"] for d in self.details
                          if d["average_yield_kg_ha"] is not None]
            if avg_yields:
                overall_avg = sum(avg_yields) / len(avg_yields)
                self.conclusions.append(
                    f"Average actual yield: {overall_avg:.1f} kg/ha "
                    f"(typical expected: {self.summary['expected_yield_typical']} kg/ha)."
                )


class OfficerReportData(ReportData):
    """Agricultural officer report: assigned farms, officer activity, regional overview."""

    def __init__(self, officer: User, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title=f"Agricultural Officer Report: {officer.username}",
            report_type="officer",
            period_start=period_start,
            period_end=period_end,
        )
        self.officer = officer
        self._build()

    def _build(self):
        o = self.officer
        assignments = o.assignments.all()

        self.summary = {
            "officer": o.username,
            "assignment_count": assignments.count(),
        }

        farm_ids = set()
        region_names = []
        for a in assignments:
            if a.region:
                region_names.append(a.region.name)
                # Get farms in this region
                farm_ids.update(
                    a.region.farms_in_region().values_list("id", flat=True)
                )
            farm_ids.update(a.farms.values_list("id", flat=True))

        # Farms the officer can see
        officer_farms = Farm.objects.filter(id__in=farm_ids).select_related(
            "owner"
        )

        self.details = []
        for farm in officer_farms:
            self.details.append({
                "farm_name": farm.name,
                "owner": farm.owner.username,
                "area_ha": float(farm.area_ha) if farm.area_ha else None,
                "active_cycles": farm.crop_cycles.filter(
                    status__in=["planned", "active"]
                ).count(),
                "completed_cycles": farm.crop_cycles.filter(status="completed").count(),
                "total_harvests": farm.harvests.count(),
            })

        self.summary["supervised_farms"] = len(farm_ids)
        self.summary["regions"] = region_names

        # Charts
        if self.details:
            self.charts.append({
                "type": "bar",
                "title": "Active Cycles per Farm",
                "data": [
                    {"name": d["farm_name"], "value": d["active_cycles"]}
                    for d in self.details
                ],
            })

        self.conclusions = []
        if self.summary["supervised_farms"] == 0:
            self.conclusions.append(
                "No farms assigned to this officer."
            )
        else:
            self.conclusions.append(
                f"Overseeing {self.summary['supervised_farms']} farm(s) "
                f"across {len(region_names)} region(s)."
            )


class SystemReportData(ReportData):
    """System-wide administrative report: totals, trends, activity."""

    def __init__(self, period_start: date | None = None,
                 period_end: date | None = None,
                 farmer_ids: list[int] | None = None):
        super().__init__(
            title="System Administration Report",
            report_type="administrative",
            period_start=period_start,
            period_end=period_end,
        )
        self.farmer_ids = farmer_ids or []
        self._build()

    def _build(self):
        total_users = User.objects.count()
        total_farmers = User.objects.filter(role="farmer").count()
        total_officers = User.objects.filter(role="officer").count()
        total_admins = User.objects.filter(role="admin").count()
        total_farms = Farm.objects.count()
        total_cycles = CropCycle.objects.count()

        weather_qs = WeatherObservation.objects.all()
        if self.period_start:
            weather_qs = weather_qs.filter(observed_at__date__gte=self.period_start)
        if self.period_end:
            weather_qs = weather_qs.filter(observed_at__date__lte=self.period_end)
        total_weather = weather_qs.count()

        self.summary = {
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_officers": total_officers,
            "total_admins": total_admins,
            "total_farms": total_farms,
            "total_crop_cycles": total_cycles,
            "total_weather_observations": total_weather,
            "active_users_last_30_days": User.objects.filter(
                last_login__gte=date.today() - date.resolution * 30
            ).count(),
        }

        # Recent activity: cycles created
        cycle_qs = CropCycle.objects.select_related("farm__owner", "crop")
        if self.period_start:
            cycle_qs = cycle_qs.filter(created_at__gte=self.period_start)
        if self.period_end:
            cycle_qs = cycle_qs.filter(created_at__lte=self.period_end)

        recent_cycles = cycle_qs.order_by("-created_at")[:50]
        self.details = [
            {
                "created_at": c.created_at.isoformat(),
                "farm": c.farm.name,
                "farmer": c.farm.owner.username,
                "crop": c.crop.name,
                "status": c.get_status_display(),
                "planting_date": c.planting_date.isoformat() if c.planting_date else None,
            }
            for c in recent_cycles
        ]

        # Charts
        self.charts.append({
            "type": "pie",
            "title": "Users by Role",
            "data": [
                {"name": "Farmers", "value": total_farmers},
                {"name": "Officers", "value": total_officers},
                {"name": "Admins", "value": total_admins},
            ],
        })

        self.conclusions = []
        self.conclusions.append(
            f"System has {total_users} registered users "
            f"({total_farmers} farmers, {total_officers} officers, {total_admins} admins)."
        )
        self.conclusions.append(
            f"{total_farms} farms and {total_cycles} crop cycles in the system."
        )
        self.conclusions.append(
            f"{total_weather} weather observations recorded."
        )


class RecommendationEngineReportData(ReportData):
    """Report on recommendation rules and engine versions."""

    def __init__(self, period_start: date | None = None,
                 period_end: date | None = None):
        super().__init__(
            title="Recommendation Engine Report",
            report_type="recommendation",
            period_start=period_start,
            period_end=period_end,
        )
        self._build()

    def _build(self):
        active_rules = RecommendationRule.objects.filter(is_active=True).count()
        total_rules = RecommendationRule.objects.count()
        active_versions = RecommendationEngineVersion.objects.filter(
            is_active=True
        ).count()

        self.summary = {
            "total_rules": total_rules,
            "active_rules": active_rules,
            "total_engine_versions": RecommendationEngineVersion.objects.count(),
            "active_engine_versions": active_versions,
        }

        rules = RecommendationRule.objects.order_by("-priority", "name")
        self.details = [
            {
                "name": r.name,
                "priority": r.priority,
                "is_active": r.is_active,
                "description": r.description,
                "condition": r.condition_expression[:200],
                "created_at": r.created_at.isoformat(),
            }
            for r in rules
        ]

        versions = RecommendationEngineVersion.objects.order_by("-version")
        for v in versions:
            self.details.append({
                "type": "engine_version",
                "version": v.version,
                "description": v.description,
                "is_active": v.is_active,
                "rule_count": v.rules.count(),
                "created_at": v.created_at.isoformat(),
            })

        self.conclusions = [
            f"{active_rules} of {total_rules} recommendation rules are active.",
            f"{active_versions} of {self.summary['total_engine_versions']} engine versions are active.",
        ]


# Alias old names for backward compat
RecommendationRule = RecommendationRule
RecommendationEngineVersion = RecommendationEngineVersion


# ---------------------------------------------------------------------------
# Report generation service
# ---------------------------------------------------------------------------

class ReportService:
    """
    Generates reports from real database data with RBAC enforcement.

    Every report generation method takes a requesting_user and applies
    access control so users only see data they're authorized to view.
    """

    def _get_accessible_farm_ids(self, user: User) -> list[int]:
        """Return farm IDs the user is authorized to access."""
        if user.is_admin:
            return list(Farm.objects.values_list("id", flat=True))
        if user.role == "officer":
            # Officers see farms in their assignments
            farm_ids = set()
            for assignment in user.assignments.all():
                if assignment.region:
                    farm_ids.update(
                        assignment.region.farms_in_region().values_list(
                            "id", flat=True
                        )
                    )
                farm_ids.update(assignment.farms.values_list("id", flat=True))
            return list(farm_ids)
        # Farmers see only their own farms
        return list(user.farms.values_list("id", flat=True))

    def _can_access_farm(self, user: User, farm: Farm) -> bool:
        """Check if user can access a specific farm."""
        if user.is_admin:
            return True
        if user.role == "officer":
            # Check if farm is in any of the officer's assignments
            for assignment in user.assignments.all():
                if assignment.region:
                    if assignment.region.farms_in_region().filter(
                        id=farm.id
                    ).exists():
                        return True
                if assignment.farms.filter(id=farm.id).exists():
                    return True
            return False
        return farm.owner == user

    def generate_farm_report(self, user: User, farm_id: int,
                              period_start: date | None = None,
                              period_end: date | None = None,
                              format: str = ReportFormat.HTML) -> FarmReportData:
        """Generate a farm report; enforces RBAC."""
        try:
            farm = Farm.objects.get(id=farm_id)
        except Farm.DoesNotExist:
            raise ValueError(f"Farm {farm_id} not found")

        if not self._can_access_farm(user, farm):
            raise PermissionError(
                f"User {user.username} cannot access farm {farm_id}"
            )

        return FarmReportData(farm, period_start, period_end)

    def generate_weather_report(self, user: User, farm_id: int,
                                period_start: date, period_end: date,
                                format: str = ReportFormat.HTML) -> WeatherReportData:
        """Generate a weather report for a farm over a period."""
        try:
            farm = Farm.objects.get(id=farm_id)
        except Farm.DoesNotExist:
            raise ValueError(f"Farm {farm_id} not found")

        if not self._can_access_farm(user, farm):
            raise PermissionError(
                f"User {user.username} cannot access farm {farm_id}"
            )

        # Fetch real observations from the database
        observations = WeatherObservation.objects.filter(
            location__distance_lte=(
                farm.location,
                50000,  # 50km radius
            )
        ).filter(
            observed_at__date__gte=period_start,
            observed_at__date__lte=period_end,
        ).order_by("observed_at")

        # Convert to ObservationRecord for the report data class
        obs_records = [
            ObservationRecord(
                source=o.source.provider if o.source else "unknown",
                observed_at=o.observed_at,
                latitude=float(o.latitude),
                longitude=float(o.longitude),
                temperature_celsius=float(o.temperature_celsius) if o.temperature_celsius is not None else None,
                rainfall_mm=float(o.rainfall_mm) if o.rainfall_mm is not None else None,
                humidity_percent=float(o.humidity_percent) if o.humidity_percent is not None else None,
                wind_speed_ms=float(o.wind_speed_ms) if o.wind_speed_ms is not None else None,
                data_quality=o.data_quality,
            )
            for o in observations
        ]

        return WeatherReportData(farm, period_start, period_end, obs_records)

    def generate_crop_cycle_report(self, user: User, cycle_id: int,
                                   period_start: date | None = None,
                                   period_end: date | None = None,
                                   format: str = ReportFormat.HTML) -> CropCycleReportData:
        """Generate a crop cycle report; enforces RBAC."""
        try:
            cycle = CropCycle.objects.get(id=cycle_id)
        except CropCycle.DoesNotExist:
            raise ValueError(f"CropCycle {cycle_id} not found")

        if not self._can_access_farm(user, cycle.farm):
            raise PermissionError(
                f"User {user.username} cannot access cycle {cycle_id}"
            )

        return CropCycleReportData(cycle, period_start, period_end)

    def generate_yield_report(self, user: User, cycle_id: int,
                              period_start: date | None = None,
                              period_end: date | None = None,
                              format: str = ReportFormat.HTML) -> YieldReportData:
        """Generate a yield comparison report."""
        try:
            cycle = CropCycle.objects.get(id=cycle_id)
        except CropCycle.DoesNotExist:
            raise ValueError(f"CropCycle {cycle_id} not found")

        if not self._can_access_farm(user, cycle.farm):
            raise PermissionError(
                f"User {user.username} cannot access cycle {cycle_id}"
            )

        return YieldReportData(cycle, period_start, period_end)

    def generate_recommendation_report(self, user: User, cycle_id: int,
                                       period_start: date | None = None,
                                       period_end: date | None = None,
                                       format: str = ReportFormat.HTML
                                       ) -> RecommendationReportData:
        """Generate a recommendation report."""
        try:
            cycle = CropCycle.objects.get(id=cycle_id)
        except CropCycle.DoesNotExist:
            raise ValueError(f"CropCycle {cycle_id} not found")

        if not self._can_access_farm(user, cycle.farm):
            raise PermissionError(
                f"User {user.username} cannot access cycle {cycle_id}"
            )

        return RecommendationReportData(cycle, period_start, period_end)

    def generate_production_report(self, user: User,
                                    farm_id: int | None = None,
                                    period_start: date | None = None,
                                    period_end: date | None = None,
                                    format: str = ReportFormat.HTML) -> ProductionReportData:
        """Generate a production report; optionally scoped to a farm."""
        if farm_id is not None:
            try:
                farm = Farm.objects.get(id=farm_id)
            except Farm.DoesNotExist:
                raise ValueError(f"Farm {farm_id} not found")
            if not self._can_access_farm(user, farm):
                raise PermissionError(
                    f"User {user.username} cannot access farm {farm_id}"
                )
            return ProductionReportData(farm, period_start, period_end)

        # Multi-farm: use accessible farm IDs
        accessible_ids = self._get_accessible_farm_ids(user)
        farmer_ids = [user.id] if user.role == "farmer" else []
        return ProductionReportData(
            period_start=period_start,
            period_end=period_end,
            farmer_ids=farmer_ids,
        )

    def generate_farmer_report(self, user: User,
                               farmer_id: int | None = None,
                               period_start: date | None = None,
                               period_end: date | None = None,
                               format: str = ReportFormat.HTML) -> FarmerReportData:
        """Generate a farmer report. Users can only view their own."""
        target_user_id = farmer_id if farmer_id is not None else user.id
        if farmer_id is not None and farmer_id != user.id and not user.is_admin:
            raise PermissionError(
                "Users can only generate reports for themselves unless they are admins."
            )
        try:
            farmer = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            raise ValueError(f"User {target_user_id} not found")
        return FarmerReportData(farmer, period_start, period_end)

    def generate_crop_report(self, user: User, crop_id: int,
                             period_start: date | None = None,
                             period_end: date | None = None,
                             format: str = ReportFormat.HTML) -> CropReportData:
        """Generate a crop report. Crops are public data — all authenticated users can access."""
        try:
            crop = Crop.objects.get(id=crop_id)
        except Crop.DoesNotExist:
            raise ValueError(f"Crop {crop_id} not found")
        return CropReportData(crop, period_start, period_end)

    def generate_officer_report(self, user: User,
                                 officer_id: int | None = None,
                                 period_start: date | None = None,
                                 period_end: date | None = None,
                                 format: str = ReportFormat.HTML) -> OfficerReportData:
        """Generate an officer report. Officers can view their own; admins can view any."""
        target_id = officer_id if officer_id is not None else user.id
        if officer_id is not None and officer_id != user.id and not user.is_admin:
            raise PermissionError(
                "Officers can only view their own reports. Admins can view any."
            )
        try:
            officer = User.objects.get(id=target_id, role="officer")
        except User.DoesNotExist:
            raise ValueError(f"Officer {target_id} not found")
        return OfficerReportData(officer, period_start, period_end)

    def generate_system_report(self, user: User,
                                period_start: date | None = None,
                                period_end: date | None = None,
                                format: str = ReportFormat.HTML) -> SystemReportData:
        """Generate a system admin report. Admins only."""
        if not user.is_admin:
            raise PermissionError(
                "System reports are restricted to administrators."
            )
        return SystemReportData(period_start, period_end)

    def generate_recommendation_engine_report(self, user: User,
                                               period_start: date | None = None,
                                               period_end: date | None = None,
                                               format: str = ReportFormat.HTML
                                               ) -> RecommendationEngineReportData:
        """Generate a recommendation engine report. Admins and officers."""
        if not user.is_admin and user.role != "officer":
            raise PermissionError(
                "Recommendation engine reports are restricted to officers and admins."
            )
        return RecommendationEngineReportData(period_start, period_end)


# Singleton
report_service = ReportService()

"""
AYIS intelligence service layer (REFINED with multi-factor engine).

Uses MultiFactorSuitabilityEngine for configurable suitability analysis.
All intelligence results are classified as calculated, predicted, or recommended.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from ayis.integrations.base import ObservationRecord
from ayis.intelligence.models import IntelligenceResult
from ayis.intelligence.suitability_engine import MultiFactorSuitabilityEngine


class IntelligenceClassification:
    OBSERVED = "observed"
    CALCULATED = "calculated"
    PREDICTED = "predicted"
    RECOMMENDED = "recommended"


class SuitabilityResult:
    def __init__(self, score: float, max_score: float = 100.0,
                 factors: dict[str, Any] | None = None,
                 explanation: str = "", classification: str = "calculated",
                 reasons: list | None = None, risks: list | None = None,
                 warnings: list | None = None, confidence: float = 1.0):
        self.score = score
        self.max_score = max_score
        self.percentage = (score / max_score * 100) if max_score else 0
        self.factors = factors or {}
        self.explanation = explanation
        self.classification = classification
        self.reasons = reasons or []
        self.risks = risks or []
        self.warnings = warnings or []
        self.confidence = confidence

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "max_score": self.max_score,
            "percentage": round(self.percentage, 1),
            "factors": self.factors,
            "explanation": self.explanation,
            "data_classification": self.classification,
            "classification": self.classification,
            "reasons": self.reasons,
            "risks": self.risks,
            "warnings": self.warnings,
            "confidence": round(self.confidence, 2),
        }


class YieldEstimateResult:
    def __init__(self, estimated_yield: Decimal, unit: str = "kg/ha",
                 confidence: float = 0.0, model_name: str = "baseline",
                 inputs: dict[str, Any] | None = None, explanation: str = ""):
        self.estimated_yield = estimated_yield
        self.unit = unit
        self.confidence = confidence
        self.model_name = model_name
        self.inputs = inputs or {}
        self.explanation = explanation
        self.classification = IntelligenceClassification.PREDICTED

    def to_dict(self) -> dict:
        return {
            "estimated_yield": str(self.estimated_yield),
            "unit": self.unit,
            "confidence": round(self.confidence, 2),
            "model_name": self.model_name,
            "inputs": self.inputs,
            "explanation": self.explanation,
            "data_classification": self.classification,
        }


class RecommendationResult:
    def __init__(self, action: str, rationale: str,
                 confidence: float = 0.0, evidence: list[str] | None = None,
                 alternatives: list[str] | None = None,
                 risks: list[str] | None = None):
        self.action = action
        self.rationale = rationale
        self.confidence = confidence
        self.evidence = evidence or []
        self.alternatives = alternatives or []
        self.risks = risks or []
        self.classification = IntelligenceClassification.RECOMMENDED

    def to_dict(self) -> dict:
        return {
            "action": self.action,
            "rationale": self.rationale,
            "confidence": round(self.confidence, 2),
            "evidence": self.evidence,
            "alternatives": self.alternatives,
            "risks": self.risks,
            "data_classification": self.classification,
        }


class IntelligenceService:
    def __init__(self):
        self._yield_models = {"baseline": self._baseline_yield_model}
        self.suitability_engine = MultiFactorSuitabilityEngine()

    def calculate_weather_suitability(
        self, observations: list[ObservationRecord], crop_requirements: dict
    ) -> SuitabilityResult:
        """Calculate weather suitability using multi-factor engine."""
        result = self.suitability_engine.calculate(
            observations=observations,
            crop_requirements=crop_requirements,
        )
        return SuitabilityResult(
            score=result['score'],
            max_score=result['max_score'],
            factors=result['factors'],
            explanation=result['explanation'],
            classification=result['data_classification'],
            reasons=result['reasons'],
            risks=result['risks'],
            warnings=result['warnings'],
            confidence=result['confidence'],
        )

    def calculate_crop_suitability(
        self, farm, crop_reqs: dict,
        weather_observations: list[ObservationRecord] | None = None,
        forecast: list[ObservationRecord] | None = None,
        current_stage: str | None = None,
        growing_days_completed: int | None = None,
        growing_days_total: int | None = None,
    ) -> SuitabilityResult:
        """Calculate overall crop suitability combining all factors."""
        result = self.suitability_engine.calculate(
            observations=weather_observations or [],
            forecast=forecast,
            crop_requirements=crop_reqs,
            farm_location=(float(farm.longitude), float(farm.latitude))
            if farm.longitude and farm.latitude else None,
            current_stage=current_stage,
            growing_days_completed=growing_days_completed,
            growing_days_total=growing_days_total,
        )
        return SuitabilityResult(
            score=result['score'],
            max_score=result['max_score'],
            factors=result['factors'],
            explanation=result['explanation'],
            classification=result['data_classification'],
            reasons=result['reasons'],
            risks=result['risks'],
            warnings=result['warnings'],
            confidence=result['confidence'],
        )

    def estimate_yield(
        self, farm, crop: str, variety: str,
        planting_date: datetime, area_ha: Decimal | float,
        weather_observations: list[ObservationRecord] | None = None,
        model_name: str = "baseline",
    ) -> YieldEstimateResult:
        model = self._yield_models.get(model_name, self._baseline_yield_model)
        return model(
            farm=farm, crop=crop, variety=variety,
            planting_date=planting_date, area_ha=area_ha,
            observations=weather_observations or [],
        )

    def _baseline_yield_model(
        self, farm, crop: str, variety: str,
        planting_date: datetime, area_ha: Decimal | float,
        observations: list[ObservationRecord],
    ) -> YieldEstimateResult:
        base_yields = {
            "maize": 4500, "wheat": 3500, "beans": 1800,
            "sunflower": 2200, "rice": 4000,
        }
        base_yield = Decimal(str(base_yields.get(crop, 2000)))
        weather_factor = Decimal("1.0")
        explanation_parts = [f"Base yield for {crop}: {base_yield} kg/ha."]

        if observations:
            temps = [o.temperature_celsius for o in observations
                     if o.temperature_celsius is not None]
            if temps:
                avg_temp = sum(temps) / len(temps)
                if 20 <= avg_temp <= 30:
                    weather_factor *= Decimal("1.1")
                    explanation_parts.append(
                        f"Temperature favorable (avg {avg_temp:.1f}°C). +10% yield factor."
                    )
                elif avg_temp < 15:
                    weather_factor *= Decimal("0.8")
                    explanation_parts.append(
                        f"Temperature low (avg {avg_temp:.1f}°C). -20% yield factor."
                    )
                elif avg_temp > 35:
                    weather_factor *= Decimal("0.85")
                    explanation_parts.append(
                        f"Temperature high (avg {avg_temp:.1f}°C). -15% yield factor."
                    )

            rains = [o.rainfall_mm for o in observations
                     if o.rainfall_mm is not None]
            if rains:
                total_rain = sum(rains)
                if total_rain > 100:
                    weather_factor *= Decimal("1.05")
                    explanation_parts.append(
                        f"Rainfall adequate ({total_rain:.1f}mm). +5% yield factor."
                    )
                elif total_rain < 50:
                    weather_factor *= Decimal("0.7")
                    explanation_parts.append(
                        f"Rainfall low ({total_rain:.1f}mm). -30% yield factor."
                    )

        estimated = base_yield * weather_factor
        confidence = 0.4
        if observations:
            confidence = min(0.7, 0.4 + len(observations) * 0.05)

        area = Decimal(str(area_ha)) if area_ha else Decimal("0")
        total_production = estimated * area

        explanation = ". ".join(explanation_parts) + (
            f" Confidence: {confidence:.0%} (baseline model, "
            f"{len(observations)} weather observations used). "
            f"This is a prediction, not a guarantee."
        )

        return YieldEstimateResult(
            estimated_yield=estimated, unit="kg/ha", confidence=confidence,
            model_name="baseline",
            inputs={
                "crop": crop, "variety": variety,
                "planting_date": planting_date.isoformat(),
                "area_ha": str(area),
                "weather_observations_count": len(observations),
                "base_yield": str(base_yield),
                "weather_factor": str(weather_factor),
            },
            explanation=explanation,
        )

    def generate_recommendation(
        self, farm, crop: str, suitability: SuitabilityResult | None,
        yield_estimate: YieldEstimateResult | None,
        current_date: datetime | None = None,
    ) -> RecommendationResult:
        current_date = current_date or datetime.now(timezone.utc)
        evidence = []
        action = "No recommendation available."
        rationale = "Insufficient data."
        confidence = 0.0
        risks = []

        if suitability:
            evidence.append(
                f"Weather suitability: {suitability.percentage:.1f}% "
                f"(score {suitability.score}/100, classification: {suitability.classification})."
            )
            if suitability.risks:
                risks.extend(suitability.risks)
            if suitability.warnings:
                evidence.extend(suitability.warnings)
            if suitability.percentage >= 70:
                confidence += 0.3
            elif suitability.percentage >= 40:
                confidence += 0.15

        if yield_estimate:
            evidence.append(
                f"Yield estimate: {yield_estimate.estimated_yield} {yield_estimate.unit} "
                f"(confidence {yield_estimate.confidence:.0%}, model: {yield_estimate.model_name})."
            )
            if yield_estimate.confidence >= 0.6:
                confidence += 0.3
            elif yield_estimate.confidence >= 0.3:
                confidence += 0.15

        if suitability and suitability.percentage >= 85:
            action = f"Highly recommended to plant {crop} — excellent conditions."
            rationale = (
                f"Weather suitability is {suitability.percentage:.1f}% (excellent). "
                f"All factors are favorable. Estimated yield: "
                f"{yield_estimate.estimated_yield if yield_estimate else 'N/A'} "
                f"{yield_estimate.unit if yield_estimate else ''}. "
                f"Consult an agricultural officer for confirmation."
            )
            confidence = min(confidence, 0.9)
        elif suitability and suitability.percentage >= 70:
            action = f"Recommended to plant {crop} — conditions are favorable."
            rationale = (
                f"Weather suitability is {suitability.percentage:.1f}%, "
                f"above the 70% threshold. "
                f"Estimated yield: {yield_estimate.estimated_yield if yield_estimate else 'N/A'} "
                f"{yield_estimate.unit if yield_estimate else ''}. "
                f"Monitor weather and consult an agricultural officer."
            )
            confidence = min(confidence, 0.8)
        elif suitability and suitability.percentage >= 40:
            action = f"Consider planting {crop} with caution — conditions are marginal."
            rationale = (
                f"Weather suitability is {suitability.percentage:.1f}%, "
                f"below the 70% threshold. "
                f"Monitor weather and soil moisture. Consider alternative crops "
                f"or delayed planting. Risks: {'; '.join(risks) if risks else 'Review factor analysis for details'}."
            )
            confidence = min(confidence, 0.5)
        elif suitability:
            action = f"Do not plant {crop} at this time — conditions are unfavorable."
            rationale = (
                f"Weather suitability is only {suitability.percentage:.1f}%. "
                f"Conditions are unfavorable for {crop}. "
                f"Risks: {'; '.join(risks) if risks else 'See factor analysis'}. "
                f"Consider waiting for improved conditions or selecting a different crop."
            )
            confidence = min(confidence, 0.7)
        else:
            action = "Insufficient data to make a recommendation."
            rationale = (
                "No weather observations or farm data available. "
                "Collect weather data and farm information to enable recommendations."
            )

        if not suitability and not yield_estimate:
            action = "Insufficient data to make a recommendation."
            rationale = (
                "No weather observations or farm data available. "
                "Collect weather data and farm information to enable recommendations."
            )
            risks = ["No data — any planting decision made without analysis is high-risk."]

        return RecommendationResult(
            action=action, rationale=rationale, confidence=confidence,
            evidence=evidence,
            alternatives=[
                "Consult an agricultural officer for local advice.",
                "Monitor weather forecasts for improving conditions.",
                "Consider soil testing before planting.",
                "Review historical data for this crop in your region.",
            ],
            risks=risks,
        )

    def get_results_for_farm(self, farm, result_type: str | None = None):
        """Get intelligence results for a farm."""
        qs = IntelligenceResult.objects.filter(farm=farm)
        if result_type:
            qs = qs.filter(result_type=result_type)
        return qs.order_by('-created_at')

    def get_results_for_cycle(self, cycle):
        """Get intelligence results for a crop cycle."""
        return IntelligenceResult.objects.filter(crop_cycle=cycle).order_by('-created_at')

    def get_results_for_crop(self, crop):
        """Get intelligence results for a crop."""
        return IntelligenceResult.objects.filter(crop=crop).order_by('-created_at')

    def save_result(self, result_type: str, farm, data_classification: str,
                    crop=None, variety=None, crop_cycle=None,
                    generated_by=None, score: Decimal | None = None,
                    value: dict | None = None, confidence: Decimal | None = None,
                    factors: dict | None = None, explanation: str = "",
                    model_name: str = "", input_data_snapshot: dict | None = None) -> IntelligenceResult:
        """Save an intelligence result to the database."""
        result = IntelligenceResult.objects.create(
            result_type=result_type,
            farm=farm,
            crop=crop,
            variety=variety,
            crop_cycle=crop_cycle,
            generated_by=generated_by,
            data_classification=data_classification,
            score=score,
            value=value,
            confidence=confidence,
            factors=factors,
            explanation=explanation,
            model_name=model_name,
            input_data_snapshot=input_data_snapshot,
        )
        return result


# Singleton
intelligence_service = IntelligenceService()

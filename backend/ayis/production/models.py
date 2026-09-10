"""
AYIS production models.

Production records (harvests) are OBSERVED data entered by farmers.
Actual yield is compared against predictions for model evaluation.
"""

from django.db import models
from ayis.cycles.models import CropCycle
from ayis.users.models import User
from ayis.intelligence.models import IntelligenceResult


class Harvest(models.Model):
    """
    A harvest record for a crop cycle.

    OBSERVED data: quantity, area, actual yield, date.
    Multiple harvests can be recorded for a single cycle.
    """

    cycle = models.ForeignKey(
        CropCycle,
        on_delete=models.CASCADE,
        related_name="harvests",
        help_text="Crop cycle this harvest belongs to.",
    )

    harvest_date = models.DateField(
        help_text="Date of harvest.",
    )

    # Production data (OBSERVED)
    production_area_ha = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Area harvested in this record (ha).",
    )
    quantity_kg = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Quantity harvested (kg).",
    )
    actual_yield_kg_ha = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Actual yield calculated as quantity / area (kg/ha).",
    )

    # Quality
    quality_grade = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Quality grade (e.g. 'A', 'B', 'standard').",
    )
    quality_notes = models.TextField(
        blank=True,
        default="",
        help_text="Notes on quality.",
    )

    # Economic
    sale_price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sale price per kg (currency units).",
    )
    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total revenue from this harvest (currency units).",
    )

    # Storage
    storage_used = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Storage type used (e.g. 'silo', 'bag', 'cold storage').",
    )
    storage_loss_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Storage loss percentage.",
    )

    # Notes
    notes = models.TextField(
        blank=True,
        default="",
        help_text="General notes about this harvest.",
    )

    # Intelligence link — which prediction is this harvest validating?
    predicted_intelligence = models.ForeignKey(
        IntelligenceResult,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_by_harvests",
        help_text="The intelligence result (yield estimate) this harvest validates.",
    )

    # Metadata
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="recorded_harvests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "harvest"
        verbose_name_plural = "harvests"
        ordering = ["-harvest_date"]
        indexes = [
            models.Index(fields=["cycle", "harvest_date"]),
            models.Index(fields=["actual_yield_kg_ha"]),
        ]

    def __str__(self) -> str:
        return f"Harvest {self.harvest_date} — {self.quantity_kg}kg from {self.cycle}"

    def save(self, *args, **kwargs):
        # Auto-calculate actual yield if quantity and area are set
        if self.quantity_kg is not None and self.production_area_ha is not None and self.production_area_ha > 0:
            self.actual_yield_kg_ha = self.quantity_kg / self.production_area_ha
        super().save(*args, **kwargs)

    def calculate_yield_comparison(self) -> dict | None:
        """
        Compare actual yield against predicted yield from linked intelligence.

        Returns comparison data or None if no prediction to compare against.
        """
        if self.predicted_intelligence is None:
            return None

        predicted = self.predicted_intelligence.value
        if predicted is None:
            return None

        predicted_yield = predicted.get("estimated_yield")
        if predicted_yield is None:
            return None

        from decimal import Decimal
        predicted_decimal = Decimal(str(predicted_yield))
        actual_decimal = self.actual_yield_kg_ha

        if actual_decimal is None or predicted_decimal == 0:
            return None

        difference = actual_decimal - predicted_decimal
        difference_pct = (difference / predicted_decimal) * 100

        return {
            "predicted_yield_kg_ha": str(predicted_yield),
            "actual_yield_kg_ha": str(actual_decimal),
            "difference_kg_ha": str(difference),
            "difference_pct": round(float(difference_pct), 1),
            "actual_is_higher": actual_decimal > predicted_decimal,
        }


class HarvestService:
    """
    Stateless service for harvest/production operations.
    """

    @staticmethod
    def get_harvests_for_cycle(cycle: CropCycle):
        """Return all harvests for a cycle, newest first."""
        return Harvest.objects.filter(cycle=cycle).order_by("-harvest_date")

    @staticmethod
    def get_total_production_for_cycle(cycle: CropCycle) -> dict:
        """Get total production stats for a cycle."""
        harvests = Harvest.objects.filter(cycle=cycle)
        total_qty = sum((h.quantity_kg or 0) for h in harvests)
        total_area = sum((h.production_area_ha or 0) for h in harvests)
        total_revenue = sum((h.total_revenue or 0) for h in harvests)
        avg_yield = total_qty / total_area if total_area > 0 else None

        return {
            "total_quantity_kg": total_qty,
            "total_area_ha": total_area,
            "average_yield_kg_ha": avg_yield,
            "total_revenue": total_revenue,
            "harvest_count": harvests.count(),
        }

    @staticmethod
    def record_harvest(
        cycle: CropCycle,
        harvest_date,
        quantity_kg,
        production_area_ha,
        recorded_by: User | None = None,
        **extra,
    ) -> Harvest:
        """Record a new harvest for a cycle."""
        from decimal import Decimal

        harvest = Harvest.objects.create(
            cycle=cycle,
            harvest_date=harvest_date,
            quantity_kg=Decimal(str(quantity_kg)) if quantity_kg is not None else None,
            production_area_ha=Decimal(str(production_area_ha)) if production_area_ha is not None else None,
            recorded_by=recorded_by,
            **extra,
        )

        # Update cycle status if this is the first harvest
        from datetime import date
        if not cycle.actual_harvest_date:
            cycle.mark_harvested(harvest_date)

        return harvest

    @staticmethod
    def get_yield_comparison_for_harvest(harvest: Harvest) -> dict | None:
        """Get yield comparison for a harvest against its linked prediction."""
        return harvest.calculate_yield_comparison()

    @staticmethod
    def get_yield_performance_stats(crop=None, limit: int = 100):
        """Get yield performance stats across harvests."""
        from django.db.models import Avg

        queryset = Harvest.objects.filter(actual_yield_kg_ha__isnull=False)
        if crop:
            queryset = queryset.filter(cycle__crop=crop)

        stats = queryset.aggregate(
            avg_yield=Avg("actual_yield_kg_ha"),
            count=queryset.count(),
        )
        return {
            "average_yield_kg_ha": float(stats["avg_yield"] or 0),
            "count": stats["count"],
        }


harvest_service = HarvestService()

"""
AYIS growth stage history — tracks crop cycle stage transitions.

Each stage transition is recorded with timestamps so the full growth
trajectory of a crop cycle is auditable. The current_stage on CropCycle
is the latest stage with no exit timestamp.

NOTE: This module uses TYPE_CHECKING + string annotations to avoid
circular imports with cycles/models.py during Django app registry
population. All model references are lazy.
"""

from __future__ import annotations

from django.db import models
from django.conf import settings

# Type checking only — avoids circular import at runtime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass  # All model references use string annotations below


class StageHistory(models.Model):
    """
    Audit trail of crop cycle stage transitions.

    Every time a crop cycle changes stage, a StageHistory record
    is created capturing the transition. This provides an auditable
    growth timeline for each cycle.
    """

    cycle = models.ForeignKey(
        'cycles.Cycle',
        on_delete=models.CASCADE,
        related_name='stage_history',
        help_text="The crop cycle this stage transition belongs to.",
    )
    from_stage = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Previous stage (empty for the first stage).",
    )
    to_stage = models.CharField(
        max_length=50,
        help_text="Stage entered at this transition.",
    )
    entered_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the stage was entered.",
    )
    exited_at = models.DateTimeField(
        null=True,
        blank=True,
        default=None,
        help_text="Timestamp when the stage was exited (NULL = current stage).",
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="stage_transitions",
        help_text="User who recorded this transition.",
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Notes about this stage (e.g. observations, actions taken).",
    )

    class Meta:
        verbose_name = "stage transition"
        verbose_name_plural = "stage transitions"
        ordering = ['-entered_at']
        indexes = [
            models.Index(fields=['cycle', '-entered_at']),
        ]

    def __str__(self) -> str:
        return f"{self.cycle} → {self.to_stage} at {self.entered_at.strftime('%Y-%m-%d %H:%M')}"

    @classmethod
    def record_transition(
        cls,
        cycle: 'CropCycle',
        to_stage: str,
        recorded_by: 'User | None' = None,
        notes: str = '',
    ) -> 'StageHistory':
        """
        Record a stage transition for a crop cycle.

        Closes the previous open stage (sets exited_at) and creates
        a new stage history entry.
        """
        from ayis.cycles.models import CycleStatus

        # Close any open stage history for this cycle
        open_stages = cls.objects.filter(
            cycle=cycle, exited_at__isnull=True
        )
        if open_stages.exists():
            previous = open_stages.first()
            previous.exited_at = cls._now()
            from_stage = previous.to_stage
            previous.save(update_fields=['exited_at'])
        else:
            from_stage = ""

        # Create new stage history entry
        stage_entry = cls.objects.create(
            cycle=cycle,
            from_stage=from_stage,
            to_stage=to_stage,
            recorded_by=recorded_by,
            notes=notes,
        )

        # Update the cycle's current_stage
        cycle.current_stage = to_stage
        if to_stage in ('harvested', 'failed', 'cancelled'):
            cycle.status = CycleStatus.COMPLETED
        elif to_stage == 'planned':
            cycle.status = CycleStatus.PLANNED
        else:
            cycle.status = CycleStatus.ACTIVE
        cycle.save(update_fields=['current_stage', 'status'])

        return stage_entry

    @classmethod
    def _now(cls):
        from django.utils import timezone
        return timezone.now()

    @classmethod
    def get_current_stage(cls, cycle: 'CropCycle') -> str:
        """Get the current stage for a cycle from stage history."""
        current = cls.objects.filter(cycle=cycle, exited_at__isnull=True).first()
        return current.to_stage if current else cycle.current_stage

    @classmethod
    def get_stage_timeline(cls, cycle: 'CropCycle') -> list[dict]:
        """
        Get the full stage timeline for a cycle as a list of dicts.

        Returns entries ordered chronologically with stage durations.
        """
        entries = list(cls.objects.filter(cycle=cycle).order_by('entered_at'))
        timeline = []
        prev_exit = None
        for entry in entries:
            timeline.append({
                'stage': entry.to_stage,
                'entered_at': entry.entered_at,
                'exited_at': entry.exited_at,
                'duration_days': None,
                'notes': entry.notes,
            })
            prev_exit = entry.exited_at
        return timeline

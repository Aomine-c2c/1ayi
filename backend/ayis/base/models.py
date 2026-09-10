"""
AYIS — base model mixins.

Shared behavior for audit trails, soft deletion, and timestamps.
"""

from django.db import models


class TimestampedModelMixin(models.Model):
    """
    Auto-managed created_at / updated_at timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class CreatedByMixin(models.Model):
    """
    Tracks who created a record (nullable for system-created data).
    """

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
        help_text="User who created this record.",
    )

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """
    Soft-deletion support.

    Records with a non-null deleted_at are considered deleted and should
    be excluded from default queries via a custom manager.
    """

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this record was soft-deleted (null = active).",
    )

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self) -> None:
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

"""
AYIS audit models and audit log service.

AuditLogEntry uses settings.AUTH_USER_MODEL (lazy string) so the model
class can be defined during django.setup() without triggering
get_user_model() too early.

AuditService (and the audit_log singleton) are imported lazily by
ayis.audit.__init__ — after Django's app registry is ready.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import models

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model as _gum
    User = _gum()
else:
    # Not resolved at import time — replaced with the real User model
    # by Django's model _meta after apps are ready.
    User = None  # type: ignore[assignment, misc]


class AuditLogEntry(models.Model):
    """
    Immutable audit log entry.

    Captures who did what, when, and what changed.
    Never updated or deleted — appends only.
    """

    class ActionType(models.TextChoices):
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        LOGIN_FAILURE = "login_failure", "Login Failure"
        PASSWORD_CHANGE = "password_change", "Password Change"
        PERMISSION_DENIED = "permission_denied", "Permission Denied"
        SYSTEM = "system", "System Operation"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_entries",
        help_text="User who performed the action (nullable for system actions).",
    )

    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        help_text="Type of action performed.",
    )

    action_object_type = models.CharField(
        max_length=50,
        help_text="Type of object affected (e.g. 'farm', 'user', 'crop_cycle').",
    )

    action_object_id = models.PositiveIntegerField(
        help_text="ID of the object affected.",
    )

    description = models.TextField(
        blank=True,
        default="",
        help_text="Human-readable description of the action.",
    )

    old_values = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of values before the change (for updates/deletes).",
    )

    new_values = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of values after the change (for creates/updates).",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address when available.",
    )

    user_agent = models.TextField(
        blank=True,
        default="",
        help_text="Client user agent when available.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "audit log entry"
        verbose_name_plural = "audit log entries"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["action_object_type", "action_object_id"]),
        ]

    def __str__(self) -> str:
        actor = self.actor.username if self.actor else "system"
        return f"{self.action} {self.action_object_type}({self.action_object_id}) by {actor} at {self.created_at.isoformat()}"


class AuditService:
    """
    Stateless service for audit logging.

    Use the `audit_log` singleton from ayis.audit instead of instantiating.
    """

    def log_create(
        self,
        actor: Any | None,
        object_type: str,
        object_id: int,
        description: str = "",
        new_values: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log a create operation."""
        return AuditLogEntry.objects.create(
            actor=actor,
            action=AuditLogEntry.ActionType.CREATE,
            action_object_type=object_type,
            action_object_id=object_id,
            description=description,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_update(
        self,
        actor: Any | None,
        object_type: str,
        object_id: int,
        description: str = "",
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log an update operation."""
        return AuditLogEntry.objects.create(
            actor=actor,
            action=AuditLogEntry.ActionType.UPDATE,
            action_object_type=object_type,
            action_object_id=object_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_delete(
        self,
        actor: Any | None,
        object_type: str,
        object_id: int,
        description: str = "",
        old_values: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log a delete operation."""
        return AuditLogEntry.objects.create(
            actor=actor,
            action=AuditLogEntry.ActionType.DELETE,
            action_object_type=object_type,
            action_object_id=object_id,
            description=description,
            old_values=old_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_login(
        self,
        actor: Any,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log a successful login."""
        return AuditLogEntry.objects.create(
            actor=actor,
            action=AuditLogEntry.ActionType.LOGIN,
            action_object_type="user",
            action_object_id=actor.id,
            description="User logged in.",
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_login_failure(
        self,
        username: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log a failed login attempt."""
        return AuditLogEntry.objects.create(
            action=AuditLogEntry.ActionType.LOGIN_FAILURE,
            action_object_type="user",
            action_object_id=0,
            description=f"Failed login attempt for '{username}'.",
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_permission_denied(
        self,
        actor: Any | None,
        object_type: str,
        object_id: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLogEntry:
        """Log a permission denial."""
        return AuditLogEntry.objects.create(
            actor=actor,
            action=AuditLogEntry.ActionType.PERMISSION_DENIED,
            action_object_type=object_type,
            action_object_id=object_id,
            description="Access denied.",
            ip_address=ip_address,
            user_agent=user_agent,
        )


# Singleton — imported by ayis.audit (after Django ready).
audit_log = AuditService()

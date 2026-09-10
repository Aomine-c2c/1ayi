"""
AYIS — user roles and permissions (REFINED: no eager get_user_model()).

Role model, user-role through table, and role-permission through table.

Avoids calling get_user_model() at module level to prevent the
"App 'users' doesn't have a 'User' model" crash during django.setup().
"""

from django.conf import settings
from django.db import models


class Role(models.Model):
    """
    A role that can be assigned to users.

    Roles define what a user can do at a high level:
    - farmer: manages their own farms
    - regional_officer: supervises farmers in assigned regions
    - system_admin: full platform access
    """

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default="")
    is_system = models.BooleanField(
        default=False,
        help_text="System roles (admin, officer) cannot be deleted by regular users.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "role"
        verbose_name_plural = "roles"

    def __str__(self):
        return self.name


class UserRole(models.Model):
    """
    Through table: which roles are assigned to which users.

    A user can have multiple roles (e.g. farmer + regional_officer).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_roles",
    )

    class Meta:
        unique_together = [("user", "role")]
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.user} — {self.role}"


class RolePermission(models.Model):
    """
    Through table: which permissions are granted to which roles.

    Permissions are coarse-grained action identifiers, e.g.:
    - "users.view"
    - "farms.manage"
    - "reports.generate"
    - "system.configure"
    """

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions")
    permission = models.CharField(max_length=100)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("role", "permission")]
        ordering = ["role", "permission"]

    def __str__(self):
        return f"{self.role}: {self.permission}"

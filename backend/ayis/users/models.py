"""
AYIS — User model and role models.

Custom user for AYIS plus the role models (Role, UserRole, RolePermission).
"""

from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as geo_models
from django.db import models

from ayis.users.role_models import Role, UserRole, RolePermission  # noqa: F401


class User(AbstractUser):
    class Role(models.TextChoices):
        FARMER = "farmer", "Farmer"
        OFFICER = "officer", "Agricultural Officer"
        ADMIN = "admin", "Administrator"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.FARMER,
        help_text="User role determining access scope.",
    )

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["username"]

    def __str__(self) -> str:
        return f"{self.get_role_display()} — {self.username}"

    @property
    def is_farmer(self) -> bool:
        return self.role == self.Role.FARMER

    @property
    def is_officer(self) -> bool:
        return self.role == self.Role.OFFICER

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def has_role(self, role: str) -> bool:
        return self.role == role

    def officer_accessible_farms(self):
        """Return queryset of farms this officer is authorized to access."""
        if self.role != self.Role.OFFICER:
            return Farm.objects.none()
        from ayis.farms.models import OfficerAssignment
        officer_assignments = OfficerAssignment.objects.filter(officer=self)
        return Farm.objects.filter(
        owner__in=officer_assignments.values_list('region__farms', flat=True).distinct()
        ).distinct() if officer_assignments.exists() else Farm.objects.none()

    @property
    def assigned_roles(self):
        """Return the Role objects assigned to this user via UserRole."""
        from ayis.users.role_models import UserRole as UR
        return [
            ur.role for ur in UR.objects.filter(user=self).select_related("role")
        ]

    def has_permission(self, permission_code: str) -> bool:
        """Check if user has a specific permission code (for future RBAC expansion)."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.OFFICER:
            officer_perms = {
                "users.view", "users.list", "farms.view_region",
                "cycles.view_region", "intelligence.view_region",
                "reports.view_region", "production.view_region",
                "weather.view_region",
            }
            return permission_code in officer_perms
        if self.role == self.Role.FARMER:
            farmer_perms = {
                "farms.own", "cycles.own", "production.own",
                "intelligence.own", "reports.own",
            }
            return permission_code in farmer_perms
        return False

    def can_access_farm(self, farm) -> bool:
        """Check if user can access a specific farm."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.FARMER:
            return farm.owner == self
        if self.role == self.Role.OFFICER:
            from ayis.farms.region_models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=farm
            ).exists()
        return False

    def can_access_cycle(self, cycle) -> bool:
        """Check if user can access a specific crop cycle."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.FARMER:
            return cycle.farm.owner == self
        if self.role == self.Role.OFFICER:
            from ayis.farms.models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=cycle.farm
            ).exists()
        return False

    def can_access_harvest(self, harvest) -> bool:
        """Check if user can access a specific harvest."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.FARMER:
            return harvest.cycle.farm.owner == self
        if self.role == self.Role.OFFICER:
            from ayis.farms.region_models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=harvest.cycle.farm
            ).exists()
        return False

    def can_access_weather(self, farm) -> bool:
        """Check if user can access weather data for a farm."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.FARMER:
            return farm.owner == self
        if self.role == self.Role.OFFICER:
            from ayis.farms.region_models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=farm
            ).exists()
        return False

    def can_access_intelligence(self, farm) -> bool:
        """Check if user can access intelligence for a farm."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.FARMER:
            return farm.owner == self
        if self.role == self.Role.OFFICER:
            from ayis.farms.region_models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=farm
            ).exists()
        return False

    def can_access_report(self, report) -> bool:
        """Check if user can access a specific report."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.OFFICER:
            # Officers can view reports for farms in their regions
            from ayis.farms.models import OfficerAssignment
            return OfficerAssignment.objects.filter(
                officer=self, region__farms=report.farm
            ).exists() if hasattr(report, 'farm') else True
        if self.role == self.Role.FARMER:
            return report.farm.owner == self if hasattr(report, 'farm') else False
        return False

    def can_generate_report(self, report_type: str) -> bool:
        """Check if user can generate a specific type of report."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role == self.Role.OFFICER:
            officer_reports = {
                "agricultural_officer_report",
                "system_administration_report",  # view only
            }
            return report_type in officer_reports or report_type.startswith("regional")
        if self.role == self.Role.FARMER:
            farmer_reports = {
                "farmer_report",
                "farm_report",
                "crop_report",
                "crop_cycle_report",
                "weather_report",
                "yield_prediction_report",
                "production_report",
                "recommendation_report",
            }
            return report_type in farmer_reports
        return False

    def can_manage_users(self) -> bool:
        """Check if user can manage (create/update/delete) other users."""
        return self.role == self.Role.ADMIN

    def can_manage_system_settings(self) -> bool:
        """Check if user can manage system settings."""
        return self.role == self.Role.ADMIN

    def can_access_audit_log(self) -> bool:
        """Check if user can access audit log."""
        return self.role == self.Role.ADMIN

    def can_approve_recommendations(self) -> bool:
        """Check if user can approve/reject recommendations."""
        return self.role in (self.Role.ADMIN, self.Role.OFFICER)

    def can_sync_weather(self) -> bool:
        """Check if user can trigger weather synchronization."""
        return self.role == self.Role.ADMIN

    def can_manage_regions(self) -> bool:
        """Check if user can create/update/delete regions."""
        return self.role == self.Role.ADMIN

    def can_assign_officers(self) -> bool:
        """Check if user can assign officers to regions."""
        return self.role == self.Role.ADMIN

    def can_manage_roles(self) -> bool:
        """Check if user can manage roles."""
        return self.role == self.Role.ADMIN
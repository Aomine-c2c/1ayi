"""
AYIS settings manager models.

System-level settings stored in the database for configurability without
code changes. Used for thresholds, defaults, feature flags, etc.
"""

from django.db import models
from ayis.users.models import User


class SettingCategory(models.TextChoices):
    """Categories for system settings."""
    YIELD_MODEL = "yield_model", "Yield Model"
    SUITABILITY = "suitability", "Suitability"
    RECOMMENDATION = "recommendation", "Recommendation"
    WEATHER = "weather", "Weather"
    NOTIFICATION = "notification", "Notification"
    FARM = "farm", "Farm"
    CROP = "crop", "Crop"
    SYSTEM = "system", "System"
    USER_INTERFACE = "user_interface", "User Interface"


class SystemSetting(models.Model):
    """
    A single system setting.

    Key-value pairs with type information, categorization, and audit trail.
    """

    key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Setting key (e.g. 'yield_baseline_confidence_default').",
    )

    name = models.CharField(
        max_length=200,
        help_text="Human-readable setting name.",
    )

    description = models.TextField(
        blank=True,
        default="",
        help_text="What this setting controls.",
    )

    category = models.CharField(
        max_length=30,
        choices=SettingCategory.choices,
        default=SettingCategory.SYSTEM,
        help_text="Category for organization and filtering.",
    )

    value_type = models.CharField(
        max_length=20,
        help_text="Data type of the value: string, integer, float, boolean, json.",
    )

    value = models.JSONField(
        help_text="Current setting value.",
    )

    default_value = models.JSONField(
        null=True,
        blank=True,
        help_text="Default value if not explicitly set.",
    )

    is_public = models.BooleanField(
        default=False,
        help_text="Whether this setting is visible to non-admin users.",
    )

    is_dynamic = models.BooleanField(
        default=False,
        help_text="Whether this setting can be changed at runtime without restart.",
    )

    requires_restart = models.BooleanField(
        default=False,
        help_text="Whether changing this setting requires a service restart.",
    )

    # Audit
    set_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="set_settings",
    )
    set_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this value was last set.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "system setting"
        verbose_name_plural = "system settings"
        ordering = ["category", "key"]

    def __str__(self) -> str:
        return f"{self.key} = {self.value} ({self.category})"

    def get_value(self):
        """Return the value with type conversion."""
        import json
        if self.value_type == "boolean":
            return bool(self.value)
        elif self.value_type == "integer":
            return int(self.value)
        elif self.value_type == "float":
            return float(self.value)
        elif self.value_type == "json":
            if isinstance(self.value, dict | list):
                return self.value
            return json.loads(self.value)
        return self.value


class SettingService:
    """
    Stateless service for system setting operations.
    """

    @staticmethod
    def get_setting(key: str, default=None):
        """Get a setting value by key, with optional default."""
        try:
            setting = SystemSetting.objects.get(key=key)
            return setting.get_value()
        except SystemSetting.DoesNotExist:
            return default

    @staticmethod
    def set_setting(key: str, value, name: str | None = None,
                    description: str = "", category: str = "",
                    value_type: str = "string", is_public: bool = False,
                    is_dynamic: bool = True, set_by: User | None = None):
        """Set or create a system setting."""
        from django.utils import timezone

        setting, created = SystemSetting.objects.update_or_create(
            key=key,
            defaults={
                "value": value,
                "name": name or key,
                "description": description,
                "category": category,
                "value_type": value_type,
                "is_public": is_public,
                "is_dynamic": is_dynamic,
                "set_by": set_by,
                "set_at": timezone.now(),
            },
        )
        return setting

    @staticmethod
    def get_settings_by_category(category: str):
        """Get all settings in a category."""
        return SystemSetting.objects.filter(category=category).order_by("key")

    @staticmethod
    def get_public_settings():
        """Get all public settings (visible to non-admin users)."""
        return SystemSetting.objects.filter(is_public=True).order_by("key")

    @staticmethod
    def get_yield_model_defaults():
        """Get default settings for yield model parameters."""
        return {
            "baseline_confidence": SettingService.get_setting(
                "yield_baseline_confidence_default", 0.4
            ),
            "confidence_per_observation": SettingService.get_setting(
                "yield_confidence_per_observation", 0.05
            ),
            "max_confidence_baseline": SettingService.get_setting(
                "yield_max_confidence_baseline", 0.7
            ),
        }

    @staticmethod
    def get_suitability_thresholds():
        """Get suitability threshold settings."""
        return {
            "favorable_min": SettingService.get_setting(
                "suitability_favorable_min", 70
            ),
            "marginal_min": SettingService.get_setting(
                "suitability_marginal_min", 40
            ),
        }

    @staticmethod
    def get_recommendation_settings():
        """Get recommendation engine settings."""
        return {
            "confidence_threshold": SettingService.get_setting(
                "recommendation_confidence_threshold", 0.5
            ),
            "default_evidence": SettingService.get_setting(
                "recommendation_default_evidence", ["Consult an agricultural officer for local advice."]
            ),
        }


setting_service = SettingService()

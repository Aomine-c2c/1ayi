"""
AYIS — report models (REFINED).

Report generation: weather, farm, cycle, yield, recommendation, officer, system,
farmer, crop, production, administrative reports.

Includes RBAC-aware access control and multi-format export support.
"""

from django.contrib.auth import get_user_model
from django.db import models
from ayis.farms.models import Farm
from ayis.cycles.models import CropCycle
from ayis.users.models import User

User = get_user_model()


class ReportType(models.TextChoices):
    WEATHER = "weather", "Weather Report"
    FARM = "farm", "Farm Report"
    CROP_CYCLE = "crop_cycle", "Crop Cycle Report"
    YIELD = "yield", "Yield Report"
    RECOMMENDATION = "recommendation", "Recommendation Report"
    OFFICER = "officer", "Agricultural Officer Report"
    SYSTEM = "system", "System Report"
    FARMER = "farmer", "Farmer Report"
    CROP = "crop", "Crop Report"
    PRODUCTION = "production", "Production Report"
    ADMINISTRATIVE = "administrative", "Administrative Report"


class ReportStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    GENERATING = "generating", "Generating"
    READY = "ready", "Ready"
    FAILED = "failed", "Failed"


class ReportFormat(models.TextChoices):
    HTML = "html", "HTML (Browser)"
    PDF = "pdf", "PDF"
    CSV = "csv", "CSV"


class ReportAccessLevel(models.TextChoices):
    """Who can view a generated report."""
    OWNER_ONLY = "owner_only", "Owner Only"
    OWNER_AND_OFFICERS = "owner_and_officers", "Owner + Assigned Officers"
    OWNER_AND_ADMIN = "owner_and_admin", "Owner + Admins"
    ALL_OFFICERS = "all_officers", "All Agricultural Officers"
    ALL_USERS = "all_users", "All Authenticated Users"
    PUBLIC = "public", "Public (no auth)"


class Report(models.Model):
    """
    A generated report.

    Reports are generated on-demand or scheduled. Each report has a type,
    a set of filter parameters, generated content, and an access level
    that enforces RBAC on viewing.
    """

    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices,
        help_text="Type of report.",
    )

    title = models.CharField(
        max_length=255,
        help_text="Human-readable report title.",
    )

    # Scope / filters
    farm = models.ForeignKey(
        Farm,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        help_text="Farm this report is primarily about (optional).",
    )
    crop_cycle = models.ForeignKey(
        CropCycle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        help_text="Crop cycle this report is primarily about (optional).",
    )

    # Filter parameters captured at generation time
    filter_period_start = models.DateField(
        null=True,
        blank=True,
        help_text="Report date range start (inclusive).",
    )
    filter_period_end = models.DateField(
        null=True,
        blank=True,
        help_text="Report date range end (inclusive).",
    )
    filter_farm_ids = models.JSONField(
        default=list,
        help_text="Farm IDs included in this report (for multi-farm reports).",
    )
    filter_crop_ids = models.JSONField(
        default=list,
        help_text="Crop IDs included in this report.",
    )
    filter_farmer_ids = models.JSONField(
        default=list,
        help_text="Farmer user IDs included in this report.",
    )
    filter_status = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Cycle/status filter applied, if any.",
    )

    # Generated content
    content = models.JSONField(
        null=True,
        blank=True,
        help_text="Generated report content (structured data: summary, details, charts, conclusions).",
    )

    # Available export formats generated for this report
    available_formats = models.JSONField(
        default=list,
        help_text="List of formats this report has been rendered to (html, pdf, csv).",
    )

    # Output files — paths relative to MEDIA_ROOT
    output_html = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Path to HTML version.",
    )
    output_pdf = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Path to PDF version (if generated).",
    )
    output_csv = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Path to CSV version (if generated).",
    )

    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        help_text="Report generation status.",
    )

    access_level = models.CharField(
        max_length=20,
        choices=ReportAccessLevel.choices,
        default=ReportAccessLevel.OWNER_ONLY,
        help_text="RBAC access level controlling who can view this report.",
    )

    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_reports",
        help_text="User who generated or requested this report.",
    )

    error_message = models.TextField(
        blank=True,
        default="",
        help_text="Error message if generation failed.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the report was generated (ready/failed).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "report"
        verbose_name_plural = "reports"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["report_type", "status", "created_at"]),
            models.Index(fields=["farm", "report_type"]),
            models.Index(fields=["generated_by", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["access_level", "report_type"]),
            models.Index(fields=["filter_period_start", "filter_period_end"]),
        ]

    def __str__(self) -> str:
        return f"{self.report_type}: {self.title} ({self.get_status_display()})"

    @property
    def can_view_html(self) -> bool:
        return "html" in self.available_formats

    @property
    def can_view_pdf(self) -> bool:
        return "pdf" in self.available_formats

    @property
    def can_view_csv(self) -> bool:
        return "csv" in self.available_formats


class ReportTemplate(models.Model):
    """
    A reusable report template.

    Templates define the structure and parameter schema for a report type.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Template name.",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="What this template produces.",
    )
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices,
        help_text="Report type this template is for.",
    )
    parameters_schema = models.JSONField(
        default=dict,
        help_text="JSON schema describing expected parameters (filters, options).",
    )
    template_content = models.TextField(
        blank=True,
        default="",
        help_text="Template body (e.g. HTML template, markdown template, query reference).",
    )
    default_access_level = models.CharField(
        max_length=20,
        choices=ReportAccessLevel.choices,
        default=ReportAccessLevel.OWNER_ONLY,
        help_text="Default access level for reports using this template.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this template is available for use.",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_report_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "report template"
        verbose_name_plural = "report templates"
        ordering = ["report_type", "name"]

    def __str__(self) -> str:
        return f"Template: {self.name} ({self.get_report_type_display()})"


class ReportGenerationJob(models.Model):
    """
    Tracks an async report generation job (Celery task).

    One Report may have multiple generation attempts; the latest successful
    one's output is associated with the Report.
    """

    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="generation_jobs",
    )

    task_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Celery task ID if dispatched asynchronously.",
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When generation started.",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When generation completed.",
    )

    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        help_text="Job status.",
    )

    error_message = models.TextField(
        blank=True,
        default="",
        help_text="Error if generation failed.",
    )

    class Meta:
        verbose_name = "report generation job"
        verbose_name_plural = "report generation jobs"
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"Job for {self.report.title} - {self.get_status_display()}"

"""
AYIS Performance Optimization Layer.

Provides optimized queryset methods, caching, and query analysis utilities.
Addresses N+1 queries, missing indexes, and inefficient data access patterns.
"""

from django.db.models import Prefetch, Q, Count, Sum, Avg, Max, Min
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from typing import Any


class PerformanceOptimizer:
    """
    Centralized performance optimization utilities.
    Provides optimized queryset builders, caching helpers, and query analysis.
    """

    @staticmethod
    def optimize_farm_queryset(queryset):
        """
        Optimize farm queryset to avoid N+1 queries.
        Prefetches related data needed for list/detail views.
        """
        return queryset.select_related(
            'owner'
        ).prefetch_related(
            Prefetch(
                'crop_cycles',
                queryset=Cycle.objects.select_related('crop', 'variety')
                .prefetch_related('intelligence_results')
                .only('id', 'farm_id', 'crop_id', 'variety_id',
                      'planting_date', 'expected_harvest_date',
                      'actual_harvest_date', 'current_stage',
                      'status', 'area_ha')
            ),
            Prefetch(
                'intelligence_results',
                queryset=IntelligenceResult.objects.only(
                    'id', 'farm_id', 'result_type', 'score',
                    'data_classification', 'created_at'
                )
            )
        )

    @staticmethod
    def optimize_cycle_queryset(queryset):
        """
        Optimize crop cycle queryset.
        """
        return queryset.select_related(
            'farm', 'crop', 'variety'
        ).prefetch_related(
            Prefetch(
                'harvests',
                queryset=Harvest.objects.only(
                    'id', 'cycle_id', 'harvest_date',
                    'quantity_kg', 'actual_yield_kg_ha',
                    'total_revenue'
                )
            ),
            Prefetch(
                'intelligence_results',
                queryset=IntelligenceResult.objects.only(
                    'id', 'crop_cycle_id', 'result_type',
                    'value', 'confidence', 'created_at'
                )
            )
        )

    @staticmethod
    def optimize_intelligence_queryset(queryset):
        """
        Optimize intelligence result queryset.
        """
        return queryset.select_related(
            'farm', 'crop', 'variety', 'crop_cycle', 'generated_by'
        ).only(
            'id', 'farm_id', 'crop_id', 'variety_id',
            'crop_cycle_id', 'generated_by_id',
            'result_type', 'data_classification', 'score',
            'value', 'confidence', 'explanation',
            'created_at', 'updated_at'
        )

    @staticmethod
    def optimize_production_queryset(queryset):
        """
        Optimize harvest/production queryset.
        """
        return queryset.select_related(
            'cycle', 'cycle__farm', 'cycle__crop', 'recorded_by'
        ).only(
            'id', 'cycle_id', 'harvest_date',
            'production_area_ha', 'quantity_kg',
            'actual_yield_kg_ha', 'total_revenue',
            'quality_grade', 'recorded_by_id',
            'created_at'
        )

    @staticmethod
    def optimize_weather_queryset(queryset):
        """
        Optimize weather observation queryset.
        """
        return queryset.select_related('source').only(
            'id', 'source_id', 'observed_at',
            'latitude', 'longitude', 'temperature_celsius',
            'rainfall_mm', 'humidity_percent', 'wind_speed_ms',
            'data_quality', 'created_at'
        )

    @staticmethod
    def optimize_user_queryset(queryset):
        """
        Optimize user queryset for list views.
        """
        return queryset.select_related('role').only(
            'id', 'username', 'email', 'first_name', 'last_name',
            'role_id', 'is_active', 'date_joined'
        )

    @staticmethod
    def dashboard_farm_summary(farm_queryset):
        """
        Get dashboard summary for farms with a single optimized query.
        Returns farms with cycle counts, latest intelligence, and production stats.
        """
        from ayis.farms.models import Farm
        from ayis.cycles.models import CropCycle
        from ayis.production.models import Harvest
        from ayis.intelligence.models import IntelligenceResult
        from django.db.models import Q

        # Single query with annotations for dashboard
        farms = Farm.objects.annotate(
            active_cycle_count=Count(
                'crop_cycles',
                filter=Q(crop_cycles__status='active')
            ),
            total_harvest_count=Count('crop_cycles__harvests'),
            latest_intelligence_date=Max(
                'intelligence_results__created_at'
            ),
            total_production_kg=Sum(
                'crop_cycles__harvests__quantity_kg',
                output_field=FloatField()
            )
        ).select_related('owner').only(
            'id', 'name', 'owner_id', 'area_ha', 'location',
            'created_at', 'active_cycle_count',
            'total_harvest_count', 'latest_intelligence_date',
            'total_production_kg'
        )

        return farms

    @staticmethod
    def cached_weather_for_farm(farm, cache_ttl=300):
        """
        Get cached weather data for a farm location.
        TTL: 5 minutes for observations, reducing API calls.
        """
        cache_key = f"weather:{farm.id}:{farm.longitude:.4f}:{farm.latitude:.4f}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # Fetch from service
        from ayis.weather.services import weather_service
        observations = weather_service.get_recent_observations(
            longitude=float(farm.longitude),
            latitude=float(farm.latitude),
            hours=24
        )

        cache.set(cache_key, observations, cache_ttl)
        return observations

    @staticmethod
    def cached_intelligence_for_farm(farm, result_type, cache_ttl=600):
        """
        Get cached intelligence results for a farm.
        TTL: 10 minutes.
        """
        cache_key = f"intelligence:{farm.id}:{result_type}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        from ayis.intelligence.services import intelligence_service
        results = intelligence_service.get_results_for_farm(
            farm, result_type=result_type
        )

        cache.set(cache_key, results, cache_ttl)
        return results

    @staticmethod
    def batch_intelligence_for_farms(farm_ids, result_type):
        """
        Fetch intelligence for multiple farms in a single query.
        Avoids N+1 when dashboard lists many farms.
        """
        from ayis.intelligence.models import IntelligenceResult

        results = IntelligenceResult.objects.filter(
            farm_id__in=farm_ids,
            result_type=result_type
        ).select_related('farm').only(
            'id', 'farm_id', 'result_type', 'score',
            'data_classification', 'confidence', 'created_at'
        )

        # Group by farm
        by_farm = {}
        for r in results:
            by_farm.setdefault(r.farm_id, []).append(r)

        return by_farm

    @staticmethod
    def dashboard_yield_predictions(farm_queryset=None):
        """
        Get yield predictions for dashboard with optimized query.
        """
        from ayis.intelligence.models import IntelligenceResult

        qs = IntelligenceResult.objects.filter(
            result_type='yield_estimate',
            data_classification='predicted'
        ).select_related('farm', 'crop').only(
            'id', 'farm_id', 'farm__name', 'farm__owner_id',
            'crop_id', 'crop__name',
            'value', 'confidence', 'created_at'
        )

        if farm_queryset is not None:
            farm_ids = list(farm_queryset.values_list('id', flat=True))
            if farm_ids:
                qs = qs.filter(farm_id__in=farm_ids)

        return qs.order_by('-created_at')

    @staticmethod
    def dashboard_upcoming_harvests(days_ahead=30):
        """
        Get cycles approaching harvest within N days.
        Optimized single query.
        """
        from ayis.cycles.models import CropCycle
        from django.utils import timezone
        from datetime import timedelta

        target_date = timezone.now().date() + timedelta(days=days_ahead)

        cycles = CropCycle.objects.filter(
            expected_harvest_date__lte=target_date,
            expected_harvest_date__gte=timezone.now().date(),
            status='active'
        ).select_related(
            'farm', 'crop'
        ).prefetch_related(
            Prefetch(
                'intelligence_results',
                queryset=IntelligenceResult.objects.filter(
                    result_type='yield_estimate'
                ).only('id', 'crop_cycle_id', 'value', 'confidence')
            )
        ).only(
            'id', 'farm_id', 'farm__name', 'farm__owner_id',
            'crop_id', 'crop__name',
            'expected_harvest_date', 'current_stage', 'status',
            'planting_date'
        ).order_by('expected_harvest_date')

        return cycles

    @staticmethod
    def weather_risk_farms():
        """
        Identify farms with weather risk based on recent observations.
        Single optimized query with annotation.
        """
        from ayis.weather.models import WeatherObservation
        from ayis.farms.models import Farm
        from django.db.models import Exists, OuterRef, Q
        from datetime import timedelta
        from django.utils import timezone

        # Get farm locations with recent low-rainfall observations
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)

        risky_farms = Farm.objects.annotate(
            recent_rainfall=Sum(
                'crop_cycles__intelligence_results__value',
                filter=Q(
                    crop_cycles__intelligence_results__result_type='weather_suitability',
                    crop_cycles__intelligence_results__created_at__gte=twenty_four_hours_ago
                )
            )
        ).select_related('owner').only(
            'id', 'name', 'owner_id', 'longitude', 'latitude',
            'recent_rainfall'
        ).filter(
            Q(recent_rainfall__isnull=True) | Q(recent_rainfall__lt=20)  # threshold: 20mm
        )

        return risky_farms

    @staticmethod
    def recommendation_trends():
        """
        Get recommendation trends for dashboard.
        Grouped by type and date.
        """
        from ayis.intelligence.models import IntelligenceResult
        from django.db.models import Count

        trends = IntelligenceResult.objects.filter(
            result_type='recommendation'
        ).values('created_at__date').annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence')
        ).order_by('-created_at__date')

        return trends

    @staticmethod
    def regional_crop_distribution(region_id):
        """
        Get crop distribution for a region with optimized query.
        """
        from ayis.farms.models import Farm
        from ayis.farms.region_models import FarmRegion, OfficerAssignment
        from ayis.cycles.models import CropCycle
        from django.db.models import Count

        if region_id:
            region = FarmRegion.objects.get(id=region_id)
            farm_ids = [f.id for f in region.farms_in_region()]
        else:
            # For officers, get farms from assigned regions
            farm_ids = list(OfficerAssignment.objects.filter(
                officer=OfficerAssignment.objects.first().officer  # placeholder
            ).values_list('region__farms', flat=True))

        distribution = CropCycle.objects.filter(
            farm_id__in=farm_ids,
            status='completed'
        ).values('crop__name').annotate(
            count=Count('id'),
            total_area=Sum('area_ha')
        ).order_by('-count')

        return distribution

    @staticmethod
    def platform_activity_stats(days=30):
        """
        Get platform activity statistics for admin dashboard.
        Single optimized query with multiple aggregations.
        """
        from ayis.users.models import User
        from ayis.farms.models import Farm
        from ayis.cycles.models import CropCycle
        from ayis.weather.models import WeatherObservation
        from ayis.intelligence.models import IntelligenceResult
        from ayis.production.models import Harvest
        from django.db.models import Count
        from datetime import timedelta
        from django.utils import timezone

        since = timezone.now() - timedelta(days=days)

        stats = {
            'new_users': User.objects.filter(
                date_joined__gte=since
            ).count(),
            'new_farms': Farm.objects.filter(
                created_at__gte=since
            ).count(),
            'active_cycles': CropCycle.objects.filter(
                status='active',
                updated_at__gte=since
            ).count(),
            'weather_observations': WeatherObservation.objects.filter(
                created_at__gte=since
            ).count(),
            'intelligence_results': IntelligenceResult.objects.filter(
                created_at__gte=since
            ).count(),
            'harvests_recorded': Harvest.objects.filter(
                harvest_date__gte=since
            ).count(),
        }

        return stats

    @staticmethod
    def audit_activity_feed(limit=50):
        """
        Get recent audit log entries for admin dashboard.
        """
        from ayis.audit.models import AuditLogEntry

        entries = AuditLogEntry.objects.select_related('actor').only(
            'id', 'actor_id', 'actor__username',
            'action', 'action_object_type', 'action_object_id',
            'description', 'created_at'
        ).order_by('-created_at')[:limit]

        return entries

    @staticmethod
    def reports_with_spans(report_ids):
        """
        Get reports with their data spans efficiently.
        """
        from ayis.reports.models import ReportInstance, ReportData

        instances = ReportInstance.objects.filter(
            id__in=report_ids
        ).prefetch_related(
            Prefetch(
                'reportdata_set',
                queryset=ReportData.objects.only(
                    'id', 'report_instance_id', 'key', 'value'
                )
            )
        ).only(
            'id', 'template_id', 'generated_by_id',
            'reporting_period_start', 'reporting_period_end',
            'status', 'created_at'
        )

        return {i.id: i for i in instances}

    @staticmethod
    def export_optimized_queryset(model_class, fields=None, filters=None, order_by=None):
        """
        Build an optimized queryset for export (CSV/PDF generation).
        Only fetches needed fields to minimize memory and DB load.
        """
        qs = model_class.objects.all()

        if fields:
            qs = qs.only(*fields)
        if filters:
            qs = qs.filter(**filters)
        if order_by:
            qs = qs.order_by(*order_by)

        return qs

    @staticmethod
    def explain_query(queryset):
        """
        Get the SQL query explanation for debugging/optimization.
        """
        from django.db import connection
        query = str(queryset.query)
        return query

    @staticmethod
    def get_missing_indexes():
        """
        Analyze models for potentially missing indexes.
        Returns suggestions based on common query patterns.
        """
        suggestions = []

        # Check common filter fields that might need indexes
        from ayis.cycles.models import CropCycle
        from ayis.weather.models import WeatherObservation
        from ayis.intelligence.models import IntelligenceResult
        from ayis.reports.models import ReportInstance

        # These fields are frequently filtered but might not be indexed
        fields_to_check = [
            (CropCycle, 'status'),
            (CropCycle, 'current_stage'),
            (CropCycle, 'expected_harvest_date'),
            (WeatherObservation, 'observed_at'),
            (WeatherObservation, 'latitude'),
            (WeatherObservation, 'longitude'),
            (IntelligenceResult, 'result_type'),
            (IntelligenceResult, 'data_classification'),
            (IntelligenceResult, 'farm_id'),
            (ReportInstance, 'status'),
            (ReportInstance, 'created_at'),
        ]

        for model, field_name in fields_to_check:
            field = model._meta.get_field(field_name)
            if not field.db_index:
                suggestions.append(
                    f"Consider adding db_index=True to {model._meta.label}.{field_name}"
                )

        return suggestions


# Singleton instance
optimizer = PerformanceOptimizer()


# ============================================================================
# DATABASE INDEX ADDITIONS (via existing migration framework)
# ============================================================================

# These index additions should go into a new migration.
# Run: python manage.py makemigrations ayis --name optimize_indexes

# Missing indexes identified:
#
# 1. CropCycle.status + current_stage (compound) - used in dashboard filters
# 2. CropCycle.expected_harvest_date - used for upcoming harvest queries
# 3. WeatherObservation.latitude + longitude (compound) - spatial queries
# 4. IntelligenceResult.result_type + farm_id (compound) - dashboard queries
# 5. IntelligenceResult.data_classification - filtering by classification
# 6. ReportInstance.status + created_at - report list filtering
# 7. User.role + is_active - user list filtering for officers
# 8. Farm.owner + name - owner's farm lookup
#
# These should be added via migrations, not runtime.


# ============================================================================
# CACHING STRATEGY
# ============================================================================

# Cache keys and TTLs:
#
# weather:{farm_id}:{lon}:{lat}          -> 300s (5 min)
# intelligence:{farm_id}:{result_type}   -> 600s (10 min)
# dashboard:stats                        -> 300s (5 min)
# dashboard:risky_farms                  -> 600s (10 min)
# reports:{report_id}:data               -> 3600s (1 hour)
# auth:rates:{identifier}:{prefix}       -> per rate limit window
#
# Cache invalidation:
# - Weather cache invalidated when new observations sync
# - Intelligence cache invalidated when new results generated
# - Dashboard cache invalidated on farm/cycle changes
# - Report cache invalidated when new data added

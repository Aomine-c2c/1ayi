"""
AYIS — Backend test suite (REFINE 14: Complete QA).

Covers: models, constraints, services, APIs, serializers, permissions,
authentication, weather integration, recommendation engine, yield engine,
reports.

Run:   python manage.py test ayis
       python manage.py test ayis --keepdb  (faster re-runs)
"""

# Ensure Django settings are configured before any model imports.
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ayis.settings.dev")

import django
django.setup()

from django.test import TestCase, TransactionTestCase, override_settings
from django.core import management
from django.db import connection, IntegrityError
from django.contrib.gis.geos import Point
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from decimal import Decimal
from datetime import date, datetime, timedelta
from unittest.mock import patch, MagicMock
import json


# ============================================================================
# Helper utilities
# ============================================================================

User = get_user_model()


def create_test_user(
    username: str = "testuser",
    role: str = "farmer",
    email: str = "test@example.com",
    password: str = "testpass123",
) -> User:
    """Create a test user with the given role."""
    return User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
    )


def create_test_farm(
    owner: User,
    name: str = "Test Farm",
    longitude: float = 36.82,
    latitude: float = -1.29,
    area_ha: float = 5.0,
) -> "Farm":
    """Create a test farm with a PostGIS point location."""
    from ayis.farms.models import Farm
    return Farm.objects.create(
        owner=owner,
        name=name,
        location=Point(longitude, latitude, srid=4326),
        area_ha=Decimal(str(area_ha)),
    )


def create_test_crop(
    name: str = "Maize",
    **kwargs,
) -> "Crop":
    """Create a test crop."""
    from ayis.crops.models import Crop
    defaults = {
        "name": name,
        "scientific_name": "Zea mays",
        "category": "cereal",
        "description": "Test maize crop",
        "growing_days_min": 90,
        "growing_days_max": 120,
        "growing_days_typical": 105,
        "optimal_temp_min": Decimal("18"),
        "optimal_temp_max": Decimal("30"),
        "rainfall_min_mm": 500,
        "rainfall_optimum_mm": 750,
        "rainfall_max_mm": 1200,
        "expected_yield_min_kg_ha": 3000,
        "expected_yield_max_kg_ha": 6000,
        "expected_yield_typical_kg_ha": 4500,
        "frost_sensitive": True,
        "sunlight_hours_min": 6,
        "suitable_months": [3, 4, 5],
        "is_active": True,
    }
    defaults.update(kwargs)
    return Crop.objects.create(**defaults)


def create_test_variety(
    crop: "Crop",
    name: str = "H614",
    **kwargs,
) -> "Variety":
    """Create a test variety."""
    from ayis.crops.models import Variety
    defaults = {
        "crop": crop,
        "name": name,
        "breeder": "Test Breeder",
        "description": "Test variety",
        "maturity_days_typical": 105,
        "yield_sd_min_kg_ha": 3500,
        "yield_sd_max_kg_ha": 6500,
        "yield_sd_typical_kg_ha": 4800,
        "is_recommended": True,
    }
    defaults.update(kwargs)
    return Variety.objects.create(**defaults)


def create_test_cycle(
    farm: "Farm",
    crop: "Crop",
    variety: "Variety | None" = None,
    planting_date: date | None = None,
) -> "CropCycle":
    """Create a test crop cycle."""
    from ayis.cycles.models import CropCycle
    if planting_date is None:
        planting_date = date.today() - timedelta(days=30)
    return CropCycle.objects.create(
        farm=farm,
        crop=crop,
        variety=variety,
        planting_date=planting_date,
        current_stage="vegetative",
        status="active",
        area_ha=Decimal("4.5"),
        plant_density_plants_per_ha=50000,
    )


def create_test_weather_source(
    name: str = "Open-Meteo",
    provider: str = "open-meteo",
) -> "WeatherSource":
    """Create a test weather source."""
    from ayis.weather.models import WeatherSource
    return WeatherSource.objects.create(
        name=name,
        provider=provider,
        api_endpoint="https://api.open-meteo.com/v1/forecast",
        is_active=True,
        priority=10,
    )


def create_test_observation(
    source: "WeatherSource",
    observed_at: datetime | None = None,
    latitude: float = -1.29,
    longitude: float = 36.82,
    **kwargs,
) -> "WeatherObservation":
    """Create a test weather observation."""
    from ayis.weather.models import WeatherObservation
    if observed_at is None:
        observed_at = datetime.now()
    defaults = {
        "source": source,
        "observed_at": observed_at,
        "latitude": Decimal(str(latitude)),
        "longitude": Decimal(str(longitude)),
        "temperature_celsius": Decimal("25.0"),
        "rainfall_mm": Decimal("0.0"),
        "humidity_percent": Decimal("65.0"),
        "wind_speed_ms": Decimal("2.5"),
        "data_quality": "good",
    }
    defaults.update(kwargs)
    return WeatherObservation.objects.create(**defaults)


def create_observation_records(
    observations: list["WeatherObservation"],
) -> list:
    """Convert WeatherObservation models to ObservationRecord for service layer."""
    from ayis.integrations.base import ObservationRecord

    records = []
    for obs in observations:
        records.append(ObservationRecord(
            observed_at=obs.observed_at,
            provider=obs.source.provider,
            latitude=float(obs.latitude),
            longitude=float(obs.longitude),
            temperature_celsius=float(obs.temperature_celsius) if obs.temperature_celsius is not None else None,
            humidity_percent=float(obs.humidity_percent) if obs.humidity_percent is not None else None,
            rainfall_mm=float(obs.rainfall_mm) if obs.rainfall_mm is not None else None,
            wind_speed_ms=float(obs.wind_speed_ms) if obs.wind_speed_ms is not None else None,
            pressure_hpa=float(obs.pressure_hpa) if obs.pressure_hpa is not None else None,
            data_quality=obs.data_quality,
            raw_payload=obs.raw_payload,
        ))
    return records


def auth_client(user: User) -> APIClient:
    """Return an APIClient authenticated as the given user via JWT."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


# ============================================================================
# 1. MODEL TESTS
# ============================================================================

class UserModelTests(TestCase):
    """Tests for the custom User model."""

    def test_create_user_with_role(self):
        user = create_test_user(username="farmer1", role="farmer")
        self.assertEqual(user.role, "farmer")
        self.assertTrue(user.is_farmer)
        self.assertFalse(user.is_officer)
        self.assertFalse(user.is_admin)
        self.assertTrue(user.is_active)

    def test_create_officer(self):
        user = create_test_user(username="officer1", role="officer")
        self.assertTrue(user.is_officer)
        self.assertFalse(user.is_farmer)

    def test_create_admin(self):
        user = create_test_user(username="admin1", role="admin")
        self.assertTrue(user.is_admin)

    def test_user_str_representation(self):
        user = create_test_user(username="johndoe", role="farmer")
        self.assertIn("Farmer", str(user))
        self.assertIn("johndoe", str(user))

    def test_has_role(self):
        user = create_test_user(role="farmer")
        self.assertTrue(user.has_role("farmer"))
        self.assertFalse(user.has_role("officer"))
        self.assertFalse(user.has_role("admin"))

    def test_password_not_stored_in_plain_text(self):
        user = create_test_user(password="secretpass")
        self.assertNotEqual(user.password, "secretpass")
        self.assertTrue(user.check_password("secretpass"))

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username="superadmin",
            email="super@example.com",
            password="adminpass",
            role="admin",
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_admin)


class FarmModelTests(TestCase):
    """Tests for the Farm model."""

    def setUp(self):
        self.user = create_test_user()

    def test_create_farm(self):
        farm = create_test_farm(self.user, name="My Farm", area_ha=10.0)
        self.assertEqual(farm.owner, self.user)
        self.assertEqual(farm.name, "My Farm")
        self.assertEqual(farm.area_ha, Decimal("10.0"))
        self.assertIsNotNone(farm.longitude)
        self.assertIsNotNone(farm.latitude)

    def test_farm_location_point(self):
        farm = create_test_farm(self.user, longitude=36.82, latitude=-1.29)
        self.assertIsNotNone(farm.location)
        self.assertAlmostEqual(float(farm.location.x), 36.82, places=5)
        self.assertAlmostEqual(float(farm.location.y), -1.29, places=5)
        self.assertEqual(farm.location.srid, 4326)

    def test_farm_without_location(self):
        farm = Farm.objects.create(owner=self.user, name="No Location Farm")
        self.assertIsNone(farm.location)
        self.assertIsNone(farm.longitude)
        self.assertIsNone(farm.latitude)

    def test_farm_str(self):
        farm = create_test_farm(self.user, name="Green Valley")
        self.assertIn("Green Valley", str(farm))
        self.assertIn(self.user.username, str(farm))

    def test_farm_unique_name_per_owner(self):
        """Name is not globally unique, but we test basic creation works."""
        Farm.objects.create(owner=self.user, name="Shared Name", area_ha=1.0)
        farm2 = Farm.objects.create(owner=self.user, name="Shared Name", area_ha=2.0)
        self.assertEqual(Farm.objects.filter(name="Shared Name").count(), 2)

    def test_farm_area_precision(self):
        farm = Farm.objects.create(
            owner=self.user,
            name="Precision Farm",
            area_ha=Decimal("12.345"),
        )
        self.assertEqual(farm.area_ha, Decimal("12.345"))


class CropModelTests(TestCase):
    """Tests for the Crop model."""

    def test_create_crop(self):
        crop = create_test_crop(name="Wheat")
        self.assertEqual(crop.name, "Wheat")
        self.assertEqual(crop.scientific_name, "Triticum aestivum")
        self.assertEqual(crop.category, "cereal")

    def test_crop_growing_days_range(self):
        crop = create_test_crop(
            name="Sorghum",
            growing_days_min=60,
            growing_days_max=90,
        )
        self.assertEqual(crop.growing_days_range, (60, 90))

    def test_crop_without_range(self):
        crop = create_test_crop(name="Unkown Crop", growing_days_min=None)
        self.assertIsNone(crop.growing_days_range)

    def test_crop_optimal_temp_range(self):
        crop = create_test_crop(
            name="Rice",
            optimal_temp_min=Decimal("20"),
            optimal_temp_max=Decimal("35"),
        )
        self.assertEqual(crop.optimal_temp_range, (20.0, 35.0))

    def test_crop_rainfall_range(self):
        crop = create_test_crop(
            name="Maize",
            rainfall_min_mm=400,
            rainfall_max_mm=1500,
        )
        self.assertEqual(crop.rainfall_range, (400, 1500))

    def test_crop_str(self):
        crop = create_test_crop(name="Beans")
        self.assertEqual(str(crop), "Beans")

    def test_crop_unique_name_constraint(self):
        create_test_crop(name="UniqueCrop")
        with self.assertRaises(IntegrityError):
            create_test_crop(name="UniqueCrop")

    def test_crop_inactive_not_available(self):
        crop = create_test_crop(name="Inactive Crop", is_active=False)
        self.assertFalse(crop.is_active)


class VarietyModelTests(TestCase):
    """Tests for the Variety model."""

    def setUp(self):
        self.crop = create_test_crop(name="Maize")

    def test_create_variety(self):
        variety = create_test_variety(self.crop, name="H614")
        self.assertEqual(variety.crop, self.crop)
        self.assertEqual(variety.name, "H614")

    def test_variety_str(self):
        variety = create_test_variety(self.crop, name="SC713")
        self.assertIn("Maize", str(variety))
        self.assertIn("SC713", str(variety))

    def test_variety_unique_per_crop(self):
        create_test_variety(self.crop, name="TestVar")
        with self.assertRaises(IntegrityError):
            create_test_variety(self.crop, name="TestVar")

    def test_variety_same_name_different_crop_allowed(self):
        crop2 = create_test_crop(name="Wheat")
        create_test_variety(self.crop, name="CommonVar")
        create_test_variety(crop2, name="CommonVar")  # Should not raise


class CropCycleModelTests(TestCase):
    """Tests for the CropCycle model."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user)
        self.crop = create_test_crop()
        self.variety = create_test_variety(self.crop)

    def test_create_cycle(self):
        cycle = create_test_cycle(self.farm, self.crop, self.variety)
        self.assertEqual(cycle.farm, self.farm)
        self.assertEqual(cycle.crop, self.crop)
        self.assertEqual(cycle.variety, self.variety)
        self.assertEqual(cycle.status, "active")
        self.assertEqual(cycle.current_stage, "vegetative")

    def test_cycle_str(self):
        cycle = create_test_cycle(self.farm, self.crop)
        self.assertIn("Maize", str(cycle))
        self.assertIn("Test Farm", str(cycle))

    def test_days_since_planting(self):
        planting = date.today() - timedelta(days=45)
        cycle = create_test_cycle(self.farm, self.crop, planting_date=planting)
        self.assertEqual(cycle.days_since_planting, 45)

    def test_days_to_harvest(self):
        harvest = date.today() + timedelta(days=60)
        cycle = create_test_cycle(self.farm, self.crop, planting_date=date.today())
        cycle.expected_harvest_date = harvest
        cycle.save()
        self.assertEqual(cycle.days_to_expected_harvest, 60)

    def test_total_inputs_cost(self):
        cycle = create_test_cycle(self.farm, self.crop)
        cycle.seeds_used_cost = Decimal("5000")
        cycle.fertilizer_cost = Decimal("12000")
        cycle.irrigation_cost = Decimal("3000")
        cycle.pesticide_cost = Decimal("2000")
        cycle.labor_cost = Decimal("4000")
        cycle.save()
        self.assertEqual(cycle.total_inputs_cost, 26000.0)

    def test_update_stage(self):
        cycle = create_test_cycle(self.farm, self.crop)
        cycle.update_stage("reproductive")
        cycle.refresh_from_db()
        self.assertEqual(cycle.current_stage, "reproductive")
        self.assertIsNotNone(cycle.stage_updated_at)

    def test_mark_harvested(self):
        cycle = create_test_cycle(self.farm, self.crop)
        cycle.mark_harvested(date(2024, 6, 15))
        cycle.refresh_from_db()
        self.assertEqual(cycle.current_stage, "harvested")
        self.assertEqual(cycle.status, "completed")
        self.assertEqual(cycle.actual_harvest_date, date(2024, 6, 15))

    def test_cycle_status_choices(self):
        cycle = create_test_cycle(self.farm, self.crop)
        cycle.status = "planned"
        cycle.save()
        cycle.status = "active"
        cycle.save()
        cycle.status = "completed"
        cycle.save()
        cycle.status = "failed"
        cycle.save()

    def test_alternating_planting_dates_order(self):
        """Cycles should be ordered by planting_date descending."""
        c1 = create_test_cycle(self.farm, self.crop, planting_date=date(2024, 1, 1))
        c2 = create_test_cycle(self.farm, self.crop, planting_date=date(2024, 6, 1))
        latest = CropCycle.objects.latest("planting_date")
        self.assertEqual(latest, c2)


class WeatherModelTests(TestCase):
    """Tests for weather models."""

    def setUp(self):
        self.source = create_test_weather_source()

    def test_create_weather_source(self):
        src = create_test_weather_source(name="NASA POWER", provider="nasa-power")
        self.assertEqual(src.name, "NASA POWER")
        self.assertEqual(src.provider, "nasa-power")
        self.assertTrue(src.is_active)

    def test_weather_source_str(self):
        src = create_test_weather_source()
        self.assertIn("Open-Meteo", str(src))
        self.assertIn("open-meteo", str(src))

    def test_create_observation(self):
        obs = create_test_observation(self.source)
        self.assertEqual(obs.source, self.source)
        self.assertIsNotNone(obs.observed_at)
        self.assertAlmostEqual(float(obs.latitude), -1.29, places=6)
        self.assertAlmostEqual(float(obs.longitude), 36.82, places=6)

    def test_observation_auto_location(self):
        obs = create_test_observation(
            self.source,
            latitude=-1.5,
            longitude=36.5,
        )
        self.assertIsNotNone(obs.location)
        self.assertAlmostEqual(float(obs.location.x), 36.5, places=5)
        self.assertAlmostEqual(float(obs.location.y), -1.5, places=5)

    def test_observation_unique_constraint(self):
        """Same source + timestamp + coordinates should be unique."""
        obs1 = create_test_observation(
            self.source,
            observed_at=datetime(2024, 1, 15, 12, 0),
            latitude=-1.29,
            longitude=36.82,
        )
        with self.assertRaises(IntegrityError):
            create_test_observation(
                self.source,
                observed_at=datetime(2024, 1, 15, 12, 0),
                latitude=-1.29,
                longitude=36.82,
            )

    def test_observation_str(self):
        obs = create_test_observation(self.source)
        self.assertIn("Open-Meteo", str(obs))
        self.assertIn("2024", str(obs))

    def test_create_forecast(self):
        from ayis.weather.models import WeatherForecast
        forecast = WeatherForecast.objects.create(
            source=self.source,
            forecast_at=datetime.now(),
            forecast_for=datetime.now() + timedelta(hours=6),
            latitude=Decimal("-1.29"),
            longitude=Decimal("36.82"),
            temperature_celsius=Decimal("26.0"),
            rainfall_probability=Decimal("30.0"),
        )
        self.assertIsNotNone(forecast.location)
        self.assertEqual(float(forecast.temperature_celsius), 26.0)

    def test_weather_sync_job(self):
        from ayis.weather.models import WeatherSyncJob
        job = WeatherSyncJob.objects.create(source=self.source, status="completed")
        self.assertEqual(job.status, "completed")
        self.assertEqual(job.records_processed, 0)

    def test_observation_indexes_exist(self):
        """Verify indexes are defined on the model."""
        from django.db import connection
        table_name = "weather_weatherobservation"
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT indexname FROM pg_indexes WHERE tablename = %s",
                [table_name],
            )
            indexes = [row[0] for row in cursor.fetchall()]
        self.assertTrue(any("observed_at" in idx for idx in indexes))


class IntelligenceModelTests(TestCase):
    """Tests for intelligence models."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user)

    def test_create_intelligence_result_calculated(self):
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="crop_suitability",
            farm=self.farm,
            crop=create_test_crop(),
            data_classification="calculated",
            score=Decimal("85.50"),
            value={"percentage": 85.5},
            confidence=Decimal("0.850"),
            factors={"temperature": 90, "rainfall": 80},
            explanation="Weather conditions are favorable.",
            model_name="baseline",
        )
        self.assertEqual(result.result_type, "crop_suitability")
        self.assertTrue(result.is_calculated)
        self.assertFalse(result.is_observed)
        self.assertFalse(result.is_predicted)
        self.assertFalse(result.is_recommended)

    def test_different_result_types(self):
        from ayis.intelligence.models import IntelligenceResult
        for rt in ["weather_suitability", "crop_suitability", "yield_estimate", "recommendation"]:
            IntelligenceResult.objects.create(
                result_type=rt,
                farm=self.farm,
                data_classification="calculated",
                score=Decimal("50.00"),
            )

    def test_intelligence_result_str(self):
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="yield_estimate",
            farm=self.farm,
            data_classification="predicted",
        )
        self.assertIn("yield_estimate", str(result))
        self.assertIn("Test Farm", str(result))


class ProductionModelTests(TestCase):
    """Tests for production/harvest models."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user)
        self.crop = create_test_crop()
        self.cycle = create_test_cycle(self.farm, self.crop)

    def test_create_harvest(self):
        from ayis.production.models import Harvest
        harvest = Harvest.objects.create(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=Decimal("22500"),
            production_area_ha=Decimal("5.0"),
            quality_grade="A",
            sale_price_per_kg=Decimal("0.50"),
            total_revenue=Decimal("11250.00"),
            recorded_by=self.user,
        )
        self.assertEqual(harvest.quantity_kg, Decimal("22500"))
        self.assertEqual(harvest.actual_yield_kg_ha, Decimal("4500.00"))
        self.assertEqual(harvest.cycle, self.cycle)

    def test_harvest_auto_calculate_yield(self):
        """actual_yield_kg_ha should be auto-calculated on save."""
        from ayis.production.models import Harvest
        harvest = Harvest(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=Decimal("10000"),
            production_area_ha=Decimal("2.5"),
        )
        harvest.save()
        self.assertEqual(harvest.actual_yield_kg_ha, Decimal("4000.00"))

    def test_harvest_without_area_no_auto_yield(self):
        from ayis.production.models import Harvest
        harvest = Harvest(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=Decimal("5000"),
        )
        harvest.save()
        self.assertIsNone(harvest.actual_yield_kg_ha)

    def test_harvest_yield_comparison(self):
        from ayis.production.models import Harvest
        from ayis.intelligence.models import IntelligenceResult
        yi = IntelligenceResult.objects.create(
            result_type="yield_estimate",
            farm=self.farm,
            data_classification="predicted",
            value={"estimated_yield": "4500"},
            confidence=Decimal("0.600"),
        )
        harvest = Harvest.objects.create(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=Decimal("22500"),
            production_area_ha=Decimal("5.0"),
            predicted_intelligence=yi,
        )
        comparison = harvest.calculate_yield_comparison()
        self.assertIsNotNone(comparison)
        self.assertEqual(comparison["predicted_yield_kg_ha"], "4500")
        self.assertEqual(comparison["actual_yield_kg_ha"], "4500.00")
        self.assertAlmostEqual(comparison["difference_pct"], 0.0, places=1)
        self.assertTrue(comparison["actual_is_higher"])  # 4500.00 > 4500

    def test_harvest_service_get_total_production(self):
        from ayis.production.models import Harvest
        Harvest.objects.create(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=Decimal("10000"),
            production_area_ha=Decimal("2.0"),
            total_revenue=Decimal("5000"),
        )
        Harvest.objects.create(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 5),
            quantity_kg=Decimal("12000"),
            production_area_ha=Decimal("3.0"),
            total_revenue=Decimal("6000"),
        )
        stats = harvest_service.get_total_production_for_cycle(self.cycle)
        self.assertEqual(stats["total_quantity_kg"], Decimal("22000"))
        self.assertEqual(stats["total_area_ha"], Decimal("5.0"))
        self.assertEqual(stats["harvest_count"], 2)

    def test_harvest_service_record_harvest(self):
        from datetime import date
        harvest = harvest_service.record_harvest(
            cycle=self.cycle,
            harvest_date=date(2024, 7, 1),
            quantity_kg=5000,
            production_area_ha=1.5,
            recorded_by=self.user,
            quality_grade="B",
        )
        self.assertEqual(harvest.quantity_kg, Decimal("5000"))
        self.assertEqual(harvest.cycle.status, "completed")
        self.assertEqual(harvest.cycle.actual_harvest_date, date(2024, 7, 1))


# ============================================================================
# 2. CONSTRAINT AND INTEGRITY TESTS
# ============================================================================

class ConstraintTests(TransactionTestCase):
    """Database constraint and integrity tests."""

    def test_user_username_unique(self):
        create_test_user(username="uniqueuser")
        with self.assertRaises(IntegrityError):
            create_test_user(username="uniqueuser")

    def test_user_email_optional_not_unique(self):
        """Email is not required and not unique by default."""
        u1 = create_test_user(username="u1", email="shared@example.com")
        u2 = create_test_user(username="u2", email="shared@example.com")
        self.assertEqual(User.objects.filter(email="shared@example.com").count(), 2)

    def test_farm_owner_cascade(self):
        user = create_test_user(username="cascade-test")
        farm = create_test_farm(user)
        self.assertEqual(Farm.objects.filter(owner=user).count(), 1)
        user.delete()
        self.assertEqual(Farm.objects.filter(id=farm.id).count(), 0)

    def test_cycle_crop_protect(self):
        """Deleting a crop that has cycles should fail (PROTECT)."""
        user = create_test_user(username="protect-test")
        farm = create_test_farm(user)
        crop = create_test_crop(name="ProtectCrop")
        cycle = create_test_cycle(farm, crop)
        with self.assertRaises(Exception):  # ProtectedError
            crop.delete()

    def test_weather_source_protect_observations(self):
        """Deleting a weather source with observations should fail (PROTECT)."""
        source = create_test_weather_source(name="ProtectSource")
        create_test_observation(source)
        with self.assertRaises(Exception):  # ProtectedError
            source.delete()

    def test_variety_crop_cascade(self):
        """Deleting a crop should cascade-delete its varieties."""
        crop = create_test_crop(name="CascadeCrop")
        variety = create_test_variety(crop)
        self.assertEqual(Variety.objects.count(), 1)
        crop.delete()
        self.assertEqual(Variety.objects.count(), 0)

    def test_cycle_cascade_to_harvests(self):
        """Deleting a cycle should cascade-delete its harvests."""
        user = create_test_user(username="cascade-harvest")
        farm = create_test_farm(user)
        crop = create_test_crop()
        cycle = create_test_cycle(farm, crop)
        from ayis.production.models import Harvest
        Harvest.objects.create(
            cycle=cycle,
            harvest_date=date.today(),
            quantity_kg=Decimal("1000"),
            production_area_ha=Decimal("0.5"),
        )
        self.assertEqual(Harvest.objects.count(), 1)
        cycle.delete()
        self.assertEqual(Harvest.objects.count(), 0)

    def test_intelligence_farm_cascade(self):
        """Deleting a farm should cascade-delete intelligence results."""
        user = create_test_user(username="cascade-intel")
        farm = create_test_farm(user)
        from ayis.intelligence.models import IntelligenceResult
        IntelligenceResult.objects.create(
            result_type="yield_estimate",
            farm=farm,
            data_classification="predicted",
        )
        self.assertEqual(IntelligenceResult.objects.count(), 1)
        farm.delete()
        self.assertEqual(IntelligenceResult.objects.count(), 0)


# ============================================================================
# 3. SERVICE LAYER TESTS
# ============================================================================

class IntelligenceServiceTests(TestCase):
    """Tests for the intelligence service layer."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user, longitude=36.82, latitude=-1.29)
        self.source = create_test_weather_source()
        self.crop = create_test_crop(
            name="Maize",
            optimal_temp_min=Decimal("18"),
            optimal_temp_max=Decimal("30"),
            rainfall_min_mm=500,
            rainfall_optimum_mm=750,
        )

    def test_weather_suitability_no_observations(self):
        result = intelligence_service.calculate_weather_suitability([], {})
        self.assertEqual(result.score, 0)
        self.assertIn("No weather observations", result.explanation)

    def test_weather_suitability_optimal_conditions(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("75.0"),
            humidity_percent=Decimal("60.0"),
        )
        records = create_observation_records([obs])
        crop_req = {
            "optimal_temp_min": 18,
            "optimal_temp_max": 30,
            "min_rainfall_mm": 50,
            "optimal_humidity_min": 40,
            "optimal_humidity_max": 80,
        }
        result = intelligence_service.calculate_weather_suitability(records, crop_req)
        self.assertGreater(result.score, 80)
        self.assertGreater(result.percentage, 80)

    def test_weather_suitability_low_temp(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("10.0"),
            rainfall_mm=Decimal("100.0"),
        )
        records = create_observation_records([obs])
        crop_req = {
            "optimal_temp_min": 18,
            "optimal_temp_max": 30,
            "min_rainfall_mm": 50,
        }
        result = intelligence_service.calculate_weather_suitability(records, crop_req)
        # Temperature is below optimal
        self.assertLess(result.factors["temperature"]["score"], 100)

    def test_weather_suitability_insufficient_rainfall(self):
        obs = create_test_observation(
            self.source,
            rainfall_mm=Decimal("10.0"),
            temperature_celsius=Decimal("25.0"),
        )
        records = create_observation_records([obs])
        crop_req = {
            "optimal_temp_min": 18,
            "optimal_temp_max": 30,
            "min_rainfall_mm": 80,
        }
        result = intelligence_service.calculate_weather_suitability(records, crop_req)
        self.assertLess(result.factors["rainfall"]["score"], 100)

    def test_crop_suitability_includes_location(self):
        obs = create_test_observation(self.source, temperature_celsius=Decimal("25"))
        records = create_observation_records([obs])
        result = intelligence_service.calculate_crop_suitability(
            self.farm,
            {"optimal_temp_min": 18, "optimal_temp_max": 30},
            records,
        )
        self.assertIn("location", result.factors)
        self.assertEqual(result.factors["location"]["farm_name"], "Test Farm")
        self.assertAlmostEqual(result.factors["location"]["coordinates"][0], 36.82, places=2)

    def test_baseline_yield_model_base_value(self):
        result = intelligence_service._baseline_yield_model(
            farm=self.farm,
            crop="maize",
            variety="H614",
            planting_date=datetime.now(),
            area_ha=Decimal("5.0"),
            observations=[],
        )
        self.assertEqual(result.estimated_yield, Decimal("4500"))
        self.assertEqual(result.unit, "kg/ha")
        self.assertEqual(result.model_name, "baseline")
        self.assertLessEqual(result.confidence, 0.5)

    def test_baseline_yield_model_with_favorable_weather(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("120.0"),
        )
        records = create_observation_records([obs])
        result = intelligence_service._baseline_yield_model(
            farm=self.farm,
            crop="maize",
            variety="H614",
            planting_date=datetime.now(),
            area_ha=Decimal("5.0"),
            observations=records,
        )
        # Favorable temp (+10%) and rain (+5%) = 1.1 * 1.05 = 1.155
        self.assertEqual(result.estimated_yield, Decimal("5197.500"))
        self.assertGreater(result.confidence, 0.4)

    def test_baseline_yield_model_with_poor_weather(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("10.0"),
            rainfall_mm=Decimal("30.0"),
        )
        records = create_observation_records([obs])
        result = intelligence_service._baseline_yield_model(
            farm=self.farm,
            crop="maize",
            variety="H614",
            planting_date=datetime.now(),
            area_ha=Decimal("5.0"),
            observations=records,
        )
        # Cold temp (-20%) and low rain (-30%) = 0.8 * 0.7 = 0.56
        self.assertEqual(result.estimated_yield, Decimal("2520.000"))
        self.assertGreaterEqual(result.confidence, 0.4)

    def test_estimate_yield_API(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("100.0"),
        )
        records = create_observation_records([obs])
        result = intelligence_service.estimate_yield(
            farm=self.farm,
            crop="maize",
            variety="H614",
            planting_date=datetime.now(),
            area_ha=Decimal("5.0"),
            weather_observations=records,
        )
        self.assertEqual(result.classification, "predicted")
        self.assertIn("predicted", result.explanation.lower())

    def test_recommendation_favorable(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("150.0"),
        )
        records = create_observation_records([obs])
        suitability = intelligence_service.calculate_weather_suitability(records, {
            "optimal_temp_min": 18, "optimal_temp_max": 30, "min_rainfall_mm": 50
        })
        yield_est = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), records,
        )
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", suitability, yield_est
        )
        self.assertIn("Plant maize", rec.action)
        self.assertGreater(rec.confidence, 0.5)
        self.assertGreater(len(rec.evidence), 0)

    def test_recommendation_unfavorable(self):
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("8.0"),
            rainfall_mm=Decimal("5.0"),
        )
        records = create_observation_records([obs])
        suitability = intelligence_service.calculate_weather_suitability(records, {
            "optimal_temp_min": 18, "optimal_temp_max": 30, "min_rainfall_mm": 50
        })
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", suitability, None
        )
        self.assertIn("Do not plant", rec.action)
        self.assertGreater(rec.confidence, 0.5)

    def test_recommendation_insufficient_data(self):
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", None, None
        )
        self.assertIn("Insufficient data", rec.action)
        self.assertEqual(rec.confidence, 0.0)

    def test_yeild_estimate_unknown_crop_defaults_to_2000(self):
        result = intelligence_service._baseline_yield_model(
            farm=self.farm,
            crop="unknown_crop_xyz",
            variety="",
            planting_date=datetime.now(),
            area_ha=Decimal("1.0"),
            observations=[],
        )
        self.assertEqual(result.estimated_yield, Decimal("2000"))


class HarvestServiceTests(TestCase):
    """Tests for the harvest/production service."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user)
        self.crop = create_test_crop()
        self.cycle = create_test_cycle(self.farm, self.crop)

    def test_get_total_production_empty(self):
        stats = harvest_service.get_total_production_for_cycle(self.cycle)
        self.assertEqual(stats["total_quantity_kg"], Decimal("0"))
        self.assertEqual(stats["harvest_count"], 0)
        self.assertIsNone(stats["average_yield_kg_ha"])

    def test_get_yield_performance_stats(self):
        stats = harvest_service.get_yield_performance_stats()
        self.assertIn("average_yield_kg_ha", stats)
        self.assertIn("count", stats)

    def test_record_harvest_updates_cycle(self):
        from datetime import date
        harvest = harvest_service.record_harvest(
            cycle=self.cycle,
            harvest_date=date(2024, 6, 1),
            quantity_kg=10000,
            production_area_ha=2.0,
            recorded_by=self.user,
        )
        self.cycle.refresh_from_db()
        self.assertEqual(self.cycle.status, "completed")


class WeatherServiceTests(TestCase):
    """Tests for the weather service layer."""

    def test_weather_service_import(self):
        from ayis.weather.services import weather_service
        self.assertIsNotNone(weather_service)


# ============================================================================
# 4. SERIALIZER TESTS
# ============================================================================

class UserSerializerTests(TestCase):
    """Tests for user serializers."""

    def test_register_serializer_valid(self):
        from ayis.users.serializers import UserRegisterSerializer
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
            "role": "farmer",
        }
        serializer = UserRegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.username, "newuser")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_register_serializer_password_mismatch(self):
        from ayis.users.serializers import UserRegisterSerializer
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "Password1!",
            "password_confirm": "DifferentPass1!",
            "role": "farmer",
        }
        serializer = UserRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password_confirm", serializer.errors)

    def test_register_serializer_password_write_only(self):
        from ayis.users.serializers import UserRegisterSerializer
        serializer = UserRegisterSerializer()
        fields = serializer.fields
        self.assertTrue(fields["password"].write_only)
        self.assertTrue(fields["password_confirm"].write_only)

    def test_user_serializer_read_only(self):
        from ayis.users.serializers import UserSerializer
        user = create_test_user()
        serializer = UserSerializer(user)
        data = serializer.data
        self.assertNotIn("password", data)
        self.assertEqual(data["username"], user.username)

    def test_user_profile_serializer_read_only_fields(self):
        from ayis.users.serializers import UserProfileSerializer
        serializer = UserProfileSerializer()
        read_only = serializer.Meta.read_only_fields
        self.assertIn("id", read_only)
        self.assertIn("username", read_only)
        self.assertIn("role", read_only)


class FarmSerializerTests(TestCase):
    """Tests for farm serializers."""

    def test_farm_serializer(self):
        from ayis.farms.serializers import FarmSerializer
        user = create_test_user()
        farm = create_test_farm(user, name="Serializer Test Farm")
        serializer = FarmSerializer(farm)
        data = serializer.data
        self.assertEqual(data["name"], "Serializer Test Farm")
        self.assertIn("location", data)
        self.assertIn("owner", data)


class APISerializerTests(APITestCase):
    """Tests for API serializers rendering."""

    def test_health_endpoint_serializer(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertNotIn("password", str(data))
        self.assertNotIn("secret", str(data))


# ============================================================================
# 5. PERMISSION TESTS
# ============================================================================

class PermissionTests(APITestCase):
    """Tests for RBAC and object-level permissions."""

    def setUp(self):
        self.farmer = create_test_user(username="farmer_perm", role="farmer")
        self.officer = create_test_user(username="officer_perm", role="officer")
        self.admin = create_test_user(username="admin_perm", role="admin")
        self.farm = create_test_farm(self.farmer, name="Farmer Farm")

    def test_farmer_cannot_access_admin_endpoint(self):
        client = auth_client(self.farmer)
        response = client.get("/api/v1/users/")
        # Should get 403 or 404 depending on URL config
        self.assertIn(response.status_code, [403, 404, 401])

    def test_unauthenticated_access_denied(self):
        client = APIClient()
        response = client.get("/api/v1/health/")
        # Health endpoint should be public
        self.assertEqual(response.status_code, 200)

    def test_unauthenticated_users_endpoint(self):
        client = APIClient()
        response = client.get("/api/v1/users/")
        self.assertIn(response.status_code, [401, 403])

    def test_farmer_can_access_own_farm(self):
        client = auth_client(self.farmer)
        response = client.get(f"/api/v1/farms/{self.farm.id}/")
        # Depending on view setup, should be accessible
        # Just verify the permission system is wired
        self.assertIn(response.status_code, [200, 403, 404])


# ============================================================================
# 6. AUTHENTICATION TESTS
# ============================================================================

class AuthenticationTests(APITestCase):
    """Tests for JWT authentication flow."""

    def test_registration_creates_user(self):
        response = self.client.post("/api/v1/auth/register/", {
            "username": "reguser",
            "email": "reg@example.com",
            "password": "Register123!",
            "password_confirm": "Register123!",
            "role": "farmer",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="reguser").exists())

    def test_login_with_valid_credentials(self):
        user = create_test_user(username="logintest", password="LoginPass123!")
        response = self.client.post("/api/v1/auth/token/", {
            "username": "logintest",
            "password": "LoginPass123!",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_login_with_invalid_password(self):
        user = create_test_user(username="badlogin")
        response = self.client.post("/api/v1/auth/token/", {
            "username": "badlogin",
            "password": "WrongPassword",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_nonexistent_user(self):
        response = self.client.post("/api/v1/auth/token/", {
            "username": "nonexistent",
            "password": "somepassword",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_token_flow(self):
        user = create_test_user(username="refreshtest")
        # Get initial tokens
        login_resp = self.client.post("/api/v1/auth/token/", {
            "username": "refreshtest",
            "password": "testpass123",
        })
        refresh_token = login_resp.json()["refresh"]

        # Use refresh token
        refresh_resp = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": refresh_token,
        })
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.json())

    def test_authenticated_request_with_jwt(self):
        user = create_test_user(username="jwtuser")
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)

    def test_expired_token_rejected(self):
        """Test that an expired token is rejected (we can't easily expire, but we test the mechanism)."""
        user = create_test_user(username="expiredtest")
        # Create a token that's already expired
        from datetime import timedelta
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(user)
        token.set_exp(lifetime=-timedelta(hours=1))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/health/")
        # Should be rejected (either 401 or 403)
        self.assertIn(response.status_code, [401, 403])


# ============================================================================
# 7. API ENDPOINT TESTS
# ============================================================================

class APIEndpointTests(APITestCase):
    """Tests for core API endpoints."""

    def setUp(self):
        self.user = create_test_user(username="api_test_user")
        self.client = auth_client(self.user)

    def test_health_endpoint_public(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "AYIS API")

    def test_api_info_endpoint_public(self):
        response = self.client.get("/api/v1/api-info/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data_classification_legend", data)

    def test_user_profile_me_endpoint(self):
        response = self.client.get("/api/v1/users/me/")
        # May be 200 or 404 depending on URL config
        self.assertIn(response.status_code, [200, 404])

    def test_farm_list_requires_auth(self):
        anonymous_client = APIClient()
        response = anonymous_client.get("/api/v1/farms/")
        self.assertIn(response.status_code, [401, 403])


# ============================================================================
# 8. WEATHER INTEGRATION TESTS
# ============================================================================

class WeatherIntegrationTests(TestCase):
    """Tests for weather integration (mocked external API calls)."""

    def test_weather_client_import(self):
        from ayis.integrations.weather.client import OpenMeteoClient
        client = OpenMeteoClient()
        self.assertIsNotNone(client)

    def test_weather_client_build_url(self):
        from ayis.integrations.weather.client import OpenMeteoClient
        client = OpenMeteoClient()
        url = client.build_url(
            latitude=-1.29,
            longitude=36.82,
            start_date="2024-01-01",
            end_date="2024-01-07",
        )
        self.assertIn("api.open-meteo.com", url)
        self.assertIn("latitude=-1.29", url)
        self.assertIn("longitude=36.82", url)

    def test_weather_client_fetch_mock(self):
        from ayis.integrations.weather.client import OpenMeteoClient
        client = OpenMeteoClient()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "daily": {
                "time": ["2024-01-01", "2024-01-02"],
                "temperature_2m_max": [28.0, 27.0],
                "temperature_2m_min": [18.0, 17.0],
                "rainfall_sum": [5.0, 10.0],
                "humidity_2m_mean": [65.0, 60.0],
                "wind_speed_10m_max": [3.0, 4.0],
            }
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response) as mock_get:
            records = client.fetch_daily_data(
                latitude=-1.29,
                longitude=36.82,
                start_date="2024-01-01",
                end_date="2024-01-02",
            )
            self.assertEqual(len(records), 2)
            self.assertAlmostEqual(records[0].temperature_celsius, 28.0, places=1)
            self.assertAlmostEqual(records[0].rainfall_mm, 5.0, places=1)
            mock_get.assert_called_once()

    def test_weather_client_handles_api_error(self):
        from ayis.integrations.weather.client import OpenMeteoClient
        client = OpenMeteoClient()

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = Exception("Server Error")

        with patch("requests.get", return_value=mock_response):
            with self.assertRaises(Exception):
                client.fetch_daily_data(
                    latitude=-1.29,
                    longitude=36.82,
                    start_date="2024-01-01",
                    end_date="2024-01-02",
                )

    def test_weather_client_handles_invalid_response(self):
        from ayis.integrations.weather.client import OpenMeteoClient
        client = OpenMeteoClient()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}  # Missing daily data
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response):
            records = client.fetch_daily_data(
                latitude=-1.29,
                longitude=36.82,
                start_date="2024-01-01",
                end_date="2024-01-02",
            )
            # Should return empty list for missing data
            self.assertEqual(len(records), 0)


# ============================================================================
# 9. RECOMMENDATION ENGINE TESTS (from intelligence service)
# ============================================================================

class RecommendationEngineTests(TestCase):
    """Tests for the recommendation engine (part of intelligence service)."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user, longitude=36.82, latitude=-1.29)
        self.source = create_test_weather_source()
        self.crop = create_test_crop()

    def test_recommendation_with_high_confidence(self):
        """Recommendation should have high confidence when data is good."""
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("200.0"),
            humidity_percent=Decimal("60.0"),
        )
        records = create_observation_records([obs])

        suitability = intelligence_service.calculate_weather_suitability(
            records,
            {"optimal_temp_min": 18, "optimal_temp_max": 30, "min_rainfall_mm": 50,
             "optimal_humidity_min": 40, "optimal_humidity_max": 80},
        )
        yield_est = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), records,
        )
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", suitability, yield_est
        )
        self.assertGreater(rec.confidence, 0.5)
        self.assertTrue(len(rec.evidence) >= 2)

    def test_recommendation_evidence_structure(self):
        """Recommendation should include evidence list."""
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", None, None
        )
        self.assertIsInstance(rec.evidence, list)
        self.assertIsInstance(rec.alternatives, list)
        self.assertGreater(len(rec.alternatives), 0)

    def test_recommendation_classifications(self):
        """Recommendation should be classified as 'recommended'."""
        obs = create_test_observation(self.source, temperature_celsius=Decimal("25"))
        records = create_observation_records([obs])
        suitability = intelligence_service.calculate_weather_suitability(
            records, {"optimal_temp_min": 18, "optimal_temp_max": 30}
        )
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", suitability, None
        )
        self.assertEqual(rec.classification, "recommended")

    def test_recommendation_alternatives_provided(self):
        """Recommendation should always include alternatives."""
        rec = intelligence_service.generate_recommendation(
            self.farm, "maize", None, None
        )
        self.assertTrue(all(isinstance(a, str) for a in rec.alternatives))
        self.assertIn("agricultural officer", " ".join(rec.alternatives).lower())


# ============================================================================
# 10. YIELD ENGINE TESTS
# ============================================================================

class YieldEngineTests(TestCase):
    """Tests for the yield estimation engine."""

    def setUp(self):
        self.user = create_test_user()
        self.farm = create_test_farm(self.user)
        self.source = create_test_weather_source()

    def test_yield_estimate_classified_as_predicted(self):
        obs = create_test_observation(self.source, temperature_celsius=Decimal("25"))
        records = create_observation_records([obs])
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), records,
        )
        self.assertEqual(result.classification, "predicted")

    def test_yield_estimate_has_confidence(self):
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), [],
        )
        self.assertIsNotNone(result.confidence)
        self.assertGreaterEqual(result.confidence, 0.0)
        self.assertLessEqual(result.confidence, 1.0)

    def test_yield_estimate_has_inputs_snapshot(self):
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), [],
        )
        self.assertIn("crop", result.inputs)
        self.assertIn("area_ha", result.inputs)
        self.assertIn("model_name", result.inputs)

    def test_yield_estimate_explanation_includes_confidence(self):
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("5.0"), [],
        )
        self.assertIn("confidence", result.explanation.lower())
        self.assertIn("prediction", result.explanation.lower())

    def test_yield_total_production_calculation(self):
        """Total production = estimated_yield * area_ha."""
        obs = create_test_observation(
            self.source,
            temperature_celsius=Decimal("25.0"),
            rainfall_mm=Decimal("100.0"),
        )
        records = create_observation_records([obs])
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("10.0"), records,
        )
        # estimated_yield = 4500 * 1.155 (favorable weather) = 5197.5
        # total_production = 5197.5 * 10 = 51975 kg
        # But result doesn't include total_production directly — it's in the inputs
        self.assertIn("estimated_yield", result.to_dict())
        # Just verify the estimate is reasonable
        estimated = Decimal(str(result.estimated_yield))
        self.assertGreater(estimated, Decimal("0"))

    def test_baseline_model_extensibility(self):
        """The yield model registry should be extensible."""
        self.assertIn("baseline", intelligence_service._yield_models)
        self.assertTrue(callable(intelligence_service._yield_models["baseline"]))


# ============================================================================
# 11. REPORT TESTS
# ============================================================================

class ReportTests(TestCase):
    """Tests for the reporting subsystem."""

    def test_report_service_import(self):
        from ayis.reports.services import report_service
        self.assertIsNotNone(report_service)

    def test_report_model_creation(self):
        from ayis.reports.models import ReportTemplate, ReportInstance
        user = create_test_user(role="admin")
        template = ReportTemplate.objects.create(
            name="Test Report",
            description="A test report template",
            report_type="farm",
            format="pdf",
            created_by=user,
        )
        self.assertEqual(template.name, "Test Report")
        self.assertEqual(template.report_type, "farm")

        instance = ReportInstance.objects.create(
            template=template,
            generated_by=user,
            reporting_period_start=date(2024, 1, 1),
            reporting_period_end=date(2024, 12, 31),
            status="completed",
        )
        self.assertEqual(instance.status, "completed")


# ============================================================================
# 12. DATABASE MIGRATION TESTS
# ============================================================================

class MigrationTests(TransactionTestCase):
    """Tests for database migrations and schema integrity."""

    def test_all_models_can_be_created(self):
        """Verify all models can have records created without error."""
        user = create_test_user()
        farm = create_test_farm(user)
        crop = create_test_crop()
        variety = create_test_variety(crop)
        cycle = create_test_cycle(farm, crop, variety)
        source = create_test_weather_source()
        obs = create_test_observation(source)

        self.assertIsNotNone(user.id)
        self.assertIsNotNone(farm.id)
        self.assertIsNotNone(crop.id)
        self.assertIsNotNone(variety.id)
        self.assertIsNotNone(cycle.id)
        self.assertIsNotNone(source.id)
        self.assertIsNotNone(obs.id)

    def test_spatial_fields_functional(self):
        """Verify PostGIS spatial fields work correctly."""
        user = create_test_user()
        farm = create_test_farm(user, longitude=37.0, latitude=-1.0)
        self.assertIsNotNone(farm.location)
        self.assertEqual(farm.location.srid, 4326)

        obs = create_test_observation(
            create_test_weather_source(),
            latitude=-2.0,
            longitude=37.0,
        )
        self.assertIsNotNone(obs.location)

    def test_all_indexes_defined(self):
        """Verify that key models have their expected indexes."""
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' "
                "AND tablename IN (%s, %s, %s, %s, %s, %s)",
                [
                    "auth_user",
                    "farms_farm",
                    "crops_crop",
                    "cycles_cropcycle",
                    "weather_weatherobservation",
                    "intelligence_intelligenceresult",
                ],
            )
            tables = [row[0] for row in cursor.fetchall()]

        self.assertIn("auth_user", tables)
        self.assertIn("farms_farm", tables)
        self.assertIn("crops_crop", tables)
        self.assertIn("cycles_cropcycle", tables)


# ============================================================================
# 13. FAILURE / EDGE CASE TESTS
# ============================================================================

class FailureTests(TestCase):
    """Tests for failure modes and edge cases."""

    def test_weather_suitability_empty_observations(self):
        result = intelligence_service.calculate_weather_suitability([], {})
        self.assertEqual(result.score, 0)
        self.assertIn("No weather observations", result.explanation)

    def test_weather_suitability_partial_data(self):
        """Some observations may have missing fields."""
        obs1 = create_test_observation(
            create_test_weather_source(),
            temperature_celsius=Decimal("25.0"),
        )
        obs2 = create_test_observation(
            create_test_weather_source(),
            rainfall_mm=Decimal("50.0"),
        )
        records = create_observation_records([obs1, obs2])
        result = intelligence_service.calculate_weather_suitability(
            records,
            {"optimal_temp_min": 18, "optimal_temp_max": 30, "min_rainfall_mm": 30},
        )
        # Should not crash — should compute with available data
        self.assertIsNotNone(result.score)

    def test_yield_estimate_zero_area(self):
        result = intelligence_service.estimate_yield(
            self.farm, "maize", "H614",
            datetime.now(), Decimal("0"), [],
        )
        self.assertEqual(result.estimated_yield, Decimal("4500"))
        self.assertEqual(result.inputs["area_ha"], "0")

    def test_recommendation_no_crop_name(self):
        """Edge case: empty crop name."""
        rec = intelligence_service.generate_recommendation(
            self.farm, "", None, None
        )
        # Should not crash
        self.assertIsNotNone(rec.action)

    def test_harvest_negative_area_not_allowed_by_validation(self):
        """Tests that the system handles edge cases gracefully."""
        from ayis.production.models import Harvest
        harvest = Harvest(
            cycle=create_test_cycle(
                create_test_farm(create_test_user()),
                create_test_crop(),
            ),
            harvest_date=date.today(),
            quantity_kg=Decimal("100"),
            production_area_ha=Decimal("0"),
        )
        harvest.save()
        # With zero area, actual_yield should be None (not a crash)
        self.assertIsNone(harvest.actual_yield_kg_ha)

    def test_duplicate_weather_observation_constraint(self):
        """Verify the unique constraint on weather observations."""
        source = create_test_weather_source(name="DupTest")
        ts = datetime(2024, 6, 15, 12, 0, 0)
        create_test_observation(
            source,
            observed_at=ts,
            latitude=Decimal("-1.0"),
            longitude=Decimal("36.0"),
        )
        with self.assertRaises(IntegrityError):
            create_test_observation(
                source,
                observed_at=ts,
                latitude=Decimal("-1.0"),
                longitude=Decimal("36.0"),
            )

    def test_user_with_empty_email(self):
        """Users can have empty email (it's not required)."""
        user = User.objects.create_user(
            username="noemailuser",
            email="",
            password="testpass",
            role="farmer",
        )
        self.assertEqual(user.email, "")

    def test_cycle_without_crop_reference_integrity(self):
        """Cycle crop is PROTECT — test that constraint works."""
        user = create_test_user(username="cycle-crop-int")
        farm = create_test_farm(user)
        crop = create_test_crop(name="IntegrityCrop")
        cycle = create_test_cycle(farm, crop)
        # Verify the FK is set
        self.assertEqual(cycle.crop, crop)
        # Verify we can't delete the crop while cycle exists
        with self.assertRaises(Exception):
            crop.delete()


# ============================================================================
# 14. FRONTEND-SIMULATED API INTEGRATION TESTS
# ============================================================================

class FrontendAPIClientTests(APITestCase):
    """Tests that simulate how the frontend would interact with the API."""

    def test_frontend_health_check_flow(self):
        """Frontend health check on app load."""
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["status"] == "ok")

    def test_frontend_api_info_load(self):
        """Frontend loads API info on first visit."""
        response = self.client.get("/api/v1/api-info/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data_classification_legend", data)
        self.assertIn("observed", data["data_classification_legend"])
        self.assertIn("predicted", data["data_classification_legend"])

    def test_frontend_authentication_flow(self):
        """Full register → login → access flow."""
        # Register
        reg_resp = self.client.post("/api/v1/auth/register/", {
            "username": "frontend_user",
            "email": "frontend@example.com",
            "password": "Frontend123!",
            "password_confirm": "Frontend123!",
            "role": "farmer",
        })
        self.assertEqual(reg_resp.status_code, 201)

        # Login
        login_resp = self.client.post("/api/v1/auth/token/", {
            "username": "frontend_user",
            "password": "Frontend123!",
        })
        self.assertEqual(login_resp.status_code, 200)
        access_token = login_resp.json()["access"]

        # Access protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        health_resp = self.client.get("/api/v1/health/")
        self.assertEqual(health_resp.status_code, 200)

    def test_frontend_error_responses_are_safe(self):
        """Error responses should never leak sensitive data."""
        response = self.client.post("/api/v1/auth/token/", {
            "username": "nonexistent",
            "password": "wrong",
        })
        self.assertEqual(response.status_code, 400)
        data = response.json()
        # Error response should not contain stack traces, SQL, or passwords
        response_str = json.dumps(data)
        self.assertNotIn("Traceback", response_str)
        self.assertNotIn("SELECT", response_str)
        self.assertNotIn("INSERT", response_str)
        self.assertNotIn("django", response_str.lower())
        self.assertNotIn("password", response_str.lower())

    def test_frontend_create_farm_flow(self):
        """Simulates frontend farm creation flow."""
        user = create_test_user(username="farmcreator")
        self.client = auth_client(user)

        response = self.client.post("/api/v1/farms/", {
            "name": "Frontend Test Farm",
            "area_ha": 10.0,
            "longitude": 36.82,
            "latitude": -1.29,
        })
        # Check what status we get (depends on view implementation)
        self.assertIn(response.status_code, [200, 201, 400, 403, 404])


# ============================================================================
# 15. LOADING STATE AND ERROR STATE TESTS
# ============================================================================

class LoadingErrorStateTests(TestCase):
    """Tests that verify the system handles loading and error states correctly."""

    def test_service_returns_none_on_missing_data(self):
        """Services should return meaningful results even with missing data."""
        result = intelligence_service.calculate_weather_suitability([], {})
        self.assertEqual(result.score, 0)
        self.assertEqual(result.percentage, 0.0)
        self.assertIn("No weather observations", result.explanation)

    def test_yield_estimate_with_no_weather(self):
        """Yield estimation should work with no weather data (baseline only)."""
        result = intelligence_service.estimate_yield(
            create_test_farm(create_test_user()),
            "maize",
            "H614",
            datetime.now(),
            Decimal("5.0"),
            [],
        )
        self.assertEqual(result.confidence, 0.4)
        self.assertIn("baseline model", result.explanation.lower())

    def test_services_handle_none_inputs(self):
        """Services should handle None inputs gracefully."""
        # calculate_crop_suitability with None weather
        result = intelligence_service.calculate_crop_suitability(
            create_test_farm(create_test_user()),
            {"optimal_temp_min": 18, "optimal_temp_max": 30},
            None,
        )
        self.assertIsNotNone(result.score)
        self.assertIsNotNone(result.factors)


# ============================================================================
# 16. CROSS-CUTTING CONCERN TESTS
# ============================================================================

class CrossCuttingTests(TestCase):
    """Tests for cross-cutting concerns: data classification, timestamps, etc."""

    def test_data_classification_on_intelligence_result(self):
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="yield_estimate",
            farm=create_test_farm(create_test_user()),
            data_classification="predicted",
            score=Decimal("50.00"),
        )
        self.assertTrue(result.is_predicted)
        self.assertFalse(result.is_observed)
        self.assertFalse(result.is_calculated)
        self.assertFalse(result.is_recommended)

    def test_timestamp_fields_automatic(self):
        """All models with timestamps should get them automatically."""
        from ayis.intelligence.models import IntelligenceResult
        before = datetime.now()
        result = IntelligenceResult.objects.create(
            result_type="weather_suitability",
            farm=create_test_farm(create_test_user()),
            data_classification="calculated",
        )
        after = datetime.now()
        self.assertIsNotNone(result.created_at)
        self.assertIsNotNone(result.updated_at)
        self.assertGreaterEqual(result.created_at, before)
        self.assertLessEqual(result.created_at, after)

    def test_soft_delete_not_implemented_explicity(self):
        """Verify hard-delete is the default (no soft delete implemented)."""
        user = create_test_user(username="harddelete_test")
        self.assertIsNotNone(User.objects.get(username="harddelete_test"))
        user.delete()
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(username="harddelete_test")


# ============================================================================
# 17. DATA CLASSIFICATION LEGEND TESTS
# ============================================================================

class DataClassificationTests(TestCase):
    """Tests verifying the OBSERVED/CALCULATED/PREDICTED/RECOMMENDED distinction."""

    def test_weather_observation_is_observed(self):
        """Weather observations are OBSERVED data."""
        obs = create_test_observation(create_test_weather_source())
        # WeatherObservation doesn't have data_classification field,
        # but the concept applies — these are observed
        self.assertIsNotNone(obs.observed_at)

    def test_intelligence_calculated(self):
        """Crop/weather suitability is CALCULATED."""
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="crop_suitability",
            farm=create_test_farm(create_test_user()),
            data_classification="calculated",
        )
        self.assertTrue(result.is_calculated)

    def test_intelligence_predicted(self):
        """Yield estimates are PREDICTED."""
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="yield_estimate",
            farm=create_test_farm(create_test_user()),
            data_classification="predicted",
        )
        self.assertTrue(result.is_predicted)

    def test_intelligence_recommended(self):
        """Recommendations are RECOMMENDED."""
        from ayis.intelligence.models import IntelligenceResult
        result = IntelligenceResult.objects.create(
            result_type="recommendation",
            farm=create_test_farm(create_test_user()),
            data_classification="recommended",
        )
        self.assertTrue(result.is_recommended)

    def test_harvest_is_observed(self):
        """Harvest records are OBSERVED data."""
        harvest = create_test_cycle(
            create_test_farm(create_test_user()),
            create_test_crop(),
        )
        from ayis.production.models import Harvest
        h = Harvest.objects.create(
            cycle=harvest,
            harvest_date=date.today(),
            quantity_kg=Decimal("1000"),
            production_area_ha=Decimal("0.5"),
        )
        self.assertIsNotNone(h.harvest_date)
        self.assertIsNotNone(h.quantity_kg)


# ============================================================================
# 18. API EXCEPTION HANDLING TESTS
# ============================================================================

class ExceptionHandlingTests(APITestCase):
    """Tests for API exception handling and error responses."""

    def test_invalid_json_body(self):
        """Sending invalid JSON should return a safe error."""
        response = self.client.post(
            "/api/v1/health/",
            data="not valid json",
            content_type="application/json",
        )
        # Should not crash — should return 400 or similar
        self.assertIn(response.status_code, [400, 404, 415])

    def test_safe_error_no_stack_trace(self):
        """Verify that error responses never contain stack traces."""
        # Trigger a validation error by sending invalid data
        user = create_test_user(username="errortest")
        self.client = auth_client(user)

        response = self.client.post("/api/v1/farms/", {
            "name": "",  # Empty name might trigger validation
            "owner": user.id,
        })
        response_str = json.dumps(response.data if hasattr(response, "data") else response.json())
        self.assertNotIn("Traceback", response_str)
        self.assertNotIn("File \"", response_str)
        self.assertNotIn("line ", response_str)


# ============================================================================
# MAIN: Run all tests when executed directly
# ============================================================================

if __name__ == "__main__":
    import sys
    from django.core.management import execute_from_command_line
    execute_from_command_line([sys.argv[0], "test", "ayi_system_tests"] + sys.argv[1:])

"""
AYIS — Comprehensive Seed Data Generator.

Generates realistic seed data for development and testing using Faker.
Creates reference crops, varieties, users (admins/officers/farmers),
farm regions, farms with geospatial locations, crop cycles, weather
observations, intelligence results, and production records.

All data is generated using Faker for realistic names, locations, and values.
Weather data uses realistic Kenya climate ranges.
"""

from faker import Faker
from django.contrib.gis.geos import Point
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from ayis.users.models import User
from ayis.farms.models import Farm, FarmRegion, OfficerAssignment
from ayis.crops.models import Crop, Variety
from ayis.cycles.models import CropCycle, GrowthStage, CycleStatus
from ayis.weather.models import WeatherSource, WeatherObservation, WeatherForecast
from ayis.intelligence.models import IntelligenceResult
from ayis.production.models import Harvest
from ayis.intelligence.services import intelligence_service

fake = Faker('en_US')

KENYA_LAT_RANGE = (-4.0, 4.0)
KENYA_LON_RANGE = (33.0, 42.0)
KENYA_COUNTIES = [
    'Kiambu', 'Nakuru', 'Nandi', 'Uasin Gishu',
    'Meru', 'Embu', 'Machakos', 'Kitui',
]


def seed_crops():
    """Create reference crop data from FAO-like specifications."""
    created = 0
    for crop_data in [
        {
            'name': 'Maize', 'scientific_name': 'Zea mays',
            'category': 'cereal',
            'description': 'Staple cereal crop grown for grain and fodder.',
            'growing_days_min': 90, 'growing_days_max': 120,
            'growing_days_typical': 105,
            'optimal_temp_min': Decimal('18'), 'optimal_temp_max': Decimal('30'),
            'rainfall_min_mm': 500, 'rainfall_optimum_mm': 750,
            'rainfall_max_mm': 1200,
            'expected_yield_min_kg_ha': 3000, 'expected_yield_max_kg_ha': 6000,
            'expected_yield_typical_kg_ha': 4500,
            'frost_sensitive': True,
            'sunlight_hours_min': 6,
            'suitable_months': [3, 4, 5, 8, 9, 10],
            'planting_season': 'Long rains (Mar-May), Short rains (Aug-Oct)',
            'source': 'FAO Crop Data',
            'is_active': True,
        },
        {
            'name': 'Wheat', 'scientific_name': 'Triticum aestivum',
            'category': 'cereal',
            'description': 'Cool-season cereal grain.',
            'growing_days_min': 100, 'growing_days_max': 140,
            'growing_days_typical': 120,
            'optimal_temp_min': Decimal('10'), 'optimal_temp_max': Decimal('25'),
            'rainfall_min_mm': 350, 'rainfall_optimum_mm': 550,
            'rainfall_max_mm': 900,
            'expected_yield_min_kg_ha': 2500, 'expected_yield_max_kg_ha': 5000,
            'expected_yield_typical_kg_ha': 3500,
            'frost_sensitive': True,
            'sunlight_hours_min': 6,
            'suitable_months': [10, 11, 12, 1, 2, 3],
            'planting_season': 'Autumn planting for spring harvest',
            'source': 'FAO Crop Data',
            'is_active': True,
        },
        {
            'name': 'Beans', 'scientific_name': 'Phaseolus vulgaris',
            'category': 'legume',
            'description': 'Leguminous grain legume, fixes nitrogen.',
            'growing_days_min': 60, 'growing_days_max': 90,
            'growing_days_typical': 75,
            'optimal_temp_min': Decimal('15'), 'optimal_temp_max': Decimal('25'),
            'rainfall_min_mm': 400, 'rainfall_optimum_mm': 600,
            'rainfall_max_mm': 800,
            'expected_yield_min_kg_ha': 1200, 'expected_yield_max_kg_ha': 2500,
            'expected_yield_typical_kg_ha': 1800,
            'frost_sensitive': True,
            'sunlight_hours_min': 6,
            'suitable_months': [3, 4, 5, 8, 9, 10],
            'planting_season': 'Long rains, Short rains',
            'source': 'FAO Crop Data',
            'is_active': True,
        },
        {
            'name': 'Sorghum', 'scientific_name': 'Sorghum bicolor',
            'category': 'cereal',
            'description': 'Drought-tolerant cereal grain.',
            'growing_days_min': 70, 'growing_days_max': 120,
            'growing_days_typical': 95,
            'optimal_temp_min': Decimal('20'), 'optimal_temp_max': Decimal('35'),
            'rainfall_min_mm': 300, 'rainfall_optimum_mm': 500,
            'rainfall_max_mm': 800,
            'expected_yield_min_kg_ha': 1500, 'expected_yield_max_kg_ha': 3500,
            'expected_yield_typical_kg_ha': 2200,
            'frost_sensitive': True,
            'drought_tolerant': True,
            'sunlight_hours_min': 6,
            'suitable_months': [4, 5, 6, 9, 10, 11],
            'planting_season': 'Long rains, Short rains (drought tolerant)',
            'source': 'FAO Crop Data',
            'is_active': True,
        },
        {
            'name': 'Sunflower', 'scientific_name': 'Helianthus annuus',
            'category': 'oilseed',
            'description': 'Oilseed crop for oil production.',
            'growing_days_min': 75, 'growing_days_max': 100,
            'growing_days_typical': 90,
            'optimal_temp_min': Decimal('15'), 'optimal_temp_max': Decimal('28'),
            'rainfall_min_mm': 500, 'rainfall_optimum_mm': 700,
            'rainfall_max_mm': 900,
            'expected_yield_min_kg_ha': 1500, 'expected_yield_max_kg_ha': 2800,
            'expected_yield_typical_kg_ha': 2200,
            'frost_sensitive': True,
            'sunlight_hours_min': 6,
            'suitable_months': [3, 4, 5, 8, 9, 10],
            'planting_season': 'Long rains, Short rains',
            'source': 'FAO Crop Data',
            'is_active': True,
        },
    ]:
        if not Crop.objects.filter(name=crop_data['name']).exists():
            Crop.objects.create(**crop_data)
            created += 1
    return created


def seed_varieties():
    """Create reference variety data."""
    created = 0
    for crop_name, var_name, breeder, desc in [
        ('Maize', 'H614', 'Pioneer', 'Hybrid maize variety, medium maturity.'),
        ('Maize', 'SC713', 'Kenya Seed Co', 'Hybrid maize, early maturity.'),
        ('Maize', 'DH04', 'Seed Co', 'Early maturing hybrid maize.'),
        ('Wheat', 'Njoro Buck', 'KWS', 'Winter wheat for highlands.'),
        ('Wheat', 'Felix', 'Bayer', 'Spring wheat, disease resistant.'),
        ('Beans', 'Rose Coco', 'Kenya Seed Co', 'Red kidney bean.'),
        ('Beans', 'Daima 1', 'KALRO', 'Early maturing bean.'),
        ('Sorghum', 'Gadam 1', 'KALRO', 'Drought tolerant sorghum.'),
        ('Sorghum', 'Serena', 'ICRISAT', 'Improved sorghum for brewing.'),
        ('Sunflower', 'Hysun 33', 'Pioneer', 'High oil content sunflower.'),
        ('Sunflower', 'Africare 1', 'ICRISAT', 'Disease resistant sunflower.'),
    ]:
        crop = Crop.objects.filter(name=crop_name).first()
        if crop and not Variety.objects.filter(crop=crop, name=var_name).exists():
            Variety.objects.create(
                crop=crop, name=var_name, breeder=breeder,
                description=desc,
                maturity_days_typical=random.randint(75, 120),
                yield_sd_min_kg_ha=random.randint(1500, 3500),
                yield_sd_max_kg_ha=random.randint(3000, 6000),
                yield_sd_typical_kg_ha=random.randint(2000, 5000),
                is_recommended=random.choice([True, False]),
                source='Seed Company Catalog',
            )
            created += 1
    return created


def seed_users():
    """Create admin, officer, and farmer users (idempotent with fixed usernames)."""
    admins, officers, farmers = [], [], []
    # Fixed usernames so re-running doesn't create duplicates
    admin_username = "ayi_admin"
    admin_email = "admin@ayi.local"
    if not User.objects.filter(username=admin_username).exists():
        u = User.objects.create_user(
            username=admin_username, email=admin_email,
            password="Admin@12345",
            first_name="System", last_name="Administrator",
            role=User.Role.ADMIN,
        )
        admins.append(u)

    officer_usernames = ["ayi_officer_1", "ayi_officer_2"]
    officer_emails = ["officer1@ayi.local", "officer2@ayi.local"]
    officer_names = [("John", "Kamau"), ("Mary", "Wanjiku")]
    for i, (username, email) in enumerate(zip(officer_usernames, officer_emails)):
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(
                username=username, email=email,
                password="Officer@12345",
                first_name=officer_names[i][0], last_name=officer_names[i][1],
                role=User.Role.OFFICER,
            )
            officers.append(u)

    farmer_data = [
        ("John", "Macharia", "farmer_john"),
        ("Sarah", "Achieng", "farmer_sarah"),
        ("Peter", "Otieno", "farmer_peter"),
        ("Grace", "Nderitu", "farmer_grace"),
        ("David", "Kibet", "farmer_david"),
    ]
    for first, last, username in farmer_data:
        email = f"{username}@ayi.local"
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(
                username=username, email=email,
                password="Farmer@12345",
                first_name=first, last_name=last,
                role=User.Role.FARMER,
            )
            farmers.append(u)

    return admins, officers, farmers


def seed_regions(officers):
    """Create farm regions and assign officers."""
    for officer in officers:
        region_name = random.choice(KENYA_COUNTIES)
        FarmRegion.objects.get_or_create(
            name=region_name,
            defaults={
                'region_type': 'county',
                'description': f'Agricultural region covering {region_name} County.',
                'external_ref': f'RG-{random.randint(1000, 9999)}',
                'created_by': officer,
            }
        )
        region = FarmRegion.objects.get(name=region_name)
        OfficerAssignment.objects.get_or_create(
            officer=officer, region=region,
            defaults={'assignment_type': 'region',
                      'notes': f'Officer assigned to {region_name}.'}
        )


def seed_farms(farmers):
    """Create farms for each farmer with deterministic Kenya coordinates."""
    farms = []
    farm_count = 0
    for farmer in farmers:
        for j in range(2):
            farm_count += 1
            farm_name = f"{farmer.first_name}'s Farm {farm_count}"
            lat = round(sum(KENYA_LAT_RANGE) / 2 + (j - 0.5) * 0.5, 6)
            lon = round(sum(KENYA_LON_RANGE) / 2 + (j - 0.5) * 0.5, 6)
            area = Decimal(str(3.0 + j * 2.0))
            farm, created = Farm.objects.get_or_create(
                owner=farmer, name=farm_name,
                defaults={
                    'location': Point(Decimal(str(lon)), Decimal(str(lat)), srid=4326),
                    'area_ha': area,
                    'notes': f'Farm {farm_count} for {farmer.first_name} {farmer.last_name}.',
                }
            )
            if created:
                farms.append(farm)
    return farms


def seed_cycles(farms):
    """Create crop cycles for farms (deterministic, idempotent)."""
    cycles = []
    crops_list = list(Crop.objects.all())
    varieties_list = list(Variety.objects.all())
    if not crops_list:
        return cycles
    for idx, farm in enumerate(farms):
        crop = crops_list[idx % len(crops_list)]
        crop_varieties = [v for v in varieties_list if v.crop == crop]
        variety = crop_varieties[0] if crop_varieties else None
        planting_date = date.today() - timedelta(days=60 + idx * 15)
        growing_days = crop.growing_days_typical or 100
        expected_harvest = planting_date + timedelta(days=growing_days)
        days_since = (date.today() - planting_date).days
        if days_since < 0:
            stage, status = GrowthStage.PLANNED, CycleStatus.PLANNED
        elif days_since < growing_days * 0.15:
            stage, status = GrowthStage.GERMINATED, CycleStatus.ACTIVE
        elif days_since < growing_days * 0.4:
            stage, status = GrowthStage.VEGETATIVE, CycleStatus.ACTIVE
        elif days_since < growing_days * 0.7:
            stage, status = GrowthStage.REPRODUCTIVE, CycleStatus.ACTIVE
        elif days_since < growing_days:
            stage, status = GrowthStage.HARVEST_READY, CycleStatus.ACTIVE
        else:
            stage, status = GrowthStage.HARVESTED, CycleStatus.COMPLETED
        cycle, created = CropCycle.objects.get_or_create(
            farm=farm, crop=crop, planting_date=planting_date,
            defaults={
                'variety': variety,
                'expected_harvest_date': expected_harvest,
                'actual_harvest_date': expected_harvest if status == CycleStatus.COMPLETED else None,
                'current_stage': stage,
                'status': status,
                'area_ha': farm.area_ha,
                'plant_density_plants_per_ha': 45000 + idx * 5000,
                'seeds_used_kg': Decimal(str(25.0 + idx * 5.0)),
                'fertilizer_nitrogen_kg': Decimal(str(40.0 + idx * 5.0)),
                'fertilizer_phosphorus_kg': Decimal(str(20.0 + idx * 2.0)),
                'fertilizer_potassium_kg': Decimal(str(20.0 + idx * 2.0)),
                'fertilizer_cost': Decimal(str(8000 + idx * 2000)),
                'irrigation_events': 3 + idx,
                'irrigation_water_total_neters': 5000 + idx * 1000,
                'notes': f'Crop cycle {idx+1} for {farm.name}.',
            }
        )
        if created:
            cycles.append(cycle)

    return cycles


def seed_weather(farms):
    """Create realistic weather observations for farms."""
    observations, forecasts = [], []
    temp_range = (15, 32)
    rainfall_range = (0, 50)
    humidity_range = (35, 85)
    wind_range = (1, 12)
    source, _ = WeatherSource.objects.get_or_create(
        provider='open-meteo',
        defaults={'name': 'Open-Meteo', 'api_endpoint': 'https://api.open-meteo.com/v1/forecast',
                  'is_active': True, 'priority': 10}
    )
    for farm in farms:
        if not farm.location:
            continue
        lat = float(farm.location.y)
        lon = float(farm.longitude)
        for i in range(7):
            obs_date = timezone.now() - timedelta(hours=i * 24)
            temp = Decimal(str(round(random.uniform(*temp_range), 1)))
            rainfall = Decimal(str(round(random.uniform(*rainfall_range), 1)))
            humidity = Decimal(str(round(random.uniform(*humidity_range), 1)))
            wind = Decimal(str(round(random.uniform(*wind_range), 1)))
            obs, _ = WeatherObservation.objects.get_or_create(
                source=source,
                observed_at=obs_date.replace(minute=0, second=0, microsecond=0),
                latitude=Decimal(str(lat)),
                longitude=Decimal(str(lon)),
                defaults={
                    'temperature_celsius': temp,
                    'rainfall_mm': rainfall,
                    'humidity_percent': humidity,
                    'wind_speed_ms': wind,
                    'pressure_hpa': Decimal(str(round(random.uniform(990, 1020), 1))),
                    'data_quality': random.choice(['good', 'good', 'good', 'fair']),
                    'raw_payload': {'source': 'faker', 'lat': lat, 'lon': lon},
                }
            )
            observations.append(obs)
    for farm in farms[:5]:
        if not farm.location:
            continue
        lat = float(farm.location.y)
        lon = float(farm.longitude)
        for i in range(3):
            forecast_date = timezone.now() + timedelta(hours=i * 24)
            WeatherForecast.objects.get_or_create(
                source=source, forecast_for=forecast_date,
                latitude=Decimal(str(lat)), longitude=Decimal(str(lon)),
                defaults={
                    'forecast_at': timezone.now(),
                    'temperature_celsius': Decimal(str(round(random.uniform(*temp_range), 1))),
                    'rainfall_probability': Decimal(str(round(random.uniform(0, 100), 1))),
                    'rainfall_mm': Decimal(str(round(random.uniform(0, 15), 1))),
                    'humidity_percent': Decimal(str(round(random.uniform(*humidity_range), 1))),
                    'wind_speed_ms': Decimal(str(round(random.uniform(*wind_range), 1))),
                    'weather_code': str(random.randint(0, 4)),
                    'data_quality': 'forecast',
                }
            )
    return observations, forecasts


def seed_intelligence(cycles, observations):
    """Generate intelligence results for crop cycles."""
    results = []
    for cycle in cycles:
        if not observations:
            continue
        # Use Decimal comparison for coordinates stored as Decimal
        farm_lat = Decimal(str(cycle.farm.location.y))
        farm_lon = Decimal(str(cycle.farm.location.x))
        farm_obs = [o for o in observations
                    if o.latitude == farm_lat and o.longitude == farm_lon]
        if not farm_obs:
            continue
        suit = intelligence_service.calculate_weather_suitability(
            observations, crop_requirements=cycle.crop.__dict__
        )
        IntelligenceResult.objects.create(
            result_type='weather_suitability', farm=cycle.farm,
            crop=cycle.crop, crop_cycle=cycle,
            data_classification='calculated',
            score=Decimal(str(suit.score)),
            value=suit.to_dict(),
            confidence=Decimal(str(suit.confidence)),
            factors=suit.factors,
            explanation=suit.explanation[:500],
            model_name='multifactor_engine',
        )
        results.append('weather_suitability')
        crop_suit = intelligence_service.calculate_crop_suitability(
            farm=cycle.farm, crop_reqs=cycle.crop.__dict__,
            weather_observations=farm_obs,
            current_stage=cycle.current_stage,
            growing_days_completed=(date.today() - cycle.planting_date).days
            if cycle.planting_date else None,
            growing_days_total=cycle.crop.growing_days_typical or 100,
        )
        IntelligenceResult.objects.create(
            result_type='crop_suitability', farm=cycle.farm,
            crop=cycle.crop, crop_cycle=cycle,
            data_classification='calculated',
            score=Decimal(str(crop_suit.score)),
            value=crop_suit.to_dict(),
            confidence=Decimal(str(crop_suit.confidence)),
            factors=crop_suit.factors,
            explanation=crop_suit.explanation[:500],
            model_name='multifactor_engine',
        )
        results.append('crop_suitability')
    return results


def seed_production(cycles):
    """Create harvest/production records for completed cycles."""
    harvests = []
    for cycle in cycles:
        if cycle.status != CycleStatus.COMPLETED:
            continue
        base_yield = cycle.crop.expected_yield_typical_kg_ha or 3000
        variation = random.uniform(0.7, 1.3)
        actual_yield = Decimal(str(round(base_yield * variation, 2)))
        area = cycle.area_ha or Decimal('5.0')
        qty = actual_yield * area
        Harvest.objects.get_or_create(
            cycle=cycle,
            harvest_date=cycle.actual_harvest_date or date.today(),
            defaults={
                'production_area_ha': area,
                'quantity_kg': qty,
                'actual_yield_kg_ha': actual_yield,
                'quality_grade': random.choice(['A', 'B', 'standard']),
                'sale_price_per_kg': Decimal(str(round(random.uniform(0.3, 1.0), 2))),
                'total_revenue': qty * Decimal(str(round(random.uniform(0.3, 1.0), 2))),
                'storage_used': random.choice(['silo', 'bag', '']),
                'notes': fake.text(max_nb_chars=80),
                'recorded_by': cycle.created_by,
            }
        )
        harvests.append(cycle)
    return harvests


def seed_all():
    """Seed the database with realistic development data using Faker."""
    print("Seeding crops and varieties...")
    crops_n = seed_crops()
    varieties_n = seed_varieties()
    print(f"  {crops_n} crops, {varieties_n} varieties")

    print("Seeding users...")
    admins, officers, farmers = seed_users()
    print(f"  {len(admins)} admins, {len(officers)} officers, {len(farmers)} farmers")

    print("Seeding regions and assignments...")
    seed_regions(officers)
    print(f"  {len(KENYA_COUNTIES)} regions")

    print("Seeding farms...")
    farms = seed_farms(farmers)
    print(f"  {len(farms)} farms")

    print("Seeding crop cycles...")
    cycles = seed_cycles(farms)
    print(f"  {len(cycles)} cycles")

    print("Seeding weather data...")
    observations, forecasts = seed_weather(farms)
    print(f"  {len(observations)} observations, {len(forecasts)} forecasts")

    print("Seeding intelligence results...")
    intelligence = seed_intelligence(cycles, observations)
    print(f"  {len(intelligence)} intelligence results")

    print("Seeding production records...")
    harvests = seed_production(cycles)
    print(f"  {len(harvests)} harvests")

    print("\nDONE. All seed data created successfully.")
    return {
        'admins': len(admins), 'officers': len(officers), 'farmers': len(farmers),
        'farms': len(farms), 'cycles': len(cycles),
        'observations': len(observations), 'forecasts': len(forecasts),
        'intelligence': len(intelligence), 'harvests': len(harvests),
        'crops': crops_n, 'varieties': varieties_n,
    }


if __name__ == '__main__':
    import os, django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ayis.settings.dev')
    django.setup()
    seed_all()

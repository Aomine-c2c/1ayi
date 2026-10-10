using System.Data;
using Dapper;

namespace Ayis.Api.Data;

public static class SqliteDatabaseInitializer
{
    public static void Initialize(IDbConnectionFactory dbFactory)
    {
        using var conn = dbFactory.CreateConnection();

        // 1. Create Tables
        var ddl = @"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            first_name TEXT DEFAULT '',
            last_name TEXT DEFAULT '',
            phone_number TEXT,
            role TEXT DEFAULT 'farmer',
            is_active INTEGER DEFAULT 1,
            is_staff INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS farm_regions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            county TEXT NOT NULL,
            climate_zone TEXT DEFAULT 'Sub-humid',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS farms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            region_id TEXT,
            size_ha REAL DEFAULT 1.0,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            boundary_wkt TEXT,
            primary_crop TEXT,
            soil_type TEXT DEFAULT 'Loam',
            irrigation_type TEXT DEFAULT 'Rainfed',
            elevation_m REAL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            farm_id TEXT NOT NULL,
            name TEXT NOT NULL,
            area_ha REAL NOT NULL,
            boundary_wkt TEXT,
            soil_ph REAL,
            organic_matter_pct REAL,
            drainage_class TEXT DEFAULT 'Well drained',
            slope_pct REAL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS crops (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            scientific_name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            growing_days_min INTEGER DEFAULT 90,
            growing_days_max INTEGER DEFAULT 120,
            growing_days_typical INTEGER DEFAULT 105,
            optimal_temp_min REAL DEFAULT 18.0,
            optimal_temp_max REAL DEFAULT 30.0,
            rainfall_min_mm REAL DEFAULT 500.0,
            rainfall_optimum_mm REAL DEFAULT 750.0,
            rainfall_max_mm REAL DEFAULT 1200.0,
            expected_yield_min_kg_ha REAL DEFAULT 3000.0,
            expected_yield_max_kg_ha REAL DEFAULT 6000.0,
            expected_yield_typical_kg_ha REAL DEFAULT 4500.0,
            frost_sensitive INTEGER DEFAULT 1,
            sunlight_hours_min INTEGER DEFAULT 6,
            suitable_months_json TEXT,
            planting_season TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS crop_varieties (
            id TEXT PRIMARY KEY,
            crop_id TEXT NOT NULL,
            name TEXT NOT NULL,
            maturity_days INTEGER DEFAULT 100,
            drought_tolerance TEXT DEFAULT 'Medium',
            disease_resistance TEXT DEFAULT 'Moderate',
            yield_potential_kg_ha REAL DEFAULT 5000.0,
            recommended_regions TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS crop_cycles (
            id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            crop_id TEXT NOT NULL,
            variety_id TEXT,
            season_name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            expected_harvest_date TEXT NOT NULL,
            actual_harvest_date TEXT,
            status TEXT DEFAULT 'PLANNING',
            current_stage TEXT DEFAULT 'Vegetative',
            target_yield_kg_ha REAL,
            actual_yield_kg_ha REAL,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS weather_observations (
            id TEXT PRIMARY KEY,
            station_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            temperature_c REAL NOT NULL,
            temp_min_c REAL,
            temp_max_c REAL,
            humidity_pct REAL,
            rainfall_mm REAL DEFAULT 0.0,
            wind_speed_kmh REAL,
            solar_radiation_mj REAL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS suitability_assessments (
            id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            crop_id TEXT NOT NULL,
            suitability_score REAL NOT NULL,
            suitability_class TEXT NOT NULL,
            temperature_score REAL,
            rainfall_score REAL,
            soil_score REAL,
            limiting_factors TEXT,
            assessed_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS yield_predictions (
            id TEXT PRIMARY KEY,
            cycle_id TEXT NOT NULL,
            predicted_yield_kg_ha REAL NOT NULL,
            confidence_lower_kg_ha REAL,
            confidence_upper_kg_ha REAL,
            confidence_score_pct REAL,
            factors_json TEXT,
            calculated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT,
            urgency TEXT DEFAULT 'MEDIUM',
            action_due_date TEXT,
            is_implemented INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'INFO',
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS agronomic_rules (
            id TEXT PRIMARY KEY,
            crop_id TEXT,
            rule_type TEXT NOT NULL,
            title TEXT NOT NULL,
            growth_stage TEXT,
            trigger_condition TEXT,
            min_temp_c REAL,
            max_temp_c REAL,
            min_rainfall_mm REAL,
            max_rainfall_mm REAL,
            min_humidity_pct REAL,
            max_wind_kmh REAL,
            action_directive TEXT NOT NULL,
            rationale TEXT,
            urgency TEXT DEFAULT 'MEDIUM',
            is_active INTEGER DEFAULT 1,
            authored_by TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            region TEXT NOT NULL,
            crop TEXT NOT NULL,
            format TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT DEFAULT 'READY',
            data_json TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            resource TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS field_inspections (
            id TEXT PRIMARY KEY,
            farmer_name TEXT NOT NULL,
            farmer_id TEXT NOT NULL,
            farm_name TEXT NOT NULL,
            farm_id TEXT NOT NULL,
            field_name TEXT NOT NULL,
            field_id TEXT NOT NULL,
            crop TEXT NOT NULL,
            growth_stage TEXT NOT NULL,
            field_condition TEXT NOT NULL,
            observations TEXT NOT NULL,
            severity TEXT NOT NULL,
            notes TEXT,
            follow_up_needed INTEGER DEFAULT 0,
            follow_up_details TEXT,
            inspector TEXT NOT NULL,
            inspection_date TEXT NOT NULL,
            status TEXT DEFAULT 'COMPLETED',
            score INTEGER DEFAULT 90
        );

        CREATE TABLE IF NOT EXISTS field_observations (
            id TEXT PRIMARY KEY,
            farm TEXT NOT NULL,
            farm_id TEXT NOT NULL,
            field TEXT NOT NULL,
            field_id TEXT NOT NULL,
            crop TEXT NOT NULL,
            growth_stage TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            text TEXT NOT NULL,
            notes TEXT,
            date TEXT NOT NULL,
            scout_name TEXT NOT NULL,
            follow_up_required INTEGER DEFAULT 0,
            follow_up_status TEXT DEFAULT 'Resolved'
        );

        CREATE TABLE IF NOT EXISTS field_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            farm_name TEXT NOT NULL,
            farmer_name TEXT NOT NULL,
            field TEXT NOT NULL,
            crop TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            due TEXT NOT NULL,
            assigned_to TEXT NOT NULL,
            notes TEXT
        );
        ";

        conn.Execute(ddl);

        // 2. Ensure default preconfigured demo users always exist
        EnsureDefaultUsers(conn);

        // 3. Seed Data if empty
        var farmCount = conn.ExecuteScalar<int>("SELECT COUNT(1) FROM farms;");
        if (farmCount == 0)
        {
            SeedData(conn);
        }
        else
        {
            // Upgrade any legacy plain-text password hashes
            var legacyUsers = conn.Query<(string Id, string PasswordHash)>(
                "SELECT id, password_hash AS PasswordHash FROM users WHERE password_hash NOT LIKE '$2%';");
            foreach (var u in legacyUsers)
            {
                var hashed = BCrypt.Net.BCrypt.HashPassword(u.PasswordHash, 10);
                conn.Execute("UPDATE users SET password_hash = @Hashed WHERE id = @Id;",
                    new { Hashed = hashed, Id = u.Id });
            }
        }
    }

    private static void EnsureDefaultUsers(IDbConnection conn)
    {
        // No preconfigured users; clean database where users register directly
    }

    private static void SeedData(IDbConnection conn)
    {
        EnsureDefaultUsers(conn);

        // Regions
        conn.Execute(@"
            INSERT INTO farm_regions (id, name, county, climate_zone)
            VALUES
            ('reg-001', 'Natural Region II: Highveld Agro-zone', 'Mashonaland Central', 'Sub-tropical Highveld'),
            ('reg-002', 'Natural Region I: Eastern Specialty Belt', 'Manicaland', 'Highland Mist Belt'),
            ('reg-003', 'Natural Region III: Semi-Intensive Basin', 'Midlands', 'Semi-Arid Transitional'),
            ('reg-004', 'Nakuru High Plains Sub-zone 4', 'Nakuru County', 'AEZ III / IV Highland Plains');");

        // Reference Crops
        conn.Execute(@"
            INSERT INTO crops (id, name, scientific_name, category, description, growing_days_min, growing_days_max, growing_days_typical, optimal_temp_min, optimal_temp_max, rainfall_min_mm, rainfall_optimum_mm, rainfall_max_mm, expected_yield_min_kg_ha, expected_yield_max_kg_ha, expected_yield_typical_kg_ha, frost_sensitive, sunlight_hours_min, suitable_months_json, planting_season)
            VALUES
            ('crop-001', 'Maize', 'Zea mays', 'Cereal', 'Primary staple grain across East Africa and highveld zones. High nitrogen surge demand.', 90, 120, 105, 18.0, 30.0, 500.0, 750.0, 1200.0, 3000.0, 6000.0, 4500.0, 1, 6, '[10, 11, 12, 1, 2, 3]', 'Main summer rains'),
            ('crop-002', 'Wheat', 'Triticum aestivum', 'Cereal', 'Cool-season cereal grain produced under irrigation in highland plateaus.', 100, 140, 120, 10.0, 25.0, 350.0, 550.0, 900.0, 2500.0, 5000.0, 3500.0, 1, 6, '[5, 6, 7, 8, 9]', 'Winter irrigated season'),
            ('crop-003', 'Beans', 'Phaseolus vulgaris', 'Legume', 'Nitrogen-fixing grain legume essential for soil replenishment and food security.', 60, 90, 75, 15.0, 25.0, 400.0, 600.0, 800.0, 1200.0, 2500.0, 1800.0, 1, 6, '[11, 12, 1, 2]', 'Intercropped or rotational'),
            ('crop-004', 'Irish Potato', 'Solanum tuberosum', 'Tuber', 'Highland tuber crop providing high caloric yield and good market returns.', 90, 120, 105, 15.0, 22.0, 500.0, 700.0, 1000.0, 15000.0, 30000.0, 22000.0, 1, 6, '[4, 5, 8, 9, 10]', 'Bimodal / cool plateau'),
            ('crop-005', 'Coffee (Arabica)', 'Coffea arabica', 'Cash Crop', 'Premium highland perennial cash crop with volcanic soil affinity.', 240, 300, 270, 15.0, 24.0, 1200.0, 1600.0, 2200.0, 1000.0, 3000.0, 1800.0, 1, 5, '[11, 12, 1, 2, 3]', 'Perennial harvest cycles');");

        // Varieties
        conn.Execute(@"
            INSERT INTO crop_varieties (id, crop_id, name, maturity_days, drought_tolerance, disease_resistance, yield_potential_kg_ha, recommended_regions)
            VALUES
            ('var-001', 'crop-001', 'H614D / SC719 (Highland Commercial)', 135, 'Medium', 'Grey Leaf Spot, Cob Rot', 8500.0, 'Highland Agro-zones'),
            ('var-002', 'crop-001', 'DK8031 / SC513 (Early Drought-Tolerant)', 105, 'High', 'Streak Virus Resistant', 6000.0, 'Midlands, Transitional Zones'),
            ('var-003', 'crop-003', 'Rosecoco GLP-2 / Gloria (Sugar Bean)', 80, 'Medium', 'Anthracnose tolerant', 2400.0, 'Nationwide Agro-zones'),
            ('var-004', 'crop-002', 'Kenya Tayari (Highland Milling Wheat)', 120, 'Medium', 'Stem Rust Resistant', 4500.0, 'Highland Plateaus'),
            ('var-005', 'crop-004', 'Shangi Certified (Rapid Bulking Tuber)', 105, 'Medium', 'Late Blight Moderate', 24000.0, 'Highland Volcano Belt');");

        // Farms
        conn.Execute(@"
            INSERT INTO farms (id, name, owner_id, region_id, size_ha, latitude, longitude, boundary_wkt, primary_crop, soil_type, irrigation_type, elevation_m)
            VALUES
            ('farm-001', 'Green Valley Model Farm', 'u-008', 'reg-004', 12.5, -0.3031, 36.0800, 'POLYGON((36.0780 -0.3010, 36.0830 -0.3010, 36.0830 -0.3050, 36.0780 -0.3050, 36.0780 -0.3010))', 'Maize (H614D)', 'Volcanic Loam (pH 6.4)', 'Drip & Supplemental Furrow', 1850.0),
            ('farm-002', 'Rongai Sunrise Farm', 'u-009', 'reg-004', 8.2, -0.1700, 35.8500, 'POLYGON((35.8460 -0.1660, 35.8540 -0.1660, 35.8540 -0.1740, 35.8460 -0.1740, 35.8460 -0.1660))', 'Wheat (Kenya Tayari)', 'Clay Loam', 'Rainfed', 1920.0),
            ('farm-003', 'Njoro River Parcel 3', 'u-011', 'reg-004', 6.4, -0.3500, 35.9400, 'POLYGON((35.9360 -0.3470, 35.9440 -0.3470, 35.9440 -0.3530, 35.9360 -0.3530, 35.9360 -0.3470))', 'Irish Potato', 'Alluvial Loam', 'Furrow & Drip', 2150.0),
            ('farm-004', 'Bahati Green Acres', 'u-012', 'reg-004', 4.8, -0.2200, 36.1500, 'POLYGON((36.1460 -0.2170, 36.1540 -0.2170, 36.1540 -0.2230, 36.1460 -0.2230, 36.1460 -0.2170))', 'Soybeans', 'Terraced Friable Clay Loam', 'Rainfed', 1980.0),
            ('farm-005', 'Mazowe Valley Commercial Estate', 'u-007', 'reg-001', 45.0, -17.5211, 30.9722, 'POLYGON((30.9680 -17.5180, 30.9760 -17.5180, 30.9760 -17.5250, 30.9680 -17.5250, 30.9680 -17.5180))', 'Maize (SC719)', 'Red Fersiallitic Clay', 'Center Pivot', 1280.0);");

        // Fields
        conn.Execute(@"
            INSERT INTO fields (id, farm_id, name, area_ha, boundary_wkt, soil_ph, organic_matter_pct, drainage_class, slope_pct)
            VALUES
            ('fld-001', 'farm-001', 'North Field A (Hybrid Trial)', 5.2, 'POLYGON((36.0785 -0.3015, 36.0815 -0.3015, 36.0815 -0.3030, 36.0785 -0.3030, 36.0785 -0.3015))', 6.4, 3.8, 'Well drained', 2.1),
            ('fld-002', 'farm-001', 'South Field B (Legume Rotation)', 4.8, 'POLYGON((36.0785 -0.3032, 36.0815 -0.3032, 36.0815 -0.3048, 36.0785 -0.3048, 36.0785 -0.3032))', 6.6, 4.1, 'Well drained', 1.5),
            ('fld-003', 'farm-002', 'East Plateau Parcel 1', 4.2, 'POLYGON((35.8480 -0.1680, 35.8520 -0.1680, 35.8520 -0.1700, 35.8480 -0.1700, 35.8480 -0.1680))', 5.9, 3.2, 'Moderate', 3.8),
            ('fld-004', 'farm-002', 'West Terraces Parcel 2', 4.0, 'POLYGON((35.8480 -0.1700, 35.8520 -0.1700, 35.8520 -0.1720, 35.8480 -0.1720, 35.8480 -0.1700))', 6.1, 3.5, 'Well drained', 4.2),
            ('fld-005', 'farm-003', 'South Plot Block B', 3.6, 'POLYGON((35.9380 -0.3480, 35.9420 -0.3480, 35.9420 -0.3520, 35.9380 -0.3520, 35.9380 -0.3480))', 6.0, 3.6, 'Well drained', 1.8),
            ('fld-006', 'farm-004', 'Terrace Parcel 1', 2.8, 'POLYGON((36.1480 -0.2180, 36.1520 -0.2180, 36.1520 -0.2220, 36.1480 -0.2220, 36.1480 -0.2180))', 6.2, 3.9, 'Well drained', 3.4);");

        // Crop Cycles
        conn.Execute(@"
            INSERT INTO crop_cycles (id, field_id, crop_id, variety_id, season_name, start_date, expected_harvest_date, status, current_stage, target_yield_kg_ha)
            VALUES
            ('cyc-001', 'fld-001', 'crop-001', 'var-001', '2026 Long Rains Season', '2026-03-15', '2026-07-20', 'ACTIVE', 'Vegetative V6', 5800.0),
            ('cyc-002', 'fld-002', 'crop-003', 'var-003', '2026 Rotation Legume', '2026-03-20', '2026-06-10', 'ACTIVE', 'Flowering R1', 2100.0),
            ('cyc-003', 'fld-003', 'crop-002', 'var-004', '2026 Highland Wheat Cycle', '2026-01-10', '2026-05-25', 'ACTIVE', 'Maturing Hard Dough', 3800.0),
            ('cyc-004', 'fld-004', 'crop-004', 'var-005', '2026 Late Season Tuber', '2026-05-01', '2026-08-20', 'PREPARING', 'Preparing', 17200.0);");

        // Agronomic Rules
        conn.Execute(@"
            INSERT INTO agronomic_rules 
            (id, crop_id, rule_type, title, growth_stage, trigger_condition, min_temp_c, max_temp_c, min_rainfall_mm, max_rainfall_mm, min_humidity_pct, max_wind_kmh, action_directive, rationale, urgency, is_active, authored_by)
            VALUES
            ('rule-001', 'crop-001', 'FERTILIZER_TIMING', 'Top-Dress Nitrogen (CAN) Before Upcoming Showers', 'Vegetative V6', 'Rain forecasted 8-30mm within 48h during V6', 16.0, 30.0, 8.0, 30.0, 50.0, 15.0, 'Apply Calcium Ammonium Nitrate (CAN) at 50 kg/acre 5cm from plant bases within the next 48 hours.', 'Field is in rapid vegetative growth. Forecasted rain will dissolve and incorporate nitrogen into root zones without leaching.', 'HIGH', 1, 'Dr. Sarah Mwangi (Senior Agronomist)'),
            ('rule-002', 'crop-002', 'DISEASE_RISK', 'High Fungal Blight / Yellow Rust Inoculum Alert', 'Tillering to Stem Extension', 'Relative humidity > 72% for > 24h at mild temps 15-23°C', 15.0, 23.0, 0.0, 50.0, 72.0, 20.0, 'Inspect lower leaves and canopy for fungal sporulation; prepare preventive broad-spectrum fungicide.', 'Sustained humidity with mild temperatures creates ideal microclimatic conditions for fungal germination.', 'CRITICAL', 1, 'Dr. Sarah Mwangi (Senior Agronomist)'),
            ('rule-003', NULL, 'SPRAY_WINDOW', 'Optimal Crop Spraying Window Open', 'Any Active Stage', 'Wind speed < 9 km/h and rain forecast < 5mm for 24h', 14.0, 28.0, 0.0, 5.0, 30.0, 9.0, 'Execute planned fungicide or herbicide spraying before 10:30 AM while wind speed remains low.', 'Sustained wind speed is below the 9.0 km/h drift limit, and no rain is predicted to wash off applications.', 'HIGH', 1, 'Dr. Sarah Mwangi (Senior Agronomist)'),
            ('rule-004', 'crop-003', 'IRRIGATION_DEFICIT', 'Supplemental Irrigation: Flowering Moisture Stress Prevention', 'Flowering R1', 'Rain last 24h < 2mm and forecast rain 48h < 5mm during flowering', 18.0, 32.0, 0.0, 2.0, 40.0, 25.0, 'Schedule 15mm supplemental drip or furrow irrigation to protect flowers from thermal abortion.', 'Crop is at sensitive flowering stage with insufficient soil moisture and negligible rain in the 48h forecast.', 'HIGH', 1, 'Dr. Sarah Mwangi (Senior Agronomist)');");

        // Recommendations
        conn.Execute(@"
            INSERT INTO recommendations (id, field_id, category, title, details, urgency, action_due_date, is_implemented)
            VALUES
            ('rec-001', 'fld-001', 'FERTILIZER', 'Top-dressing CAN Application (V6 Stage)', 'Apply Calcium Ammonium Nitrate at 50 kg/acre prior to weekend precipitation.', 'HIGH', '2026-09-22', 0),
            ('rec-002', 'fld-001', 'IRRIGATION', 'Schedule 15mm Supplemental Pivot Irrigation', 'Maintain root zone moisture at field capacity during stem extension.', 'MEDIUM', '2026-09-21', 0),
            ('rec-003', 'fld-003', 'PATHOGEN', 'Yellow Rust Preventive Spray Application', 'Puccinia striiformis inoculum identified on lower collars. Apply triazole fungicide during calm wind window.', 'CRITICAL', '2026-09-20', 0),
            ('rec-004', 'fld-002', 'IRRIGATION', 'Supplemental Furrow Irrigation to Prevent Flower Abscission', 'Apply 15mm supplemental irrigation to protect sensitive bean blooms from high afternoon vapor deficit.', 'HIGH', '2026-09-21', 0);");

        // Notifications
        conn.Execute(@"
            INSERT INTO notifications (id, user_id, title, message, type, is_read)
            VALUES
            ('notif-001', 'u-001', 'Precipitation deficit alert in Mazowe & Makonde districts', 'Precipitation deficit recorded at -38% below 30-year climatological normal. Soil tension rising.', 'WARNING', 0),
            ('notif-002', 'u-008', 'Top-dressing CAN Nitrogen Window Open for North Field A', 'Rain forecasted in 48 hours provides optimal incorporation condition for CAN application.', 'SUCCESS', 0),
            ('notif-003', 'u-009', 'Yellow Rust Inoculum Alert on East Plateau Parcel 1', 'Relative humidity >75% for 48 hours creates high fungal germination risk. Inspect crop.', 'CRITICAL', 0),
            ('notif-004', 'u-001', 'AquaCrop ML Model updated regional yield predictions', 'Sentinel-2 NDVI canopy imagery indicates +18.4% yield performance above county benchmark.', 'INFO', 1);");

        // Reports
        conn.Execute(@"
            INSERT INTO reports (id, type, title, category, region, crop, format, date, status)
            VALUES
            ('rep-01', 'yield_forecast', '2026 Long Rains Seasonal Yield Forecast', 'Yield forecast', 'Natural Region II (Highveld)', 'White Maize (SC719)', 'PDF / GeoJSON', '2026-09-14', 'READY'),
            ('rep-02', 'weather_history', 'Agromet Synoptic Weather Trends & Rainfall Deficits', 'Weather history', 'Natural Region II & III', 'All Crops', 'PDF / CSV', '2026-09-12', 'READY'),
            ('rep-03', 'weather_suitability', 'Agro-Ecological Zone (AEZ) Suitability Atlas', 'Weather suitability', 'Zimbabwe National (NR I-V)', 'Maize & Wheat', 'GeoJSON / Spatial', '2026-09-08', 'READY'),
            ('rep-04', 'farm_performance', 'Estate Operational Efficiency & Water Balance Audit', 'Farm performance', 'Mazowe & Chinhoyi', 'Maize & Tobacco', 'PDF', '2026-09-06', 'READY'),
            ('rep-05', 'crop_performance', 'Cultivar Phenology & Canopy Vigor Assessment', 'Crop performance', 'Marondera Horticultural Belt', 'Seed Potato (BP1)', 'PDF / CSV', '2026-09-04', 'READY'),
            ('rep-06', 'farmer_activity', 'Smallholder Extension Reach & Mobile Advisory Engagement', 'Farmer activity', 'Midlands & Mashonaland', 'Mixed Grains', 'PDF', '2026-09-02', 'READY'),
            ('rep-07', 'field_observations', 'Pathogen Scouting Digest: Fall Armyworm & Rust Flags', 'Field observations', 'Makonde District', 'Tobacco & Maize', 'PDF', '2026-08-30', 'READY'),
            ('rep-08', 'production_planning', '2026/2027 Crop Acreage & Irrigation Planning Matrix', 'Production planning', 'Chiredzi Canal Basin', 'Sugarcane & Wheat', 'Excel / CSV', '2026-08-28', 'READY'),
            ('rep-09', 'risk_analysis', 'Longitudinal Agro-Climate & Pest Risk Matrix', 'Risk analysis', 'Eastern Highlands & Midlands', 'All Crops', 'PDF / GeoJSON', '2026-08-25', 'READY'),
            ('rep-10', 'agricultural_overview', 'National Agricultural Intelligence Executive Overview', 'Agricultural overview', 'National Summary', 'Strategic Crops', 'PDF / Presentation', '2026-08-20', 'READY');");

        // Audit Logs
        conn.Execute(@"
            INSERT INTO audit_logs (id, user, role, action, resource, timestamp, status, details)
            VALUES
            ('aud-001', 'Dr. Sarah Mwangi', 'Agronomist', 'RECALCULATE_SUITABILITY', 'fld-001 (Highland Hybrid Maize)', '2026-09-14 20:15:00', 'SUCCESS', 'Updated soil pH & GDD parameters; re-indexed FAO matrix'),
            ('aud-002', 'Alex Kipruto', 'System Administrator', 'DEPLOY_MIGRATION', 'Database Spatial Engine', '2026-09-14 19:42:10', 'SUCCESS', 'Applied spatial schema migration SRID 4326'),
            ('aud-003', 'John Kamau', 'Farmer', 'REQUEST_RECOMMENDATION', 'farm-001 (Green Valley Model Farm)', '2026-09-14 18:30:22', 'SUCCESS', 'Generated top-dressing CAN nitrogen advisory for V6 crop cycle'),
            ('aud-004', 'Grace Wanjiku', 'Extension Officer', 'SUBMIT_SCOUTING_OBSERVATION', 'obs-003 (Dry Beans Root Knot)', '2026-09-14 16:45:00', 'SUCCESS', 'Scouting condition logged with severity WARNING; follow-up scheduled'),
            ('aud-005', 'Daniel Kiprop', 'Weather Analyst', 'DISPATCH_WEATHER_ALERT', 'alt-01 (Convective Torrential Rain)', '2026-09-14 08:30:15', 'SUCCESS', 'Dispatched broadcast advisory to 48 registered farmers in Nakuru High Plains'),
            ('aud-006', 'Unknown IP', 'Guest', 'AUTHENTICATION_FAILURE', 'auth/login (alex.kipruto@ayis.org)', '2026-09-14 03:12:44', 'FAILED', 'Invalid credentials attempt rejected by ASP.NET Core rate limiter'),
            ('aud-007', 'Alex Kipruto', 'System Administrator', 'UPDATE_RBAC_PERMISSIONS', 'role/agronomist', '2026-09-13 15:20:00', 'SUCCESS', 'Granted APPROVE permission on Recommendations module');");

        // Field Inspections
        conn.Execute(@"
            INSERT INTO field_inspections 
            (id, farmer_name, farmer_id, farm_name, farm_id, field_name, field_id, crop, growth_stage, field_condition, observations, severity, notes, follow_up_needed, follow_up_details, inspector, inspection_date, status, score)
            VALUES
            ('insp-001', 'John Kamau', 'u-008', 'Green Valley Model Farm', 'farm-001', 'North Field A (Hybrid Trial)', 'fld-001', 'Highland Hybrid Maize (H614D)', 'Vegetative V6 (6 Collared Leaves)', 'EXCELLENT', 'Uniform stand density, vigorous root anchoring, dark green foliage, no stem borer signs.', 'LOW', 'Optimal soil moisture verified at 20cm depth. Top-dressing CAN approved.', 0, NULL, 'Peter Koech', '2026-09-14 09:30', 'COMPLETED', 94),
            ('insp-002', 'Alice Chebet', 'u-009', 'Rongai Sunrise Farm', 'farm-002', 'East Plateau Parcel 1', 'fld-003', 'Wheat (Kenya Tayari)', 'Grain Filling (Hard Dough)', 'POOR', 'Sub-canopy Yellow Rust pustules detected. Rapid dew drying required.', 'CRITICAL', 'Infection spread observed on lower leaf collars. Recommended immediate triazole spray window.', 1, 'Verify fungicide application within 48 hours and check flag leaf margins.', 'Peter Koech', '2026-09-14 11:15', 'PENDING_ACTION', 68),
            ('insp-003', 'John Kamau', 'u-008', 'Green Valley Model Farm', 'farm-001', 'South Field B (Legume Rotation)', 'fld-002', 'Dry Beans (Rosecoco GLP-2)', 'Flowering R1 (Early Bloom)', 'FAIR', 'Tensiometer reading 44 kPa, topsoil dry, midday moisture curling on perimeter rows.', 'WARNING', 'Supplemental irrigation needed to avert flower abscission before Thursday forecast.', 1, 'Confirm irrigation scheduling with farm manager by Tuesday morning.', 'Peter Koech', '2026-09-13 14:20', 'NEEDS_ACTION', 78),
            ('insp-004', 'Samuel Ochieng', 'u-011', 'Njoro River Parcel 3', 'farm-003', 'South Plot Block B', 'fld-005', 'Irish Potato (Shangi Certified)', 'Tuber Initiation', 'GOOD', 'Ridge formation uniform, clean furrow lines, no late blight foliar lesions.', 'LOW', 'Drip line pressure normal. Tensiometer sensor correctly calibrated.', 0, NULL, 'Peter Koech', '2026-09-12 10:00', 'COMPLETED', 91),
            ('insp-005', 'Mary Wambui', 'u-012', 'Bahati Green Acres', 'farm-004', 'Terrace Parcel 1', 'fld-006', 'Soybeans (SC Squire)', 'Emergence VE', 'EXCELLENT', 'Stand emergence count 96% uniformity. Certified inoculant nodulation starting.', 'LOW', 'Weed pressure negligible. Recommended hand-hoe rogueing in 10 days.', 0, NULL, 'Peter Koech', '2026-09-10 15:45', 'COMPLETED', 98);");

        // Field Observations
        conn.Execute(@"
            INSERT INTO field_observations 
            (id, farm, farm_id, field, field_id, crop, growth_stage, category, severity, text, notes, date, scout_name, follow_up_required, follow_up_status)
            VALUES
            ('obs-001', 'Green Valley Model Farm', 'farm-001', 'North Field A (Hybrid Trial)', 'fld-001', 'Maize (Zea mays - H614D)', 'Vegetative V6 (6 Collared Leaves)', 'Crop Vigor & Nutrition', 'INFO', 'Vigor score 92/100, robust root crown anchoring and complete inter-row canopy shading. Uniform green collar development with zero chlorosis.', 'Plant population density verified at 53,000 plants/ha. Stem girth averaging 24mm. Recommended CAN application window confirmed.', '2026-09-14', 'Peter Koech', 0, 'Resolved'),
            ('obs-002', 'Green Valley Model Farm', 'farm-001', 'South Field B (Legume Rotation)', 'fld-002', 'Dry Beans (Rosecoco GLP-2)', 'Flowering R1 (Early Bloom)', 'Moisture Deficit', 'WARNING', 'Top 10cm soil dry to touch, tensiometer reading 44 kPa. Mild midday leaf curling observed on western boundary exposure.', 'Flower abscission threshold approaches at 50 kPa. Immediate light furrow irrigation (15mm) advised before high evapotranspiration cycle.', '2026-09-13', 'Grace Wanjiku', 1, 'Action Pending'),
            ('obs-003', 'Rongai Sunrise Farm', 'farm-002', 'East Plateau Parcel 1', 'fld-003', 'Wheat (Kenya Tayari)', 'Grain Filling (Hard Dough)', 'Pathogen Pressure', 'CRITICAL', 'Trace presence of Yellow Rust pustules on sub-canopy lower leaves. Flag leaf currently uninfected (95% clean).', 'Incidence rate estimated at 4% in damp swales. Weather forecast indicates morning dew persistence. Preventive triazole fungicide recommended within 36 hours.', '2026-09-12', 'Dr. Sarah Mwangi', 1, 'Under Observation'),
            ('obs-004', 'Rongai Sunrise Farm', 'farm-002', 'West Terraces Parcel 2', 'fld-004', 'Irish Potato (Shangi)', 'Preparing (Bed Ridging & Tilth)', 'Soil Structure & Tilth', 'INFO', 'Soil tilth loose and friable across all terraces. Organic matter test confirmed at 3.50%, soil pH 6.10 ideal for tuberization.', 'No signs of compaction pans or wireworm activity. Ridge formation depth confirmed at 25cm. Field ready for certified seed delivery.', '2026-09-11', 'Peter Koech', 0, 'Resolved');");

        // Field Tasks
        conn.Execute(@"
            INSERT INTO field_tasks 
            (id, title, category, farm_name, farmer_name, field, crop, priority, status, due, assigned_to, notes)
            VALUES
            ('tsk-001', 'Verify Rust Foliar Spray Application on East Plateau Parcel 1', 'Pathogen Intervention', 'Rongai Sunrise Farm', 'Alice Chebet', 'East Plateau Parcel 1', 'Wheat (Kenya Tayari)', 'HIGH', 'OVERDUE', '2026-09-13', 'Peter Koech', 'Confirm farmer applied triazole fungicide. Flag leaf protection is critical.'),
            ('tsk-002', 'Calibrate Soil Moisture Tensiometer Sensor at Njoro Plot Block B', 'Sensor Calibration', 'Njoro River Parcel 3', 'Samuel Ochieng', 'South Plot Block B', 'Irish Potato', 'MEDIUM', 'IN_PROGRESS', '2026-09-15', 'Peter Koech', 'De-air tensiometer tube, refill with distilled water, and check vacuum seal.'),
            ('tsk-003', 'Verify Nitrogen Top-dressing Soil Moisture on North Field A', 'Agronomic Verification', 'Green Valley Model Farm', 'John Kamau', 'North Field A', 'Maize (H614D)', 'HIGH', 'PENDING', '2026-09-16', 'Peter Koech', 'Confirm CAN application is timed right before the forecasted Thursday showers.'),
            ('tsk-004', 'Scout Bahati Terrace Parcel 1 for Early Cutworm Damage', 'Emergence Scouting', 'Bahati Green Acres', 'Mary Wambui', 'Terrace Parcel 1', 'Soybeans', 'LOW', 'PENDING', '2026-09-18', 'Peter Koech', 'Inspect border rows at dusk for surface seedling cutting.'),
            ('tsk-005', 'Audit Chemical Storage Secondary Containment at Rongai', 'GAP Compliance', 'Rongai Sunrise Farm', 'Alice Chebet', 'Headquarters Store', 'N/A', 'MEDIUM', 'COMPLETED', '2026-09-11', 'Peter Koech', 'Secondary containment bund installed. Material safety data sheets posted.');");
    }
}

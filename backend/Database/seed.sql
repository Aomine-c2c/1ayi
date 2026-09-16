-- ==========================================================
-- AYIS Reference & Demonstration Seed Data
-- ==========================================================

USE `ayis_db`;

-- Default Users (Passwords hashed for: 'Password123!')
-- BCrypt hash format: $2a$11$...
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`, `is_staff`)
VALUES 
('u-001', 'admin', 'admin@ayis.org', '$2a$11$qR0qZJ9H5nN1fV.aB4sHbe3VbYn9M/bTqXpU9f2zKjXzF7p6/3b6O', 'System', 'Administrator', 'admin', 1, 1),
('u-002', 'officer_sarah', 'sarah.mwangi@ayis.org', '$2a$11$qR0qZJ9H5nN1fV.aB4sHbe3VbYn9M/bTqXpU9f2zKjXzF7p6/3b6O', 'Sarah', 'Mwangi', 'agricultural_officer', 1, 0),
('u-003', 'farmer_john', 'john.kamau@farms.ke', '$2a$11$qR0qZJ9H5nN1fV.aB4sHbe3VbYn9M/bTqXpU9f2zKjXzF7p6/3b6O', 'John', 'Kamau', 'farmer', 1, 0)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- Regions
INSERT INTO `farm_regions` (`id`, `name`, `county`, `climate_zone`)
VALUES
('reg-001', 'Nakuru High Plains', 'Nakuru', 'Highland Sub-tropical'),
('reg-002', 'Uasin Gishu Plateau', 'Uasin Gishu', 'Moist Transitional'),
('reg-003', 'Kiambu South', 'Kiambu', 'Upper Midland')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Reference Crops
INSERT INTO `crops` (
    `id`, `name`, `scientific_name`, `category`, `description`, 
    `growing_days_min`, `growing_days_max`, `growing_days_typical`, 
    `optimal_temp_min`, `optimal_temp_max`, `rainfall_min_mm`, `rainfall_optimum_mm`, `rainfall_max_mm`, 
    `expected_yield_min_kg_ha`, `expected_yield_max_kg_ha`, `expected_yield_typical_kg_ha`, 
    `frost_sensitive`, `sunlight_hours_min`, `suitable_months_json`, `planting_season`
) VALUES
('crop-001', 'Maize', 'Zea mays', 'Cereal', 'Primary staple grain across East Africa.', 90, 120, 105, 18.0, 30.0, 500.0, 750.0, 1200.0, 3000.0, 6000.0, 4500.0, 1, 6, '[3, 4, 5, 8, 9, 10]', 'Long rains (Mar-May), Short rains (Aug-Oct)'),
('crop-002', 'Wheat', 'Triticum aestivum', 'Cereal', 'Cool-season cereal grain produced in highland plateaus.', 100, 140, 120, 10.0, 25.0, 350.0, 550.0, 900.0, 2500.0, 5000.0, 3500.0, 1, 6, '[10, 11, 12, 1, 2, 3]', 'Autumn planting for spring harvest'),
('crop-003', 'Beans', 'Phaseolus vulgaris', 'Legume', 'Nitrogen-fixing grain legume essential for soil replenishment.', 60, 90, 75, 15.0, 25.0, 400.0, 600.0, 800.0, 1200.0, 2500.0, 1800.0, 1, 6, '[3, 4, 9, 10]', 'Intercropped or rotated with cereals'),
('crop-004', 'Irish Potato', 'Solanum tuberosum', 'Tuber', 'Highland tuber crop requiring cool temperatures.', 90, 120, 105, 15.0, 22.0, 500.0, 700.0, 1000.0, 15000.0, 30000.0, 22000.0, 1, 6, '[4, 5, 9, 10]', 'Bimodal rainfall highlands'),
('crop-005', 'Coffee (Arabica)', 'Coffea arabica', 'Cash Crop', 'Premium highland cash crop with volcanic soil affinity.', 240, 300, 270, 15.0, 24.0, 1200.0, 1600.0, 2200.0, 1000.0, 3000.0, 1800.0, 1, 5, '[3, 4, 10, 11]', 'Perennial harvest cycles')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Crop Varieties
INSERT INTO `crop_varieties` (`id`, `crop_id`, `name`, `maturity_days`, `drought_tolerance`, `disease_resistance`, `yield_potential_kg_ha`, `recommended_regions`)
VALUES
('var-001', 'crop-001', 'H614D (Highland Hybrid)', 120, 'Medium', 'Leaf Rust, Grey Leaf Spot', 6500.00, 'Nakuru, Uasin Gishu, Trans Nzoia'),
('var-002', 'crop-001', 'DK8031 (Drought-Tolerant)', 95, 'High', 'Maize Lethal Necrosis tolerant', 5500.00, 'Machakos, Embu, Lower Sub-humid'),
('var-003', 'crop-003', 'Rosecoco (GLP-2)', 75, 'Medium', 'Anthracnose tolerant', 2200.00, 'Nationwide mid-altitudes')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Farms (Using Spatial WKT)
INSERT INTO `farms` (`id`, `name`, `owner_id`, `region_id`, `size_ha`, `location`, `boundary`, `primary_crop`, `soil_type`, `irrigation_type`, `elevation_m`)
VALUES
('farm-001', 'Green Valley Model Farm', 'u-003', 'reg-001', 12.50, 
 ST_GeomFromText('POINT(36.0800 -0.3031)', 4326), 
 ST_GeomFromText('POLYGON((36.0780 -0.3010, 36.0820 -0.3010, 36.0820 -0.3050, 36.0780 -0.3050, 36.0780 -0.3010))', 4326),
 'Maize', 'Volcanic Loam', 'Drip Irrigation', 1850.00),
('farm-002', 'Rongai Sunrise Farm', 'u-003', 'reg-001', 8.20, 
 ST_GeomFromText('POINT(35.8500 -0.1700)', 4326), 
 ST_GeomFromText('POLYGON((35.8480 -0.1680, 35.8520 -0.1680, 35.8520 -0.1720, 35.8480 -0.1720, 35.8480 -0.1680))', 4326),
 'Wheat', 'Clay Loam', 'Rainfed', 1920.00)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Fields
INSERT INTO `fields` (`id`, `farm_id`, `name`, `area_ha`, `boundary`, `soil_ph`, `organic_matter_pct`, `drainage_class`, `slope_pct`)
VALUES
('fld-001', 'farm-001', 'North Field A (Hybrid Trial)', 5.20, 
 ST_GeomFromText('POLYGON((36.0785 -0.3015, 36.0815 -0.3015, 36.0815 -0.3030, 36.0785 -0.3030, 36.0785 -0.3015))', 4326),
 6.40, 3.80, 'Well drained', 2.10),
('fld-002', 'farm-001', 'South Field B (Legume Rotation)', 4.80, 
 ST_GeomFromText('POLYGON((36.0785 -0.3032, 36.0815 -0.3032, 36.0815 -0.3048, 36.0785 -0.3048, 36.0785 -0.3032))', 4326),
 6.60, 4.10, 'Well drained', 1.50)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Crop Cycles
INSERT INTO `crop_cycles` (`id`, `field_id`, `crop_id`, `variety_id`, `season_name`, `start_date`, `expected_harvest_date`, `status`, `current_stage`, `target_yield_kg_ha`)
VALUES
('cyc-001', 'fld-001', 'crop-001', 'var-001', '2026 Long Rains Season', '2026-03-15', '2026-07-20', 'ACTIVE', 'Vegetative V6', 5800.00),
('cyc-002', 'fld-002', 'crop-003', 'var-003', '2026 Rotation Legume', '2026-03-20', '2026-06-10', 'ACTIVE', 'Flowering R1', 2100.00)
ON DUPLICATE KEY UPDATE `season_name` = VALUES(`season_name`);

-- Weather Station
INSERT INTO `weather_stations` (`id`, `name`, `code`, `location`, `elevation_m`, `is_active`)
VALUES
('ws-001', 'Nakuru Central Agromet Station', 'NKU-01', ST_GeomFromText('POINT(36.0750 -0.2980)', 4326), 1860.00, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Recent Weather Observations
INSERT INTO `weather_observations` (`station_id`, `timestamp`, `temperature_c`, `temp_min_c`, `temp_max_c`, `humidity_pct`, `rainfall_mm`, `wind_speed_kmh`, `solar_radiation_mj`)
VALUES
('ws-001', '2026-09-14 06:00:00', 16.2, 14.5, 17.0, 88.0, 0.0, 6.5, 8.2),
('ws-001', '2026-09-14 12:00:00', 25.4, 16.2, 26.1, 54.0, 1.2, 12.0, 22.4),
('ws-001', '2026-09-14 18:00:00', 20.8, 19.5, 25.4, 72.0, 4.8, 8.1, 14.0);

-- Suitability Assessment
INSERT INTO `suitability_assessments` (`id`, `field_id`, `crop_id`, `suitability_score`, `suitability_class`, `temperature_score`, `rainfall_score`, `soil_score`, `limiting_factors`)
VALUES
('sa-001', 'fld-001', 'crop-001', 91.50, 'HIGHLY_SUITABLE', 94.00, 88.50, 92.00, '{"note": "Optimal thermal regime and balanced pH"}'),
('sa-002', 'fld-001', 'crop-002', 64.00, 'MODERATELY_SUITABLE', 60.00, 70.00, 62.00, '{"note": "Temperature occasionally exceeds upper threshold during grain filling"}')
ON DUPLICATE KEY UPDATE `suitability_score` = VALUES(`suitability_score`);

-- Yield Predictions
INSERT INTO `yield_predictions` (`id`, `cycle_id`, `predicted_yield_kg_ha`, `confidence_lower_kg_ha`, `confidence_upper_kg_ha`, `confidence_score_pct`, `factors_json`)
VALUES
('yp-001', 'cyc-001', 5620.00, 5240.00, 6000.00, 89.20, '{"soil_moisture_index": 0.84, "gdd_accumulated": 480, "ndvi_mean": 0.72}');

-- Active Recommendations
INSERT INTO `recommendations` (`id`, `field_id`, `category`, `title`, `details`, `urgency`, `action_due_date`, `is_implemented`)
VALUES
('rec-001', 'fld-001', 'FERTILIZER', 'Top-dressing CAN Application (V6 Stage)', 'Apply Calcium Ammonium Nitrate at 150 kg/ha before expected rain to maximize nitrogen assimilation.', 'HIGH', '2026-09-18', 0),
('rec-002', 'fld-001', 'IRRIGATION', 'Schedule 15mm Supplemental Drip Irrigation', 'Moisture deficit detected in root zone (0-30cm); run zone 1 for 2.5 hours.', 'MEDIUM', '2026-09-16', 0)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`)
VALUES
('notif-001', 'u-003', 'Top-dressing Due in 4 Days', 'CAN fertilizer application recommended for North Field A.', 'TASK', 0),
('notif-002', 'u-003', 'Rainfall Alert', 'Expect 15-25mm precipitation over Nakuru High Plains over the next 48 hours.', 'ALERT', 0)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

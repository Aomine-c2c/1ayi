-- ==========================================================
-- AYIS (Agricultural Yield Intelligence System)
-- MySQL 8 Spatial Database Schema
-- Compatible with C# Minimal APIs + Dapper
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `ayis_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `ayis_db`;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `username` VARCHAR(150) NOT NULL UNIQUE,
    `email` VARCHAR(254) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(150) NOT NULL DEFAULT '',
    `last_name` VARCHAR(150) NOT NULL DEFAULT '',
    `phone_number` VARCHAR(32) NULL,
    `role` ENUM('admin', 'agricultural_officer', 'farmer') NOT NULL DEFAULT 'farmer',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_staff` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `token` VARCHAR(512) NOT NULL UNIQUE,
    `expires_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Regions & Farms (Geospatial)
CREATE TABLE IF NOT EXISTS `farm_regions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `county` VARCHAR(100) NOT NULL,
    `climate_zone` VARCHAR(50) NOT NULL DEFAULT 'Sub-humid',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `farms` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `owner_id` VARCHAR(36) NOT NULL,
    `region_id` VARCHAR(36) NULL,
    `size_ha` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    `location` POINT NOT NULL SRID 4326,
    `boundary` POLYGON NULL SRID 4326,
    `primary_crop` VARCHAR(100) NULL,
    `soil_type` VARCHAR(100) NOT NULL DEFAULT 'Loam',
    `irrigation_type` VARCHAR(50) NOT NULL DEFAULT 'Rainfed',
    `elevation_m` DECIMAL(8, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    SPATIAL INDEX `sp_idx_farms_location` (`location`),
    CONSTRAINT `fk_farms_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farms_region` FOREIGN KEY (`region_id`) REFERENCES `farm_regions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `fields` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `farm_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `area_ha` DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
    `boundary` POLYGON NOT NULL SRID 4326,
    `soil_ph` DECIMAL(4, 2) NULL,
    `organic_matter_pct` DECIMAL(5, 2) NULL,
    `drainage_class` VARCHAR(50) NOT NULL DEFAULT 'Well drained',
    `slope_pct` DECIMAL(5, 2) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    SPATIAL INDEX `sp_idx_fields_boundary` (`boundary`),
    CONSTRAINT `fk_fields_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Crops & Reference Data
CREATE TABLE IF NOT EXISTS `crops` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `scientific_name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `growing_days_min` INT NOT NULL DEFAULT 90,
    `growing_days_max` INT NOT NULL DEFAULT 120,
    `growing_days_typical` INT NOT NULL DEFAULT 105,
    `optimal_temp_min` DECIMAL(5, 2) NOT NULL,
    `optimal_temp_max` DECIMAL(5, 2) NOT NULL,
    `rainfall_min_mm` DECIMAL(8, 2) NOT NULL,
    `rainfall_optimum_mm` DECIMAL(8, 2) NOT NULL,
    `rainfall_max_mm` DECIMAL(8, 2) NOT NULL,
    `expected_yield_min_kg_ha` DECIMAL(10, 2) NOT NULL,
    `expected_yield_max_kg_ha` DECIMAL(10, 2) NOT NULL,
    `expected_yield_typical_kg_ha` DECIMAL(10, 2) NOT NULL,
    `frost_sensitive` BOOLEAN NOT NULL DEFAULT TRUE,
    `sunlight_hours_min` INT NOT NULL DEFAULT 6,
    `suitable_months_json` JSON NOT NULL,
    `planting_season` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `crop_varieties` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `crop_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `maturity_days` INT NOT NULL,
    `drought_tolerance` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    `disease_resistance` TEXT NULL,
    `yield_potential_kg_ha` DECIMAL(10, 2) NOT NULL,
    `recommended_regions` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_varieties_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Production & Crop Cycles
CREATE TABLE IF NOT EXISTS `crop_cycles` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `field_id` VARCHAR(36) NOT NULL,
    `crop_id` VARCHAR(36) NOT NULL,
    `variety_id` VARCHAR(36) NULL,
    `season_name` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `expected_harvest_date` DATE NOT NULL,
    `actual_harvest_date` DATE NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'HARVESTED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `current_stage` VARCHAR(50) NOT NULL DEFAULT 'Planting',
    `target_yield_kg_ha` DECIMAL(10, 2) NULL,
    `actual_yield_kg_ha` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_cycles_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cycles_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_cycles_variety` FOREIGN KEY (`variety_id`) REFERENCES `crop_varieties` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Weather Stations & Observations
CREATE TABLE IF NOT EXISTS `weather_stations` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `location` POINT NOT NULL SRID 4326,
    `elevation_m` DECIMAL(8, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    SPATIAL INDEX `sp_idx_weather_stations` (`location`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `weather_observations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `station_id` VARCHAR(36) NOT NULL,
    `timestamp` DATETIME(6) NOT NULL,
    `temperature_c` DECIMAL(5, 2) NOT NULL,
    `temp_min_c` DECIMAL(5, 2) NULL,
    `temp_max_c` DECIMAL(5, 2) NULL,
    `humidity_pct` DECIMAL(5, 2) NOT NULL,
    `rainfall_mm` DECIMAL(7, 2) NOT NULL DEFAULT 0.00,
    `wind_speed_kmh` DECIMAL(6, 2) NULL,
    `solar_radiation_mj` DECIMAL(6, 2) NULL,
    INDEX `idx_weather_timestamp` (`station_id`, `timestamp`),
    CONSTRAINT `fk_weather_station` FOREIGN KEY (`station_id`) REFERENCES `weather_stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `weather_alerts` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `region_id` VARCHAR(36) NULL,
    `severity` ENUM('ADVISORY', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'ADVISORY',
    `event_type` VARCHAR(100) NOT NULL,
    `headline` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `effective_from` DATETIME(6) NOT NULL,
    `effective_until` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_alerts_region` FOREIGN KEY (`region_id`) REFERENCES `farm_regions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Suitability & Yield Predictions
CREATE TABLE IF NOT EXISTS `suitability_assessments` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `field_id` VARCHAR(36) NOT NULL,
    `crop_id` VARCHAR(36) NOT NULL,
    `suitability_score` DECIMAL(5, 2) NOT NULL,
    `suitability_class` ENUM('HIGHLY_SUITABLE', 'MODERATELY_SUITABLE', 'MARGINALLY_SUITABLE', 'NOT_SUITABLE') NOT NULL,
    `temperature_score` DECIMAL(5, 2) NOT NULL,
    `rainfall_score` DECIMAL(5, 2) NOT NULL,
    `soil_score` DECIMAL(5, 2) NOT NULL,
    `limiting_factors` JSON NULL,
    `assessed_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_suitability_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_suitability_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `yield_predictions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `cycle_id` VARCHAR(36) NOT NULL,
    `predicted_yield_kg_ha` DECIMAL(10, 2) NOT NULL,
    `confidence_lower_kg_ha` DECIMAL(10, 2) NOT NULL,
    `confidence_upper_kg_ha` DECIMAL(10, 2) NOT NULL,
    `confidence_score_pct` DECIMAL(5, 2) NOT NULL,
    `factors_json` JSON NULL,
    `calculated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_yield_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `crop_cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `recommendations` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `field_id` VARCHAR(36) NOT NULL,
    `category` ENUM('IRRIGATION', 'FERTILIZER', 'PEST_CONTROL', 'HARVEST', 'PLANTING') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `details` TEXT NOT NULL,
    `urgency` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `action_due_date` DATE NULL,
    `is_implemented` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_recommendations_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Agronomic Rules Engine (Authored & Configured by Agronomist)
CREATE TABLE IF NOT EXISTS `agronomic_rules` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `crop_id` VARCHAR(36) NULL,
    `rule_type` ENUM('PRE_SEASON_CROP_SELECTION', 'SPRAY_WINDOW', 'FERTILIZER_TIMING', 'DISEASE_RISK', 'IRRIGATION_DEFICIT') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `growth_stage` VARCHAR(50) NULL,
    `trigger_condition` VARCHAR(255) NOT NULL,
    `min_temp_c` DECIMAL(5, 2) NULL,
    `max_temp_c` DECIMAL(5, 2) NULL,
    `min_rainfall_mm` DECIMAL(7, 2) NULL,
    `max_rainfall_mm` DECIMAL(7, 2) NULL,
    `min_humidity_pct` DECIMAL(5, 2) NULL,
    `max_wind_kmh` DECIMAL(5, 2) NULL,
    `action_directive` TEXT NOT NULL,
    `rationale` TEXT NOT NULL,
    `urgency` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `authored_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_rules_crop` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rules_author` FOREIGN KEY (`authored_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Notifications, Reports & Audit
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('ALERT', 'INFO', 'TASK', 'RECOMMENDATION') NOT NULL DEFAULT 'INFO',
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reports` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `report_type` VARCHAR(50) NOT NULL,
    `generated_by` VARCHAR(36) NOT NULL,
    `parameters_json` JSON NULL,
    `data_json` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NOT NULL,
    `resource_id` VARCHAR(100) NULL,
    `ip_address` VARCHAR(45) NULL,
    `details` JSON NULL,
    `timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_audit_resource` (`resource_type`, `resource_id`),
    INDEX `idx_audit_user` (`user_id`, `timestamp`)
) ENGINE=InnoDB;

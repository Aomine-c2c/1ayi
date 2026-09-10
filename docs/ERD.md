# AYIS — Entity Relationship Diagram (ERD)

**Status:** Post REFINE 03. All models defined, migrations clean.
**Date:** 2026-09-08
**Database:** PostgreSQL 17 + PostGIS 3.4

---

## Entity Overview

The schema follows the layered architecture: users → farms → cycles → weather → intelligence → production, with cross-cutting concerns (audit, notifications, settings, reports) attached throughout.

---

## 1. Users & Roles

### `auth_user` (Django auth.User, extended)
| Column | Type | Notes |
|---|---|---|
| id | PK | BigAutoField |
| password | varchar(128) | hashed |
| last_login | timestamp | nullable |
| is_superuser | boolean | |
| username | varchar(150) | unique |
| first_name | varchar(150) | |
| last_name | varchar(150) | |
| email | varchar(254) | |
| is_staff | boolean | |
| is_active | boolean | |
| date_joined | timestamp | |
| role | varchar(10) | farmer\|officer\|admin, default farmer |

**Indexes:** username (unique), email

### `users_role`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(100) | unique |
| slug | varchar(50) | unique |
| description | text | |
| is_system | boolean | built-in roles |
| created_at | timestamp | |
| updated_at | timestamp | |

### `users_userrole`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK→auth_user | |
| role_id | FK→users_role | |
| assigned_by_id | FK→auth_user (nullable) | |
| assigned_at | timestamp | |
| note | varchar(255) | |

**Unique:** (user_id, role_id)

### `users_rolepermission`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| role_id | FK→users_role | |
| permission_code | varchar(100) | |
| description | varchar(255) | |
| created_at | timestamp | |

**Unique:** (role_id, permission_code)

---

## 2. Farms

### `farms_farm`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| owner_id | FK→auth_user (CASCADE) | |
| name | varchar(255) | |
| location | geography(Point,4326) | PostGIS WGS84 |
| area_ha | decimal(10,3) | nullable |
| notes | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** owner_id, name
**GIST index:** location (spatial)

### `farms_farmregion`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(200) | |
| region_type | varchar(50) | |
| boundary | geography(MultiPolygon,4326) | PostGIS polygon |
| centroid | geography(Point,4326) | |
| description | text | |
| external_ref | varchar(100) | |
| is_active | boolean | default true |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (region_type, is_active)
**GIST index:** boundary (spatial)

### `farms_officerassignment`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| officer_id | FK→auth_user (CASCADE) | officer role |
| assignment_type | varchar(20) | region\|farms\|both |
| notes | text | |
| assigned_by_id | FK→auth_user (SET NULL) | |
| assigned_at | timestamp | |
| updated_at | timestamp | |

**M2M:** farms (through table `farms_officerassignment_farms`)
**Indexes:** (officer_id, assignment_type)

---

## 3. Crops

### `crops_crop`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(100) | **unique** |
| scientific_name | varchar(150) | |
| category | varchar(50) | |
| description | text | |
| growing_days_min | smallint | nullable |
| growing_days_max | smallint | nullable |
| growing_days_typical | smallint | nullable |
| planting_depth_cm | decimal(5,2) | nullable |
| planting_spacing_cm | decimal(6,2) | nullable |
| seeds_per_gram | decimal(8,2) | nullable |
| seeding_rate_kg_ha | decimal(6,2) | nullable |
| optimal_temp_min | decimal(4,1) | nullable (°C) |
| optimal_temp_max | decimal(4,1) | nullable (°C) |
| frost_sensitive | boolean | default true |
| drought_tolerant | boolean | default false |
| flood_tolerant | boolean | default false |
| soil_ph_min | decimal(4,1) | nullable |
| soil_ph_max | decimal(4,1) | nullable |
| sunlight_hours_min | smallint | nullable |
| rainfall_min_mm | integer | nullable |
| rainfall_optimum_mm | integer | nullable |
| rainfall_max_mm | integer | nullable |
| expected_yield_min_kg_ha | integer | nullable |
| expected_yield_max_kg_ha | integer | nullable |
| expected_yield_typical_kg_ha | integer | nullable |
| planting_season | varchar(50) | |
| harvest_season | varchar(50) | |
| suitable_months | jsonb | list of months |
| source | varchar(100) | |
| source_url | varchar(200) | |
| is_active | boolean | default true |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `crops_variety`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| crop_id | FK→crops_crop (CASCADE) | |
| name | varchar(150) | |
| breeder | varchar(100) | |
| description | text | |
| maturity_days_early | smallint | nullable |
| maturity_days_late | smallint | nullable |
| maturity_days_typical | smallint | nullable |
| yield_sd_min_kg_ha | integer | nullable |
| yield_sd_max_kg_ha | integer | nullable |
| yield_sd_typical_kg_ha | integer | nullable |
| disease_resistance | text | |
| pest_resistance | text | |
| drought_tolerance_level | varchar(20) | |
| seed_color | varchar(50) | |
| adaptation_zones | jsonb | |
| recommended_regions | jsonb | |
| is_recommended | boolean | default false |
| source | varchar(100) | |
| source_url | varchar(200) | |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (crop_id, name)
**Indexes:** (crop_id, is_recommended)

### `crops_croprequirement`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| crop_id | FK→crops_crop (CASCADE) | |
| context | varchar(50) | irrigated\|rainfed\|highland |
| soil_type | varchar(50) | |
| soil_texture | varchar(50) | |
| nitrogen_kg_ha | decimal(6,2) | nullable |
| phosphorus_kg_ha | decimal(6,2) | nullable |
| potassium_kg_ha | decimal(6,2) | nullable |
| irrigation_required | boolean | default false |
| irrigation_water_mm | integer | nullable |
| planting_months | jsonb | |
| planting_method | varchar(50) | |
| source | varchar(100) | |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (crop_id, context)

---

## 4. Crop Cycles

### `cycles_cropcycle`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| farm_id | FK→farms_farm (CASCADE) | |
| crop_id | FK→crops_crop (PROTECT) | |
| variety_id | FK→crops_variety (SET NULL) | nullable |
| planting_date | date | nullable |
| expected_harvest_date | date | nullable |
| actual_harvest_date | date | nullable |
| current_stage | varchar(20) | NOT_PLANTED\|PLANTED\|GERMINATED\|VEGETATIVE\|REPRODUCTIVE\|HARVEST_READY\|HARVESTED\|FAILED |
| stage_updated_at | timestamp | nullable |
| status | varchar(20) | PLANNED\|ACTIVE\|COMPLETED\|FAILED |
| area_ha | decimal(10,3) | nullable |
| plant_density_plants_per_ha | integer | nullable |
| seeds_used_kg | decimal(8,3) | nullable |
| seeds_used_cost | decimal(10,2) | nullable |
| fertilizer_nitrogen_kg | decimal(8,3) | default 0 |
| fertilizer_phosphorus_kg | decimal(8,3) | default 0 |
| fertilizer_potassium_kg | decimal(8,3) | default 0 |
| fertilizer_cost | decimal(10,2) | default 0 |
| irrigation_events | integer | default 0 |
| irrigation_water_total_liters | integer | default 0 |
| irrigation_cost | decimal(10,2) | default 0 |
| pesticide_applications | integer | default 0 |
| pesticide_cost | decimal(10,2) | default 0 |
| disease_incidents | integer | default 0 |
| labor_hours | decimal(8,2) | default 0 |
| labor_cost | decimal(10,2) | default 0 |
| notes | text | |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (farm_id, status), (farm_id, crop_id, planting_date), (status, current_stage), (expected_harvest_date)

### `cycles_growthstagehistory`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| cycle_id | FK→cycles_cropcycle (CASCADE) | |
| stage | varchar(20) | GrowthStage choices |
| entered_at | timestamp | |
| exited_at | timestamp | nullable (null = current) |
| recorded_by_id | FK→auth_user (SET NULL) | |
| notes | text | |

**Indexes:** (cycle_id, entered_at), (cycle_id, stage, entered_at)

---

## 5. Weather

### `weather_weathersource`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(100) | **unique** |
| provider | varchar(50) | open-meteo, nasa-power, etc. |
| api_endpoint | varchar(200) | |
| is_active | boolean | default true |
| priority | smallint | default 10 (lower = higher) |
| created_at | timestamp | |
| updated_at | timestamp | |

### `weather_weatherobservation`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| source_id | FK→weather_weathersource (PROTECT) | |
| observed_at | timestamp | |
| latitude | decimal(9,6) | |
| longitude | decimal(9,6) | |
| location | geography(Point,4326) | PostGIS (auto-populated) |
| temperature_celsius | decimal(5,2) | nullable |
| rainfall_mm | decimal(8,2) | nullable |
| humidity_percent | decimal(5,2) | nullable |
| wind_speed_ms | decimal(6,2) | nullable |
| pressure_hpa | decimal(7,2) | nullable |
| data_quality | varchar(20) | good\|fair\|poor\|no_data\|forecast |
| raw_payload | jsonb | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (source_id, observed_at, latitude, longitude)
**Indexes:** observed_at, (latitude, longitude, observed_at), (source_id, observed_at)
**GIST index:** location (spatial)

### `weather_weatherforecast`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| source_id | FK→weather_weathersource (PROTECT) | |
| forecast_at | timestamp | when issued |
| forecast_for | timestamp | when the forecast is for |
| latitude | decimal(9,6) | |
| longitude | decimal(9,6) | |
| location | geography(Point,4326) | PostGIS (auto-populated) |
| temperature_celsius | decimal(5,2) | nullable |
| rainfall_probability | decimal(5,2) | nullable |
| rainfall_mm | decimal(8,2) | nullable |
| humidity_percent | decimal(5,2) | nullable |
| wind_speed_ms | decimal(6,2) | nullable |
| weather_code | varchar(10) | |
| data_quality | varchar(20) | default 'forecast' |
| raw_payload | jsonb | nullable |
| created_at | timestamp | |

**Indexes:** forecast_for, (latitude, longitude, forecast_for)
**GIST index:** location (spatial)

### `weather_weathersyncjob`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| source_id | FK→weather_weathersource (CASCADE) | |
| started_at | timestamp | |
| completed_at | timestamp | nullable |
| status | varchar(20) | pending\|running\|completed\|failed |
| records_processed | integer | default 0 |
| records_created | integer | default 0 |
| records_updated | integer | default 0 |
| error_message | text | |

---

## 6. Intelligence

### `intelligence_intelligenceresult`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| result_type | varchar(30) | weather_suitability\|crop_suitability\|yield_estimate\|recommendation |
| farm_id | FK→farms_farm (CASCADE) | |
| crop_id | FK→crops_crop (SET NULL) | nullable |
| variety_id | FK→crops_variety (SET NULL) | nullable |
| crop_cycle_id | FK→cycles_cropcycle (SET NULL) | nullable |
| generated_by_id | FK→auth_user (SET NULL) | |
| data_classification | varchar(20) | observed\|calculated\|predicted\|recommended |
| score | decimal(6,2) | nullable (0-100) |
| value | jsonb | nullable |
| confidence | decimal(4,3) | nullable (0.000-1.000) |
| factors | jsonb | nullable |
| explanation | text | |
| model_name | varchar(50) | |
| input_data_snapshot | jsonb | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (farm_id, result_type, created_at), (crop_id, result_type, created_at), (data_classification), (confidence)

### `intelligence_predictionperformance`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| intelligence_result_id | FK→intelligence_intelligenceresult (CASCADE) | |
| actual_value | jsonb | nullable |
| absolute_error | decimal(10,4) | nullable |
| relative_error_pct | decimal(7,2) | nullable |
| recorded_at | timestamp | |
| notes | text | |

**Indexes:** (intelligence_result_id, recorded_at)

### `intelligence_recommendationrule`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(100) | **unique** |
| description | text | |
| condition_expression | text | |
| action_template | text | |
| rationale_template | text | |
| priority | smallint | default 10 |
| is_active | boolean | default true |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `intelligence_recommendationengineversion`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| version | varchar(20) | **unique** |
| description | text | |
| is_active | boolean | default false |
| created_at | timestamp | |

**M2M:** rules → intelligence_recommendationrule (through table)

### `intelligence_yieldpredictioninputs`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| intelligence_result_id | FK→intelligence_intelligenceresult (CASCADE) | |
| farm_id | FK→farms_farm (CASCADE) | |
| weather_period_start | date | nullable |
| weather_period_end | date | nullable |
| weather_source | varchar(100) | |
| weather_data_snapshot | jsonb | nullable |
| crop_name | varchar(100) | |
| variety_name | varchar(150) | |
| planting_date | date | nullable |
| area_ha | decimal(10,3) | nullable |
| plant_density | integer | nullable |
| soil_data | jsonb | nullable |
| model_name | varchar(50) | |
| model_version | varchar(20) | |
| assumptions | jsonb | default {} |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (intelligence_result_id), (farm_id, crop_name, created_at), (model_name, model_version)

---

## 7. Production

### `production_harvest`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| cycle_id | FK→cycles_cropcycle (CASCADE) | |
| harvest_date | date | |
| production_area_ha | decimal(10,3) | nullable |
| quantity_kg | decimal(12,3) | nullable |
| actual_yield_kg_ha | decimal(10,2) | nullable (auto-calculated) |
| quality_grade | varchar(20) | |
| quality_notes | text | |
| sale_price_per_kg | decimal(10,2) | nullable |
| total_revenue | decimal(12,2) | nullable |
| storage_used | varchar(50) | |
| storage_loss_pct | decimal(5,2) | nullable |
| notes | text | |
| predicted_intelligence_id | FK→intelligence_intelligenceresult (SET NULL) | nullable — links to the yield estimate this harvest validates |
| recorded_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** (cycle_id, harvest_date), (actual_yield_kg_ha)

---

## 8. Reports

### `reports_report`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| report_type | varchar(20) | weather\|farm\|crop_cycle\|yield\|recommendation\|officer\|system |
| title | varchar(255) | |
| farm_id | FK→farms_farm (SET NULL) | nullable |
| crop_cycle_id | FK→cycles_cropcycle (SET NULL) | nullable |
| parameters | jsonb | default {} |
| content | jsonb | nullable |
| output_file | varchar(500) | |
| status | varchar(20) | pending\|generating\|ready\|failed |
| generated_by_id | FK→auth_user (SET NULL) | |
| error_message | text | |
| created_at | timestamp | |
| generated_at | timestamp | nullable |
| updated_at | timestamp | |

**Indexes:** (report_type, status, created_at), (farm_id, report_type), (generated_by_id, created_at), (status, created_at)

### `reports_reporttemplate`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar(100) | **unique** |
| description | text | |
| report_type | varchar(20) | |
| parameters_schema | jsonb | |
| template_content | text | |
| is_active | boolean | default true |
| created_by_id | FK→auth_user (SET NULL) | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `reports_reportgenerationjob`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| report_id | FK→reports_report (CASCADE) | |
| task_id | varchar(100) | |
| started_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| status | varchar(20) | |
| error_message | text | |

---

## 9. Notifications

### `notifications_notification`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| recipient_id | FK→auth_user (CASCADE) | |
| notification_type | varchar(30) | weather_alert\|crop_stage_reminder\|recommendation_update\|report_ready\|system_announcement\|yield_alert\|custom |
| title | varchar(255) | |
| body | text | |
| data | jsonb | nullable |
| delivery_methods | jsonb | default [] |
| delivered_at | timestamp | nullable |
| read_at | timestamp | nullable |
| is_read | boolean | default false |
| is_deliverable | boolean | default true |
| created_at | timestamp | |

**Indexes:** (recipient_id, -created_at), (recipient_id, is_read), (notification_type, -created_at)

### `notifications_notificationpreference`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK→auth_user (CASCADE, unique) | |
| enabled_types_in_app | jsonb | default [] |
| enabled_types_native | jsonb | default [] |
| enabled_types_email | jsonb | default [] |
| enable_in_app | boolean | default true |
| enable_native | boolean | default true |
| enable_email | boolean | default false |
| enable_sms | boolean | default false |
| enable_push | boolean | default false |
| quiet_hours_start | time | nullable |
| quiet_hours_end | time | nullable |
| updated_at | timestamp | |

### `notifications_notificationdeliverylog`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| notification_id | FK→notifications_notification (CASCADE) | |
| method | varchar(20) | in_app\|native\|email\|sms\|push |
| attempted_at | timestamp | |
| succeeded | boolean | default false |
| response_info | jsonb | nullable |

---

## 10. Audit

### `audit_auditlogentry`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| actor_id | FK→auth_user (SET NULL) | nullable for system actions |
| action | varchar(20) | login\|logout\|create\|update\|delete\|login_failure\|password_change\|permission_denied\|system |
| action_object_type | varchar(50) | farm\|user\|crop_cycle\|etc. |
| action_object_id | integer | |
| description | text | |
| old_values | jsonb | nullable |
| new_values | jsonb | nullable |
| ip_address | varchar(45) | nullable |
| user_agent | text | |
| created_at | timestamp | |

**Indexes:** (action, created_at), (actor_id, created_at), (action_object_type, action_object_id)

---

## 11. Settings

### `settings_managersystemsetting`
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| key | varchar(100) | **unique** |
| name | varchar(200) | |
| description | text | |
| category | varchar(30) | yield_model\|suitability\|recommendation\|weather\|notification\|farm\|crop\|system\|user_interface |
| value_type | varchar(20) | string\|integer\|float\|boolean\|json |
| value | jsonb | |
| default_value | jsonb | nullable |
| is_public | boolean | default false |
| is_dynamic | boolean | default false |
| requires_restart | boolean | default false |
| set_by_id | FK→auth_user (SET NULL) | |
| set_at | timestamp | |
| updated_at | timestamp | |

---

## Relationships Map

```
auth_user (1) ────< farms_farm (N)           [owner → farms]
auth_user (1) ────< cycles_cropcycle (N)     [created_by → cycles]
auth_user (1) ────< intelligence_intelligenceresult (N)  [generated_by]
auth_user (1) ────< production_harvest (N)   [recorded_by]
auth_user (1) ────< notifications_notification (N)  [recipient]
auth_user (1) ────< audit_auditlogentry (N)  [actor]
auth_user (1) ────< reports_report (N)       [generated_by]
auth_user (1) ────< weather_weathersource (N) [created_by - via seed]
auth_user (1) ────< farms_farmregion (N)     [created_by]
auth_user (1) ────< farms_officerassignment (N) [officer]
auth_user (1) ────< reports_reporttemplate (N) [created_by]
auth_user (1) ────< settings_managersystemsetting (N) [set_by]

auth_user (1) ────< users_userrole (N)       [user → roles]
users_role (1) ────< users_userrole (N)      [role → users]
users_role (1) ────< users_rolepermission (N) [role → permissions]

farms_farm (1) ────< cycles_cropcycle (N)    [farm → cycles]
farms_farm (1) ────< intelligence_intelligenceresult (N)  [farm → results]
farms_farm (1) ────< reports_report (N)      [farm → reports]
farms_farm (1) ────< intelligence_yieldpredictioninputs (N) [farm → inputs]
farms_farm (N) ────< farms_officerassignment (M2M) [farms ← officers]

crops_crop (1) ────< crops_variety (N)       [crop → varieties]
crops_crop (1) ────< crops_croprequirement (N) [crop → requirements]
crops_crop (1) ────< cycles_cropcycle (N)    [crop → cycles]
crops_crop (1) ────< intelligence_intelligenceresult (N)  [crop → results]

crops_variety (1) ────< cycles_cropcycle (N) [variety → cycles]
crops_variety (1) ────< intelligence_intelligenceresult (N) [variety → results]

cycles_cropcycle (1) ────< production_harvest (N)  [cycle → harvests]
cycles_cropcycle (1) ────< intelligence_intelligenceresult (N) [cycle → results]
cycles_cropcycle (1) ────< reports_report (N)      [cycle → reports]
cycles_cropcycle (1) ────< cycles_growthstagehistory (N) [cycle → stage history]

weather_weathersource (1) ────< weather_weatherobservation (N) [source → observations]
weather_weathersource (1) ────< weather_weatherforecast (N)   [source → forecasts]
weather_weathersource (1) ────< weather_weathersyncjob (N)   [source → sync jobs]

intelligence_intelligenceresult (1) ────< intelligence_predictionperformance (N) [result → performance]
intelligence_intelligenceresult (1) ────< intelligence_yieldpredictioninputs (N) [result → inputs]
intelligence_intelligenceresult (1) ────< production_harvest (N) [result → validated_by_harvests]

reports_report (1) ────< reports_reportgenerationjob (N) [report → jobs]
```

---

## Key Constraints Summary

| Table | Constraint | Type |
|---|---|---|
| crops_crop | name unique | unique |
| crops_variety | (crop_id, name) unique | composite unique |
| weather_weathersource | name unique | unique |
| weather_weatherobservation | (source_id, observed_at, latitude, longitude) unique | composite unique |
| users_role | name unique, slug unique | two unique |
| users_userrole | (user_id, role_id) unique | composite unique |
| users_rolepermission | (role_id, permission_code) unique | composite unique |
| settings_managersystemsetting | key unique | unique |
| reports_reporttemplate | name unique | unique |
| intelligence_recommendationrule | name unique | unique |
| intelligence_recommendationengineversion | version unique | unique |
| notifications_notificationpreference | user_id unique (O2O) | unique |
| farms_farm | owner_id CASCADE | FK delete |
| crops_crop | PROTECT (via cycles) | FK delete |
| intelligence_intelligenceresult | SET NULL (crop, variety, cycle, generated_by) | FK delete |
| production_harvest | SET NULL (predicted_intelligence) | FK delete |

---

## PostGIS Spatial Indexes

| Table | Column | Index Type | Purpose |
|---|---|---|---|
| farms_farm | location | GIST | bbox / radius queries on farms |
| farms_farmregion | boundary | GIST | polygon containment queries |
| farms_farmregion | centroid | GIST | centroid-based lookups |
| weather_weatherobservation | location | GIST | spatial lookup of observations |
| weather_weatherforecast | location | GIST | spatial lookup of forecasts |

---

## Extensibility Notes

1. **New crops/varieties** — No schema change needed; just insert rows.
2. **New weather sources** — Insert into `weather_weathersource`; no code change.
3. **New intelligence model versions** — Insert into `intelligence_recommendationengineversion` + `intelligence_yieldpredictioninputs`; old results preserved.
4. **New notification types** — Add to `NotificationType` enum in code; backward-compatible (unknown types ignored by old code until upgraded).
5. **New report types** — Add to `ReportType` enum in code; `reports_report.parameters` and `.content` are JSONB so any structure works.
6. **New roles** — Insert into `users_role` + `users_rolepermission`; no migration needed.
7. **New regions** — Insert into `farms_farmregion`; spatial queries scale with GIST indexes.
8. **Future ML models** — `intelligence_yieldpredictioninputs.model_name` + `model_version` + `intelligence_intelligenceresult.model_name` identify the model; `YieldPredictionInputs` stores the full input snapshot for reproducibility.

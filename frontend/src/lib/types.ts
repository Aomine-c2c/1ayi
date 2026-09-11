// Domain Models for Agricultural Intelligence and Crop Productivity Management Platform (AYIS)

export type Role = 'admin' | 'farm_manager' | 'agronomist' | 'extension_officer' | 'field_officer' | 'farmer' | 'weather_analyst' | 'data_analyst' | 'viewer'
export type UserRole = Role

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: Role
  is_active: boolean
  is_staff: boolean
  phone_number?: string
  organization?: string
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user?: User
}

export interface Farm {
  id: number
  owner: number | null
  owner_username: string | null
  name: string
  location_name?: string
  longitude: number | null
  latitude: number | null
  area_ha: number | null
  soil_type?: string
  climate_zone?: string
  notes: string
  data_classification?: 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC'
  created_at: string
  updated_at: string
}

export interface Field {
  id: number
  farm_id: number
  name: string
  boundary_geojson?: any
  area_ha: number
  soil_ph?: number
  soil_organic_matter?: number
  irrigation_type: 'rainfed' | 'drip' | 'sprinkler' | 'canal' | 'none'
  status: 'active' | 'fallow' | 'preparing'
  created_at: string
}

export interface CropStage {
  name: string
  duration_days: number
  gdd_required?: number
  water_requirement_mm?: number
}

export interface Crop {
  id: number
  name: string
  scientific_name?: string
  variety?: string
  category: string
  description: string
  growing_days_min?: number
  growing_days_max?: number
  growing_days_typical?: number
  optimal_temp_min?: number
  optimal_temp_max?: number
  optimal_temperature_min?: number
  optimal_temperature_max?: number
  optimal_rainfall_min?: number
  optimal_rainfall_max?: number
  growing_period_days_min?: number
  growing_period_days_max?: number
  min_water_requirement_mm?: number
  rainfall_min_mm?: number
  rainfall_optimum_mm?: number
  expected_yield_min?: number
  expected_yield_max?: number
  expected_yield_typical_kg_ha?: number
  yield_unit?: string
  planting_season?: string
  harvest_season?: string
  stages?: CropStage[]
  is_active?: boolean
}

export interface CropProfile {
  crop_id: number
  water_requirement_mm: number
  critical_growth_stages: string[]
  common_pests: string[]
  common_diseases: string[]
  market_demand_rating: 'high' | 'medium' | 'low'
  nutrient_requirements: {
    nitrogen_kg_ha: number
    phosphorus_kg_ha: number
    potassium_kg_ha: number
  }
}

export interface CropCycle {
  id: number
  farm: number
  farm_name: string
  field_id?: number
  field_name?: string
  crop: number
  crop_name: string
  variety?: number | null
  variety_name?: string | null
  planting_date?: string | null
  expected_harvest_date?: string | null
  actual_harvest_date?: string | null
  current_stage: 'planning' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'harvested'
  status: 'active' | 'completed' | 'terminated'
  area_ha?: number | null
  target_yield_kg_ha?: number
  actual_yield_kg_ha?: number
  notes: string
  created_at?: string
  updated_at?: string
}

export interface WeatherRecord {
  id: number
  farm_id?: number
  station_id?: string
  station_name?: string
  observed_at: string
  temperature_celsius: number
  relative_humidity_percent: number
  rainfall_mm: number
  wind_speed_ms: number
  wind_direction_deg: number
  pressure_hpa?: number
  solar_radiation_mj_m2?: number
  dew_point_c?: number
  soil_temperature_c?: number
  soil_moisture_pct?: number
  data_quality: 'verified' | 'unverified' | 'interpolated' | 'flagged'
  latitude: number
  longitude: number
  source_type?: 'telemetry_station' | 'satellite_reanalysis' | 'manual_gauge' | 'interpolated_mesh'
}

export interface WeatherStation {
  id: string
  name: string
  location_name: string
  county: string
  latitude: number
  longitude: number
  elevation_m: number
  hardware_model: string
  operational_status: 'online' | 'delayed' | 'offline' | 'degraded'
  last_transmission: string
  battery_pct: number
  solar_voltage_v: number
  signal_strength_dbm: number
  completeness_24h_pct: number
  assigned_farms: string[]
}

export interface DataQualityMetric {
  station_id: string
  station_name: string
  last_successful_update: string
  expected_transmissions_24h: number
  actual_transmissions_24h: number
  missing_data_points: number
  delayed_data_points: number
  invalid_readings_count: number
  completeness_pct: number
  quality_score: number // 0 - 100
  operational_status: 'healthy' | 'warning' | 'critical' | 'offline'
  data_source_status: 'active_telemetered' | 'reanalysis_fallback' | 'downlink_failed'
  flagged_sensors: string[]
  anomalies_detected: {
    variable: string
    timestamp: string
    reported_value: string
    expected_range: string
    severity: 'mild' | 'severe' | 'critical'
  }[]
}

export interface WeatherTrendPoint {
  period: string
  avg_temp_c: number
  min_temp_c: number
  max_temp_c: number
  cumulative_rainfall_mm: number
  normal_rainfall_mm: number
  rainfall_anomaly_mm: number
  gdd_c: number
  et0_mm: number
  humidity_pct: number
  historical_benchmark_temp_c: number
}

export interface WeatherForecastDay {
  date: string
  temp_min_c: number
  temp_max_c: number
  rainfall_probability_pct: number
  expected_rainfall_mm: number
  weather_condition: string
  weather_code: number
  evapotranspiration_mm?: number
}

export interface WeatherForecast {
  farm_id: number
  generated_at: string
  days: WeatherForecastDay[]
}

export interface WeatherSuitability {
  farm_id: number
  crop_id: number
  suitability_score: number // 0 - 100
  rating: 'optimal' | 'moderate' | 'marginal' | 'unsuitable'
  limiting_factors: string[]
  temperature_suitability_score: number
  rainfall_suitability_score: number
  seasonal_outlook: string
}

export interface YieldEstimate {
  id: number
  crop_cycle_id: number
  crop_name: string
  farm_name: string
  predicted_yield_kg_ha: number
  lower_bound_kg_ha: number
  upper_bound_kg_ha: number
  confidence_level: number // 0 - 1
  prediction_model: string
  factors_analyzed: {
    weather_impact_pct: number
    soil_impact_pct: number
    management_impact_pct: number
  }
  generated_at: string
}

export interface Recommendation {
  id: number
  farm_id: number
  farm_name: string
  field_id?: number
  crop_cycle_id?: number
  category: 'irrigation' | 'fertilizer' | 'pest_control' | 'planting' | 'harvesting' | 'general'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  action_title: string
  action_details: string
  rationale: string
  confidence_score: number
  evidence: string[]
  suggested_deadline?: string
  status: 'pending' | 'applied' | 'dismissed'
  created_at: string
}

export interface WeatherAlert {
  id: number
  farm_id?: number
  station_id?: string
  location?: string
  alert_type: 'drought' | 'frost' | 'heavy_rain' | 'high_winds' | 'heatwave' | 'hail' | 'anomalous_pressure'
  severity: 'extreme' | 'severe' | 'moderate' | 'minor' | 'critical' | 'high' | 'medium' | 'low' | 'informational'
  headline: string
  description: string
  trigger_condition?: string
  status?: 'active' | 'monitoring' | 'resolved'
  affected_farms?: string[]
  affected_crops?: string[]
  effective_from: string
  effective_to: string
  recommended_actions: string[]
}

export interface FieldObservation {
  id: number
  farm_id: number
  farm_name?: string
  field_id?: number
  field_name?: string
  crop_name?: string
  growth_stage?: string
  observed_by: string
  observed_at: string
  observation_type: 'pest' | 'disease' | 'weed' | 'water_stress' | 'nutrient_deficiency' | 'growth_milestone'
  severity?: 'mild' | 'moderate' | 'severe' | 'critical'
  follow_up_status?: 'pending' | 'resolved' | 'monitoring'
  follow_up_required?: boolean
  condition?: string
  weather_conditions?: string
  notes: string
  image_urls?: string[]
  coordinates?: { latitude: number; longitude: number }
}

export interface FieldVisit {
  id: number
  farmer_id: number
  farmer_name: string
  farm_id: number
  farm_name: string
  field_id?: number
  field_name?: string
  officer_id: number
  officer_name: string
  visit_date: string
  purpose: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  findings_summary?: string
}

export interface FollowUpTask {
  id: number
  farmer_id: number
  farmer_name: string
  farm_id: number
  farm_name: string
  title: string
  task_type: 'inspection' | 'assistance_request' | 'risk_mitigation' | 'scouting'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
  description: string
  associated_observation_id?: number
}

export interface Inspection {
  id: number
  farm_id: number
  officer_id: number
  officer_name: string
  inspection_date: string
  compliance_rating: 'compliant' | 'minor_issues' | 'action_required'
  summary: string
  checklist: {
    item: string
    passed: boolean
    comments?: string
  }[]
  follow_up_date?: string
}

export interface Report {
  id: number
  title: string
  report_type: 'yield_summary' | 'weather_impact' | 'crop_suitability' | 'farm_audit' | 'seasonal_review'
  format: 'PDF' | 'CSV' | 'Excel'
  parameters: Record<string, any>
  file_url?: string
  generated_by: string
  generated_at: string
  status: 'ready' | 'processing' | 'failed'
}

export interface Notification {
  id: string
  recipient_id: number
  title: string
  message: string
  type: 'alert' | 'recommendation' | 'inspection' | 'system'
  priority: 'high' | 'normal' | 'low'
  read: boolean
  link?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: number
  username: string
  user_name?: string
  user_role: string
  action: string
  resource: string
  resource_id?: string
  timestamp: string
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'BLOCKED'
  ip_address: string
  details: Record<string, any> | string
}

export interface SystemServiceHealth {
  id?: string
  name: string
  service_name?: string
  category: 'core' | 'weather' | 'database' | 'auth' | 'ai_engine'
  status: 'operational' | 'degraded' | 'offline'
  uptime_pct: number
  latency_ms: number
  last_check: string
  version: string
  error_count_24h: number
  warning_count_24h: number
  notes?: string
}

export interface WeatherSourceConfig {
  id: string
  name: string
  provider: 'open_meteo' | 'copernicus_era5' | 'telemetry_mesh' | 'noaa_gfs'
  status: 'active' | 'standby' | 'rate_limited' | 'disabled'
  update_frequency_minutes: number
  last_sync_timestamp: string
  api_endpoint: string
  monitored_locations_count: number
  thresholds: {
    frost_temp_c: number
    extreme_heat_temp_c: number
    heavy_rain_mm_hr: number
    high_wind_ms: number
    dry_spell_consecutive_days: number
  }
}

export interface SystemSettings {
  organization_name: string
  platform_mode: 'production' | 'staging' | 'demo'
  default_language: string
  time_zone: string
  unit_temperature: 'celsius' | 'fahrenheit'
  unit_rainfall: 'mm' | 'inches'
  unit_area: 'hectares' | 'acres'
  unit_yield: 'kg_ha' | 'tonnes_ha' | 'bags_acre'
  email_notifications_enabled: boolean
  sms_alerts_enabled: boolean
  auto_recommendation_interval_hours: number
  telemetry_sync_rate_seconds: number
  max_login_attempts: number
  session_timeout_minutes: number
}

// Backward compatibility aliases
export type WeatherObservation = WeatherRecord
export interface IntelligenceResult {
  id: number
  result_type: string
  farm_id: number
  data_classification: string
  score?: number
  value?: Record<string, any>
  confidence?: number
  factors?: Record<string, any>
  explanation: string
  model_name?: string
  created_at: string
}

export interface ApiResponse {
  status: string
  service: string
  version: string
}

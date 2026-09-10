export interface ApiResponse {
  status: string
  service: string
  version: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  is_staff: boolean
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
  longitude: number | null
  latitude: number | null
  area_ha: number | null
  notes: string
  created_at: string
  updated_at: string
  data_classification?: string
}

export interface Crop {
  id: number
  name: string
  scientific_name: string
  category: string
  description: string
  growing_days_min?: number
  growing_days_max?: number
  growing_days_typical?: number
  optimal_temp_min?: number
  optimal_temp_max?: number
  rainfall_min_mm?: number
  rainfall_optimum_mm?: number
  expected_yield_typical_kg_ha?: number
  planting_season?: string
  harvest_season?: string
  is_active: boolean
}

export interface CropCycle {
  id: number
  farm: number
  farm_name: string
  crop: number
  crop_name: string
  variety?: number | null
  variety_name?: string | null
  planting_date?: string | null
  expected_harvest_date?: string | null
  actual_harvest_date?: string | null
  current_stage: string
  status: string
  area_ha?: number | null
  notes: string
}

export interface WeatherObservation {
  id: number
  observed_at: string
  temperature_celsius?: number
  rainfall_mm?: number
  humidity_percent?: number
  wind_speed_ms?: number
  data_quality: string
  latitude: number
  longitude: number
}

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

export interface SuitabilityResult {
  score: number
  max_score: number
  percentage: number
  factors: Record<string, any>
  explanation: string
  data_classification: string
}

export interface YieldEstimateResult {
  estimated_yield: string
  unit: string
  confidence: number
  model_name: string
  inputs: Record<string, any>
  explanation: string
  data_classification: string
}

export interface RecommendationResult {
  action: string
  rationale: string
  confidence: number
  evidence: string[]
  alternatives: string[]
  data_classification: string
}

export interface WeatherReport {
  report_type: string
  farm_name: string
  period: { start: string; end: string }
  observations: WeatherObservation[]
  summary: Record<string, any>
  generated_at: string
}

export interface ApiError {
  error: string
  message?: string
  details?: Record<string, any>
}

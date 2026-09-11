import {
  User,
  Farm,
  Field,
  Crop,
  CropProfile,
  CropCycle,
  WeatherRecord,
  WeatherForecast,
  WeatherSuitability,
  YieldEstimate,
  Recommendation,
  WeatherAlert,
  FieldObservation,
  Report,
  Notification,
  FieldVisit,
  FollowUpTask,
  WeatherStation,
  DataQualityMetric,
  WeatherTrendPoint,
  AuditLog,
  SystemServiceHealth,
  WeatherSourceConfig,
  SystemSettings,
} from '@/lib/types'
import {
  MOCK_USERS,
  MOCK_FARMS,
  MOCK_FIELDS,
  MOCK_CROPS,
  MOCK_CROP_PROFILES,
  MOCK_CYCLES,
  MOCK_WEATHER_RECORDS,
  MOCK_WEATHER_STATIONS,
  MOCK_DATA_QUALITY_METRICS,
  MOCK_WEATHER_TRENDS,
  MOCK_FORECASTS,
  MOCK_WEATHER_ALERTS,
  MOCK_RECOMMENDATIONS,
  MOCK_YIELD_ESTIMATES,
  MOCK_SUITABILITY,
  MOCK_OBSERVATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_FIELD_VISITS,
  MOCK_FOLLOW_UPS,
  MOCK_AUDIT_LOGS,
  MOCK_SYSTEM_HEALTH,
  MOCK_WEATHER_SOURCES,
  MOCK_SYSTEM_SETTINGS,
} from '@/lib/mock-data'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'

async function tryFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    let token: string | null = null
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('ayis_token')
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      if (res.status === 204) return {} as T
      return await res.json()
    }
    return null
  } catch {
    return null
  }
}

// 1. Auth Service
export const authService = {
  async getProfile(): Promise<User> {
    const live = await tryFetch<User>('/users/me/')
    return live || MOCK_USERS[0]
  },
  async listUsers(): Promise<User[]> {
    const live = await tryFetch<User[]>('/users/')
    return live || MOCK_USERS
  },
  async getUser(id: number): Promise<User | undefined> {
    const live = await tryFetch<User>(`/users/${id}/`)
    if (live) return live
    return MOCK_USERS.find(u => u.id === id)
  },
  async createUser(userData: Partial<User>): Promise<User> {
    const live = await tryFetch<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    if (live) return live
    const created: User = {
      id: Date.now(),
      username: userData.username || `user_${Date.now()}`,
      email: userData.email || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      role: userData.role || 'viewer',
      is_active: userData.is_active ?? true,
      is_staff: userData.role === 'admin',
      phone_number: userData.phone_number || '',
      organization: userData.organization || 'General Agriculture',
      date_joined: new Date().toISOString(),
    }
    MOCK_USERS.unshift(created)
    return created
  },
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    await tryFetch(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const user = MOCK_USERS.find(u => u.id === id)
    if (user) {
      Object.assign(user, data)
    }
    return user
  },
  async toggleUserActive(id: number): Promise<boolean> {
    const user = MOCK_USERS.find(u => u.id === id)
    if (user) {
      user.is_active = !user.is_active
      await tryFetch(`/users/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: user.is_active }),
      })
      return user.is_active
    }
    return false
  },
}

// 2. Farm Service
export const farmService = {
  async listFarms(): Promise<Farm[]> {
    const live = await tryFetch<Farm[]>('/farms/')
    return live && live.length > 0 ? live : MOCK_FARMS
  },
  async getFarm(id: number): Promise<Farm | undefined> {
    const live = await tryFetch<Farm>(`/farms/${id}/`)
    if (live) return live
    return MOCK_FARMS.find(f => f.id === id)
  },
  async createFarm(farm: Partial<Farm>): Promise<Farm> {
    const live = await tryFetch<Farm>('/farms/', {
      method: 'POST',
      body: JSON.stringify(farm),
    })
    if (live) return live
    const created: Farm = {
      id: Date.now(),
      owner: 1,
      owner_username: 'current_user',
      name: farm.name || 'New Farm',
      area_ha: farm.area_ha || 10,
      latitude: farm.latitude || -0.303,
      longitude: farm.longitude || 36.08,
      notes: farm.notes || '',
      soil_type: farm.soil_type || 'Loam',
      climate_zone: farm.climate_zone || 'Highland',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_FARMS.push(created)
    return created
  },
}

// 3. Field Service
export const fieldService = {
  async listFieldsByFarm(farmId?: number): Promise<Field[]> {
    const live = await tryFetch<Field[]>(farmId ? `/fields/?farm=${farmId}` : '/fields/')
    if (live && live.length > 0) return live
    if (farmId) return MOCK_FIELDS.filter(f => f.farm_id === farmId)
    return MOCK_FIELDS
  },
  async listObservations(farmId?: number): Promise<FieldObservation[]> {
    const live = await tryFetch<FieldObservation[]>(farmId ? `/observations/?farm=${farmId}` : '/observations/')
    if (live && live.length > 0) return live
    if (farmId) return MOCK_OBSERVATIONS.filter(o => o.farm_id === farmId)
    return MOCK_OBSERVATIONS
  },
  async createObservation(obs: Partial<FieldObservation>): Promise<FieldObservation> {
    const live = await tryFetch<FieldObservation>('/observations/', {
      method: 'POST',
      body: JSON.stringify(obs),
    })
    if (live) return live
    const created: FieldObservation = {
      id: Date.now(),
      farm_id: obs.farm_id || 1,
      farm_name: obs.farm_name || 'Green Ridge Highland Estate',
      field_name: obs.field_name || 'North Terrace Block A',
      crop_name: obs.crop_name || 'White Maize (H6213)',
      growth_stage: obs.growth_stage || 'Vegetative',
      observed_by: obs.observed_by || 'Brian Omondi (Extension Officer)',
      observed_at: new Date().toISOString(),
      observation_type: obs.observation_type || 'pest',
      severity: obs.severity || 'mild',
      follow_up_status: obs.follow_up_status || 'pending',
      follow_up_required: obs.follow_up_required ?? true,
      condition: obs.condition || 'Vigorous Stand',
      weather_conditions: obs.weather_conditions || 'Sunny, 21°C, low humidity',
      notes: obs.notes || '',
    }
    MOCK_OBSERVATIONS.unshift(created)
    return created
  },
}

// 3b. Extension Service (Field Visits & Farmer Tasks)
export const extensionService = {
  async listVisits(officerId?: number): Promise<FieldVisit[]> {
    const live = await tryFetch<FieldVisit[]>(officerId ? `/extension/visits/?officer=${officerId}` : '/extension/visits/')
    if (live && live.length > 0) return live
    if (officerId) return MOCK_FIELD_VISITS.filter(v => v.officer_id === officerId)
    return MOCK_FIELD_VISITS
  },
  async createVisit(visit: Partial<FieldVisit>): Promise<FieldVisit> {
    const live = await tryFetch<FieldVisit>('/extension/visits/', {
      method: 'POST',
      body: JSON.stringify(visit),
    })
    if (live) return live
    const created: FieldVisit = {
      id: Date.now(),
      farmer_id: visit.farmer_id || 3,
      farmer_name: visit.farmer_name || 'Peter Otieno',
      farm_id: visit.farm_id || 1,
      farm_name: visit.farm_name || 'Green Ridge Highland Estate',
      field_id: visit.field_id,
      field_name: visit.field_name || 'Main Block',
      officer_id: visit.officer_id || 6,
      officer_name: 'Brian Omondi',
      visit_date: visit.visit_date || new Date().toISOString(),
      purpose: visit.purpose || 'Routine farm advisory & crop assessment',
      status: visit.status || 'scheduled',
      notes: visit.notes || '',
    }
    MOCK_FIELD_VISITS.unshift(created)
    return created
  },
  async updateVisitStatus(id: number, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'): Promise<boolean> {
    await tryFetch(`/extension/visits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const found = MOCK_FIELD_VISITS.find(v => v.id === id)
    if (found) found.status = status
    return true
  },
  async listFollowUps(farmerId?: number): Promise<FollowUpTask[]> {
    const live = await tryFetch<FollowUpTask[]>(farmerId ? `/extension/follow-ups/?farmer=${farmerId}` : '/extension/follow-ups/')
    if (live && live.length > 0) return live
    if (farmerId) return MOCK_FOLLOW_UPS.filter(f => f.farmer_id === farmerId)
    return MOCK_FOLLOW_UPS
  },
  async createFollowUp(task: Partial<FollowUpTask>): Promise<FollowUpTask> {
    const live = await tryFetch<FollowUpTask>('/extension/follow-ups/', {
      method: 'POST',
      body: JSON.stringify(task),
    })
    if (live) return live
    const created: FollowUpTask = {
      id: Date.now(),
      farmer_id: task.farmer_id || 3,
      farmer_name: task.farmer_name || 'Peter Otieno',
      farm_id: task.farm_id || 1,
      farm_name: task.farm_name || 'Green Ridge Highland Estate',
      title: task.title || 'Technical Follow-up Task',
      task_type: task.task_type || 'scouting',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      description: task.description || '',
    }
    MOCK_FOLLOW_UPS.unshift(created)
    return created
  },
  async updateFollowUpStatus(id: number, status: 'pending' | 'in_progress' | 'completed'): Promise<boolean> {
    await tryFetch(`/extension/follow-ups/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const found = MOCK_FOLLOW_UPS.find(f => f.id === id)
    if (found) found.status = status
    return true
  },
}

// 4. Crop Service
export const cropService = {
  async listCrops(): Promise<Crop[]> {
    const live = await tryFetch<Crop[]>('/crops/')
    return live && live.length > 0 ? live : MOCK_CROPS
  },
  async getCropProfile(cropId: number): Promise<CropProfile | undefined> {
    const live = await tryFetch<CropProfile>(`/crops/${cropId}/profile/`)
    if (live) return live
    return MOCK_CROP_PROFILES[cropId] || MOCK_CROP_PROFILES[1]
  },
  async listCycles(farmId?: number): Promise<CropCycle[]> {
    const live = await tryFetch<CropCycle[]>(farmId ? `/crops/cycles/?farm=${farmId}` : '/crops/cycles/')
    if (live && live.length > 0) return live
    if (farmId) return MOCK_CYCLES.filter(c => c.farm === farmId)
    return MOCK_CYCLES
  },
  async createCrop(data: Partial<Crop>): Promise<Crop> {
    const live = await tryFetch<Crop>('/crops/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (live) return live
    const newCrop: Crop = {
      id: Date.now(),
      name: data.name || 'New Crop Variety',
      variety: data.variety || 'Standard Local',
      category: data.category || 'Cereals & Grains',
      description: data.description || '',
      optimal_temperature_min: data.optimal_temperature_min ?? 18,
      optimal_temperature_max: data.optimal_temperature_max ?? 28,
      optimal_rainfall_min: data.optimal_rainfall_min ?? 600,
      optimal_rainfall_max: data.optimal_rainfall_max ?? 1200,
      growing_period_days_min: data.growing_period_days_min ?? 90,
      growing_period_days_max: data.growing_period_days_max ?? 150,
      min_water_requirement_mm: data.min_water_requirement_mm ?? 500,
      expected_yield_min: data.expected_yield_min ?? 3.5,
      expected_yield_max: data.expected_yield_max ?? 6.0,
      yield_unit: data.yield_unit || 'tonnes/ha',
      stages: data.stages || [
        { name: 'Emergence', duration_days: 10, gdd_required: 120, water_requirement_mm: 35 },
        { name: 'Vegetative', duration_days: 35, gdd_required: 450, water_requirement_mm: 180 },
        { name: 'Flowering', duration_days: 25, gdd_required: 380, water_requirement_mm: 220 },
        { name: 'Grain Filling', duration_days: 30, gdd_required: 420, water_requirement_mm: 190 },
        { name: 'Maturity', duration_days: 15, gdd_required: 190, water_requirement_mm: 45 },
      ],
    }
    MOCK_CROPS.unshift(newCrop)
    return newCrop
  },
  async updateCrop(id: number, data: Partial<Crop>): Promise<Crop | undefined> {
    await tryFetch(`/crops/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const crop = MOCK_CROPS.find(c => c.id === id)
    if (crop) {
      Object.assign(crop, data)
    }
    return crop
  },
  async deleteCrop(id: number): Promise<boolean> {
    await tryFetch(`/crops/${id}/`, {
      method: 'DELETE',
    })
    const idx = MOCK_CROPS.findIndex(c => c.id === id)
    if (idx !== -1) {
      MOCK_CROPS.splice(idx, 1)
      return true
    }
    return false
  },
}

// 5. Weather Service
export const weatherService = {
  async getCurrentObservations(farmId?: number): Promise<WeatherRecord[]> {
    const live = await tryFetch<WeatherRecord[]>(farmId ? `/weather/?farm=${farmId}` : '/weather/')
    return live && live.length > 0 ? live : MOCK_WEATHER_RECORDS
  },
  async getForecast(farmId: number = 1): Promise<WeatherForecast> {
    const live = await tryFetch<WeatherForecast>(`/weather/forecast/?farm=${farmId}`)
    return live || MOCK_FORECASTS
  },
  async getAlerts(farmId?: number): Promise<WeatherAlert[]> {
    const live = await tryFetch<WeatherAlert[]>(farmId ? `/weather/alerts/?farm=${farmId}` : '/weather/alerts/')
    return live && live.length > 0 ? live : MOCK_WEATHER_ALERTS
  },
  async listStations(): Promise<WeatherStation[]> {
    const live = await tryFetch<WeatherStation[]>('/weather/stations/')
    return live && live.length > 0 ? live : MOCK_WEATHER_STATIONS
  },
  async getStation(stationId: string): Promise<WeatherStation | undefined> {
    const live = await tryFetch<WeatherStation>(`/weather/stations/${stationId}/`)
    if (live) return live
    return MOCK_WEATHER_STATIONS.find(s => s.id === stationId)
  },
  async getDataQualityMetrics(): Promise<DataQualityMetric[]> {
    const live = await tryFetch<DataQualityMetric[]>('/weather/data-quality/')
    return live && live.length > 0 ? live : MOCK_DATA_QUALITY_METRICS
  },
  async getWeatherTrends(): Promise<WeatherTrendPoint[]> {
    const live = await tryFetch<WeatherTrendPoint[]>('/weather/trends/')
    return live && live.length > 0 ? live : MOCK_WEATHER_TRENDS
  },
  async listHistoricalObservations(params?: {
    station_id?: string
    start_date?: string
    end_date?: string
    aggregation?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  }): Promise<WeatherRecord[]> {
    const query = new URLSearchParams()
    if (params?.station_id) query.set('station_id', params.station_id)
    if (params?.start_date) query.set('start_date', params.start_date)
    if (params?.end_date) query.set('end_date', params.end_date)
    if (params?.aggregation) query.set('aggregation', params.aggregation)
    
    const live = await tryFetch<WeatherRecord[]>(`/weather/historical/?${query.toString()}`)
    if (live && live.length > 0) return live

    // Generate dynamic multi-day historical timeseries for requested station or default
    const baseRecords: WeatherRecord[] = []
    const count = params?.aggregation === 'monthly' ? 12 : params?.aggregation === 'weekly' ? 12 : 30
    const stationId = params?.station_id || 'WS-NAK-01'
    const station = MOCK_WEATHER_STATIONS.find(s => s.id === stationId) || MOCK_WEATHER_STATIONS[0]

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(2026, 8, 11) // Sept 11, 2026
      if (params?.aggregation === 'monthly') {
        d.setMonth(d.getMonth() - i)
      } else if (params?.aggregation === 'weekly') {
        d.setDate(d.getDate() - i * 7)
      } else {
        d.setDate(d.getDate() - i)
      }

      // Realistic meteorological cyclical variation
      const dayCycle = (i % 7) / 7
      const tempVariation = Math.sin(i * 0.8) * 3.5
      const rainBase = (i % 5 === 0) ? 14.2 : (i % 3 === 0) ? 6.4 : (i % 2 === 0) ? 1.2 : 0.0
      
      baseRecords.push({
        id: 1000 + i,
        farm_id: station.assigned_farms.length > 0 ? 1 : undefined,
        station_id: station.id,
        station_name: station.name,
        observed_at: d.toISOString(),
        temperature_celsius: parseFloat((20.5 + tempVariation).toFixed(1)),
        relative_humidity_percent: Math.min(95, Math.max(45, Math.round(72 - tempVariation * 2.5))),
        rainfall_mm: parseFloat((rainBase + (Math.sin(i) > 0.5 ? 4.5 : 0)).toFixed(1)),
        wind_speed_ms: parseFloat((3.2 + Math.cos(i) * 1.4).toFixed(1)),
        wind_direction_deg: (120 + i * 15) % 360,
        pressure_hpa: parseFloat((1013.5 + Math.sin(i * 0.5) * 4.2).toFixed(1)),
        solar_radiation_mj_m2: parseFloat((21.5 - tempVariation * 0.8).toFixed(1)),
        dew_point_c: parseFloat((14.0 + tempVariation * 0.4).toFixed(1)),
        soil_temperature_c: parseFloat((18.5 + tempVariation * 0.6).toFixed(1)),
        soil_moisture_pct: parseFloat((36.0 + rainBase * 0.8).toFixed(1)),
        data_quality: i === 14 ? 'interpolated' : 'verified',
        latitude: station.latitude,
        longitude: station.longitude,
        source_type: 'telemetry_station',
      })
    }

    return baseRecords
  },
  async updateAlertStatus(alertId: number, status: 'active' | 'monitoring' | 'resolved'): Promise<boolean> {
    await tryFetch(`/weather/alerts/${alertId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const found = MOCK_WEATHER_ALERTS.find(a => a.id === alertId)
    if (found) found.status = status
    return true
  },
}

// 6. Recommendation Service
export const recommendationService = {
  async listRecommendations(farmId?: number): Promise<Recommendation[]> {
    const live = await tryFetch<Recommendation[]>(farmId ? `/intelligence/recommendations/?farm=${farmId}` : '/intelligence/recommendations/')
    if (live && live.length > 0) return live
    if (farmId) return MOCK_RECOMMENDATIONS.filter(r => r.farm_id === farmId)
    return MOCK_RECOMMENDATIONS
  },
  async updateStatus(id: number, status: 'applied' | 'dismissed'): Promise<boolean> {
    await tryFetch(`/intelligence/recommendations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const rec = MOCK_RECOMMENDATIONS.find(r => r.id === id)
    if (rec) rec.status = status
    return true
  },
}

// 7. Yield Service
export const yieldService = {
  async listYieldEstimates(cycleId?: number): Promise<YieldEstimate[]> {
    const live = await tryFetch<YieldEstimate[]>(cycleId ? `/intelligence/yield-estimate/?cycle=${cycleId}` : '/intelligence/yield-estimate/')
    if (live && live.length > 0) return live
    if (cycleId) return MOCK_YIELD_ESTIMATES.filter(y => y.crop_cycle_id === cycleId)
    return MOCK_YIELD_ESTIMATES
  },
  async getSuitability(farmId: number, cropId: number): Promise<WeatherSuitability | undefined> {
    const live = await tryFetch<WeatherSuitability>(`/intelligence/suitability/?farm=${farmId}&crop=${cropId}`)
    if (live) return live
    return MOCK_SUITABILITY.find(s => s.farm_id === farmId && s.crop_id === cropId) || MOCK_SUITABILITY[0]
  },
}

// 8. Report Service
export const reportService = {
  async listReports(): Promise<Report[]> {
    const live = await tryFetch<Report[]>('/reports/')
    return live || [
      {
        id: 101,
        title: 'Q3 Highland Yield Benchmark Report',
        report_type: 'yield_summary',
        format: 'PDF',
        parameters: { season: '2025-Q3', region: 'Rift Valley' },
        generated_by: 'Joseph Kariuki',
        generated_at: '2025-09-01T10:00:00Z',
        status: 'ready',
      },
      {
        id: 102,
        title: 'Micro-climate Agro-Meteorological Assessment',
        report_type: 'weather_impact',
        format: 'CSV',
        parameters: { farm_id: 1, timeframe: '90d' },
        generated_by: 'Sarah Mwangi',
        generated_at: '2025-09-08T14:20:00Z',
        status: 'ready',
      },
    ]
  },
}

// 9. Notification Service
export const notificationService = {
  async listNotifications(): Promise<Notification[]> {
    const live = await tryFetch<Notification[]>('/notifications/')
    return live && live.length > 0 ? live : MOCK_NOTIFICATIONS
  },
  async markAsRead(id: string): Promise<void> {
    await tryFetch(`/notifications/${id}/read/`, { method: 'POST' })
    const item = MOCK_NOTIFICATIONS.find(n => n.id === id)
    if (item) item.read = true
  },
}

// 10. Admin Service
export const adminService = {
  async getSystemStatus(): Promise<{ database: string; redis_cache: string; weather_worker: string; uptime: string }> {
    const live = await tryFetch<any>('/health/')
    return {
      database: live ? 'Connected (MySQL/PostgreSQL)' : 'Operational / Mock Ready',
      redis_cache: live ? 'Active' : 'In-Memory Simulation',
      weather_worker: 'Active (Open-Meteo Synced)',
      uptime: '99.98%',
    }
  },
  async listAuditLogs(params?: { user?: string; status?: string; action?: string }): Promise<AuditLog[]> {
    const live = await tryFetch<AuditLog[]>('/admin/audit-logs/')
    let logs = live && live.length > 0 ? live : MOCK_AUDIT_LOGS
    if (params?.user) logs = logs.filter(l => l.username.toLowerCase().includes(params.user!.toLowerCase()))
    if (params?.status && params.status !== 'all') logs = logs.filter(l => l.status === params.status)
    if (params?.action && params.action !== 'all') logs = logs.filter(l => l.action.includes(params.action!))
    return logs
  },
  async listSystemHealth(): Promise<SystemServiceHealth[]> {
    const live = await tryFetch<SystemServiceHealth[]>('/admin/system-health/')
    return live && live.length > 0 ? live : MOCK_SYSTEM_HEALTH
  },
  async listWeatherSources(): Promise<WeatherSourceConfig[]> {
    const live = await tryFetch<WeatherSourceConfig[]>('/admin/weather-sources/')
    return live && live.length > 0 ? live : MOCK_WEATHER_SOURCES
  },
  async updateWeatherSource(id: string, updates: Partial<WeatherSourceConfig>): Promise<WeatherSourceConfig | undefined> {
    await tryFetch(`/admin/weather-sources/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    const src = MOCK_WEATHER_SOURCES.find(s => s.id === id)
    if (src) Object.assign(src, updates)
    return src
  },
  async getSettings(): Promise<SystemSettings> {
    const live = await tryFetch<SystemSettings>('/admin/settings/')
    return live || MOCK_SYSTEM_SETTINGS
  },
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    await tryFetch('/admin/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    })
    Object.assign(MOCK_SYSTEM_SETTINGS, settings)
    return MOCK_SYSTEM_SETTINGS
  },
}

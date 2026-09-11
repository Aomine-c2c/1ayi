import type { ApiResponse, Farm, User, AuthTokens, CropCycle, WeatherObservation, IntelligenceResult } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('ayis_token')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || errorBody.error || errorBody.detail || `HTTP ${response.status}`)
  }

  if (response.status === 204) return {} as T

  return response.json()
}

export const api = {
  // ── Health ──────────────────────────────────────────────
  health: () => request<ApiResponse>('/health/'),

  // ── Auth ────────────────────────────────────────────────
  login: (username: string, password: string) =>
    request<AuthTokens>('/users/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('ayis_refresh_token') : ''
    return request<{ status: string }>('/users/auth/token/blacklist/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refresh || '' }),
    })
  },

  register: (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) =>
    request<User>('/users/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Users ────────────────────────────────────────────────
  getMe: () => request<User>('/users/me/'),
  getUsers: () => request<User[]>('/users/'),

  // ── Farms ────────────────────────────────────────────────
  getFarms: () => request<Farm[]>('/farms/'),
  getFarm: (id: number) => request<Farm>(`/farms/${id}/`),
  createFarm: (data: Partial<Farm>) =>
    request<Farm>('/farms/', { method: 'POST', body: JSON.stringify(data) }),
  updateFarm: (id: number, data: Partial<Farm>) =>
    request<Farm>(`/farms/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFarm: (id: number) =>
    request<{ detail: string }>(`/farms/${id}/`, { method: 'DELETE' }),
  getFarmsGeoJSON: () => request<GeoJSONFeatureCollection>('/farms/geojson/'),

  // ── Crop Cycles ──────────────────────────────────────────
  getCycles: () => request<CropCycle[]>('/crops/cycles/'),
  getCycle: (id: number) => request<CropCycle>(`/crops/cycles/${id}/`),
  createCycle: (data: Partial<CropCycle>) =>
    request<CropCycle>('/crops/cycles/', { method: 'POST', body: JSON.stringify(data) }),
  updateCycle: (id: number, data: Partial<CropCycle>) =>
    request<CropCycle>(`/crops/cycles/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Weather ──────────────────────────────────────────────
  getWeatherObservations: (farmId?: number) =>
    request<WeatherObservation[]>(farmId ? `/weather/?farm=${farmId}` : '/weather/'),
  createWeatherObservation: (data: Partial<WeatherObservation>) =>
    request<WeatherObservation>('/weather/', { method: 'POST', body: JSON.stringify(data) }),

  // ── Intelligence ─────────────────────────────────────────
  getIntelligenceResults: (farmId?: number) =>
    request<IntelligenceResult[]>(farmId ? `/intelligence/results/?farm=${farmId}` : '/intelligence/results/'),
  getSuitability: (farmId: number, cropId: number) =>
    request<unknown>(`/intelligence/suitability/?farm=${farmId}&crop=${cropId}`),
  getYieldEstimate: (cycleId: number) =>
    request<unknown>(`/intelligence/yield-estimate/?cycle=${cycleId}`),

  // ── Reports ──────────────────────────────────────────────
  getReportTemplates: () => request<unknown[]>('/reports/templates/'),
  generateReport: (templateId: number, params: Record<string, unknown>) =>
    request<unknown>(`/reports/generate/`, {
      method: 'POST',
      body: JSON.stringify({ template_id: templateId, ...params }),
    }),
}

// ── Local types ────────────────────────────────────────────
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { id: number; name: string; area_ha: number | null; notes: string; owner_username: string }
}

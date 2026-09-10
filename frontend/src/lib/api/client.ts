import type { ApiResponse, Farm, User, AuthTokens } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | null = null
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('ayis_token')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || errorBody.error || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  // Health
  health: () => request<ApiResponse>('/health/'),

  // Auth
  login: (username: string, password: string) =>
    request<AuthTokens>('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request<{ status: string }>('/auth/token/blacklist/', {
      method: 'POST',
      body: JSON.stringify({ refresh: localStorage.getItem('ayis_refresh_token') || '' }),
    }),

  register: (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) =>
    request<User>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users
  getMe: () => request<User>('/users/me/'),
  getUsers: () => request<User[]>('/users/'),

  // Farms
  getFarms: () => request<Farm[]>('/farms/'),
  getFarm: (id: number) => request<Farm>(`/farms/${id}/`),
  createFarm: (data: Partial<Farm>) =>
    request<Farm>('/farms/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFarm: (id: number, data: Partial<Farm>) =>
    request<Farm>(`/farms/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFarm: (id: number) =>
    request<{ detail: string }>(`/farms/${id}/`, {
      method: 'DELETE',
    }),
  getFarmsGeoJSON: () => request<GeoJSONFeatureCollection>('/farms/geojson/'),
  getFarmsWithin: (bbox: { min_lon: number; min_lat: number; max_lon: number; max_lat: number }) =>
    request<Farm[]>('/farms/within/', {
      method: 'GET',
      body: null,
    }),
}

// Types
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    id: number
    name: string
    area_ha: number | null
    notes: string
    owner_username: string
  }
}

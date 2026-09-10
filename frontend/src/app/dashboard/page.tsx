"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api/client'
import type { Farm } from '@/lib/types'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading dashboard...</div> }

export default function DashboardPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [health, setHealth] = useState<{ status: string; service: string; version: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const h = await api.health().catch(() => null)
        setHealth(h)
        const f = await api.getFarms().catch(() => [])
        setFarms(f)
      } catch (_) {}
      finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Agricultural Yield Intelligence System</p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        )}
      </div>

      {loading ? <Loading /> : (
        <div className="space-y-6">
          {/* API Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">API Status</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {health?.status === 'ok' ? 'Backend is healthy' : 'Backend unreachable'}
              </span>
              {health && <span className="text-xs text-gray-400 ml-auto">v{health.version}</span>}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Farms</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{farms.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-sm text-gray-500">Active Cycles</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {farms.reduce((acc: number, f: any) => acc + (f.cycles?.filter((c: any) => c.status !== 'CANCELLED').length || 0), 0)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-sm text-gray-500">Your Role</p>
              <p className="text-3xl font-bold text-purple-700 mt-1 capitalize">{user?.role || '—'}</p>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {([
              { name: 'Farms', href: '/dashboard/farms', desc: 'Manage your farms and land', icon: '🌾' },
              { name: 'Crop Cycles', href: '/dashboard/cycles', desc: 'Track planting through harvest', icon: '🌱' },
              { name: 'Weather', href: '/dashboard/weather', desc: 'Weather data and observations', icon: '🌤️' },
              { name: 'Intelligence', href: '/dashboard/intelligence', desc: 'Recommendations & yield estimates', icon: '🧠' },
              { name: 'Charts', href: '/dashboard/charts', desc: 'Visual data summaries', icon: '📊' },
              { name: 'Reports', href: '/dashboard/reports', desc: 'Generate and view reports', icon: '📋' },
            ] as const).map(item => (
              <a key={item.name} href={item.href} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </a>
            ))}
          </div>

          {/* Recent Farms */}
          {farms.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Farms</h2>
              <div className="space-y-2">
                {farms.map((farm: Farm) => (
                  <a key={farm.id} href="/dashboard/farms" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow flex justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{farm.name}</p>
                      <p className="text-xs text-gray-500">{farm.area_ha ? `${farm.area_ha.toFixed(1)} ha` : 'Area TBD'} {farm.notes ? `· ${farm.notes}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-400">ID: {farm.id}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

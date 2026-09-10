"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-32 text-sm text-gray-700 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <div className="w-16 text-right text-sm font-medium text-gray-600">{item.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

function Loading() { return <div className="text-center py-12 text-gray-500">Loading charts...</div> }

export default function ChartsPage() {
  const [loading, setLoading] = useState(true)
  const [farms, setFarms] = useState<any[]>([])
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'
    const headers: Record<string, string> = {}
    if (user?.token) headers['Authorization'] = `Bearer ${user.token}`

    fetch(`${apiBase}/farms/`, { headers })
      .then(r => r.json())
      .then(data => setFarms(data))
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [user])

  const farmAreaData = farms
    .filter((f: any) => f.area_ha)
    .map((f: any) => ({ label: f.name, value: f.area_ha }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  if (loading) return <Loading />
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Charts & Analytics</h1>
        <p className="text-gray-500 mt-1">Visual summaries of your agricultural data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Farm Area (hectares)</h2>
          {farmAreaData.length > 0 ? (
            <BarChart data={farmAreaData} color="bg-green-500" />
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No farm area data available</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Farm Status Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', value: 3, color: 'bg-green-500' },
              { label: 'Inactive', value: 1, color: 'bg-gray-400' },
            ].map(item => {
              const total = 4
              const pct = ((item.value / total) * 100).toFixed(0)
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-700">{item.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-600">{item.value} ({pct}%)</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Crop Distribution</h2>
          <div className="space-y-2">
            {[
              { label: 'Maize', value: 2 },
              { label: 'Beans', value: 1 },
              { label: 'Sorghum', value: 1 },
            ].map(item => {
              const total = 4
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-700">{item.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(item.value / total) * 100}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-600">{item.value}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Yield Performance</h2>
          <div className="space-y-3">
            {[
              { crop: 'Maize', yield_kg_ha: 2800, target: 3500, color: 'bg-green-500' },
              { crop: 'Beans', yield_kg_ha: 1200, target: 1500, color: 'bg-amber-500' },
              { crop: 'Sorghum', yield_kg_ha: 1800, target: 2200, color: 'bg-blue-500' },
            ].map(item => {
              const pct = Math.round((item.yield_kg_ha / item.target) * 100)
              return (
                <div key={item.crop} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-700">{item.crop}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-24 text-right text-xs text-gray-500">
                    {item.yield_kg_ha.toLocaleString()} / {item.target.toLocaleString()} kg/ha
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

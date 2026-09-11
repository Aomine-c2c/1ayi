"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  unit?: string
  maxOverride?: number
}

function HBar({ data, unit = '', maxOverride }: BarChartProps) {
  const max = maxOverride ?? Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = Math.round((item.value / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 text-sm text-gray-600 truncate text-right flex-shrink-0">{item.label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${item.color ?? 'bg-primary-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-20 text-right text-sm font-semibold text-gray-700 flex-shrink-0">
              {item.value.toLocaleString()}{unit ? ` ${unit}` : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-p">
      <h3 className="font-semibold text-gray-800 mb-5">{title}</h3>
      {children}
    </div>
  )
}

export default function ChartsPage() {
  const [loading, setLoading] = useState(true)
  const [farms, setFarms] = useState<any[]>([])
  const [error, setError] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(`${apiBase}/farms/`, { headers })
      .then(r => r.json())
      .then(data => setFarms(data))
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [token])

  const farmAreaData = farms
    .filter((f: any) => f.area_ha)
    .map((f: any) => ({ label: f.name, value: Number(f.area_ha) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Aggregate crop data from nested cycles
  const cropCounts: Record<string, number> = {}
  farms.forEach((f: any) => {
    (f.cycles ?? []).forEach((c: any) => {
      if (c.crop_name) cropCounts[c.crop_name] = (cropCounts[c.crop_name] || 0) + 1
    })
  })
  const cropDistData = Object.entries(cropCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Stage distribution
  const stageCounts: Record<string, number> = {}
  farms.forEach((f: any) => {
    (f.cycles ?? []).forEach((c: any) => {
      if (c.current_stage) stageCounts[c.current_stage] = (stageCounts[c.current_stage] || 0) + 1
    })
  })
  const stageColors: Record<string, string> = {
    PLANNED: 'bg-earth-400', PLANTED: 'bg-sky-500', GROWING: 'bg-primary-500',
    NEAR_HARVEST: 'bg-earth-500', HARVESTED: 'bg-purple-500', CANCELLED: 'bg-red-400',
  }
  const stageData = Object.entries(stageCounts).map(([label, value]) => ({
    label: label.replace('_', ' '), value, color: stageColors[label] ?? 'bg-gray-400'
  })).sort((a, b) => b.value - a.value)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Visual summaries of your agricultural data</p>
      </div>

      {error && <div className="alert-error mb-4"><span>✕</span><span>{error}</span></div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card-p h-56 skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <ChartCard title="Farm Area (hectares)">
            {farmAreaData.length > 0 ? (
              <HBar data={farmAreaData} unit="ha" />
            ) : (
              <div className="empty-state py-8">
                <span className="empty-icon">📐</span>
                <p className="empty-desc">No farm area data yet</p>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Crop Distribution">
            {cropDistData.length > 0 ? (
              <HBar data={cropDistData.map(d => ({ ...d, color: 'bg-earth-400' }))} unit="cycles" />
            ) : (
              <div className="empty-state py-8">
                <span className="empty-icon">🌿</span>
                <p className="empty-desc">No crop cycle data yet</p>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Cycle Stage Distribution">
            {stageData.length > 0 ? (
              <HBar data={stageData} unit="cycles" />
            ) : (
              <div className="empty-state py-8">
                <span className="empty-icon">📈</span>
                <p className="empty-desc">No cycle data yet</p>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Summary">
            <div className="space-y-3">
              {[
                { label: 'Total Farms', value: farms.length, color: 'text-primary-700' },
                { label: 'Total Crop Cycles', value: farms.reduce((a: number, f: any) => a + (f.cycles?.length || 0), 0), color: 'text-sky-700' },
                { label: 'Total Area (ha)', value: farms.reduce((a: number, f: any) => a + Number(f.area_ha || 0), 0).toFixed(1), color: 'text-earth-700' },
                { label: 'Unique Crops', value: Object.keys(cropCounts).length, color: 'text-purple-700' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  )
}

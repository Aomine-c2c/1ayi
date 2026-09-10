"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { Farm, CropCycle } from '@/lib/types'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading crop cycles...</div> }

export default function CyclesPage() {
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'
    const headers: Record<string, string> = {}
    if (user?.token) headers['Authorization'] = `Bearer ${user.token}`

    fetch(`${apiBase}/farms/`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then((farms: any[]) => {
        const found = farms.filter((f: any) => f.cycles && f.cycles.length > 0)
        setCycles(found.flatMap((f: any) => (f.cycles || []).map((c: CropCycle) => ({ ...c, farm_name: f.name }))))
      })
      .catch(() => setError('Failed to load crop cycles'))
      .finally(() => setLoading(false))
  }, [user])

  const stageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-yellow-100 text-yellow-800',
      PLANTED: 'bg-blue-100 text-blue-800',
      GROWING: 'bg-green-100 text-green-800',
      NEAR_HARVEST: 'bg-orange-100 text-orange-800',
      HARVESTED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Crop Cycles</h1>
        <p className="text-gray-500 mt-1">Track planting through harvest</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {loading ? <Loading /> : cycles.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-500 mb-4">No crop cycles found.</p>
          <p className="text-sm text-gray-400">Start a new cycle when you plant a crop.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{c.crop_name}</h3>
                <p className="text-sm text-gray-500">{c.farm_name} {c.variety_name ? `· ${c.variety_name}` : ''} {c.area_ha ? `· ${c.area_ha} ha` : ''}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded ${stageColor(c.current_stage)}`}>
                    {c.current_stage}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{c.status}</span>
                </div>
                {c.planting_date && <p className="text-xs text-gray-400 mt-1">Planted: {new Date(c.planting_date).toLocaleDateString()}</p>}
                {c.expected_harvest_date && <p className="text-xs text-gray-400">Expected harvest: {new Date(c.expected_harvest_date).toLocaleDateString()}</p>}
              </div>
              <span className="text-xs text-gray-400">#{c.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

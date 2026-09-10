"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading intelligence...</div> }

export default function IntelligencePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'
    const headers: Record<string, string> = {}
    if (user?.token) headers['Authorization'] = `Bearer ${user.token}`

    fetch(`${apiBase}/intelligence/results/`, { headers })
      .then(r => r.json())
      .then(data => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Loading />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intelligence</h1>
        <p className="text-gray-500 mt-1">Crop suitability, recommendations & yield estimates</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
          <strong>No intelligence data yet.</strong> Recommendations and yield estimates are generated
          when crop cycles are created or when the analysis engine runs.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {r.result_type === 'suitability' ? 'Crop Suitability' : ''}
                    {r.result_type === 'recommendation' ? 'Recommendation' : ''}
                    {r.result_type === 'yield_estimate' ? 'Yield Estimate' : ''}
                    {r.result_type === 'weather_analysis' ? 'Weather Analysis' : ''}
                    {!['suitability','recommendation','yield_estimate','weather_analysis'].includes(r.result_type) && r.result_type}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Farm ID: {r.farm_id} · Generated: {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {Math.round((r.confidence || 0) * 100)}% confidence
                </span>
              </div>
              {r.explanation && (
                <div className="bg-gray-50 border-l-4 border-green-500 p-3 text-sm text-gray-700 rounded-r">
                  {r.explanation}
                </div>
              )}
              {r.factors && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(r.factors).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500">{k}:</span> {typeof v === 'number' ? v.toFixed(2) : String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
        <strong>How it works:</strong> The intelligence engine considers multiple factors — temperature, rainfall,
        humidity, wind, season, crop requirements, growth period, farm location, recent weather, and forecast
        conditions — to generate suitability scores, recommendations, and yield estimates.
      </div>
    </div>
  )
}

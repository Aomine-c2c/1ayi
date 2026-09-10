"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading reports...</div> }

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'
    const headers: Record<string, string> = {}
    if (user?.token) headers['Authorization'] = `Bearer ${user.token}`

    fetch(`${apiBase}/reports/templates/`, { headers })
      .then(r => r.json())
      .then(data => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Loading />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and manage agricultural reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {([
          { name: 'Yield Summary', icon: '📊', desc: 'Total yield by crop, farm, season' },
          { name: 'Weather Report', icon: '🌤️', desc: 'Weather observations and trends' },
          { name: 'Crop Suitability', icon: '🌾', desc: 'Suitability scores by farm' },
          { name: 'Production Report', icon: '📈', desc: 'Production records and trends' },
        ] as const).map(report => (
          <div key={report.name} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-3xl">{report.icon}</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">{report.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
          </div>
        ))}
      </div>

      {templates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Saved Templates</h2>
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.description || 'No description'} · {t.format || 'PDF'}</p>
                </div>
                <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-500">
        <p>Reports can be generated in PDF, CSV, or JSON format. Templates can be scheduled for automatic delivery.</p>
      </div>
    </div>
  )
}

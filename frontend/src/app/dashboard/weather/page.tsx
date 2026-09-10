"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading weather data...</div> }

export default function WeatherPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weatherData, setWeatherData] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.5&longitude=35.0&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,windspeed_10m_max&timezone=Africa/Nairobi')
      .then(r => r.json())
      .then(data => setWeatherData([data]))
      .catch(() => setError('Failed to load weather data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>

  const current = weatherData[0]?.current_weather
  const daily = weatherData[0]?.daily

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Weather</h1>
        <p className="text-gray-500 mt-1">Current conditions and forecast from Open-Meteo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {current && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Conditions (Nairobi region)</h2>
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {current.temperature !== undefined ? Math.round(current.temperature) : '—'}°C
              </span>
              <div>
                <p className="text-sm text-gray-500">Wind: {current.windspeed !== undefined ? `${Math.round(current.windspeed)} km/h` : '—'}</p>
                <p className="text-sm text-gray-500">Weather code: {current.weathercode}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Weather Codes</h2>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>0: Clear sky</li>
            <li>1-3: Partial clouds</li>
            <li>45-48: Fog</li>
            <li>51-57: Drizzle</li>
            <li>61-67: Rain</li>
            <li>71-77: Snow</li>
            <li>80-82: Rain showers</li>
            <li>95-99: Thunderstorm</li>
          </ul>
        </div>
      </div>

      {daily && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">7-Day Forecast</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Max °C</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Min °C</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Rain (mm)</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Wind (km/h)</th>
                </tr>
              </thead>
              <tbody>
                {daily.time.map((date: string, i: number) => (
                  <tr key={date} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-700">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{daily.temperature_2m_max?.[i] ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{daily.temperature_2m_min?.[i] ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{daily.rain_sum?.[i] ?? daily.precipitation_sum?.[i] ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{daily.windspeed_10m_max?.[i] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-500">
        <p><strong>Data source:</strong> Open-Meteo (free, no API key required) — covers Kenya and global regions.</p>
        <p className="mt-1">Weather observations are synced to farms in the database for agronomic analysis.</p>
      </div>
    </div>
  )
}

"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService } from '@/lib/services'
import type { WeatherRecord, WeatherStation } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

type VariableType = 'temperature' | 'rainfall' | 'humidity' | 'wind' | 'pressure'
type AggregationType = 'daily' | 'weekly' | 'monthly'

export default function HistoricalWeatherPage() {
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('WS-NAK-01')
  const [selectedVariable, setSelectedVariable] = useState<VariableType>('temperature')
  const [aggregation, setAggregation] = useState<AggregationType>('daily')
  const [enableComparison, setEnableComparison] = useState<boolean>(true)
  const [historicalData, setHistoricalData] = useState<WeatherRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function init() {
      const stList = await weatherService.listStations()
      setStations(stList)
    }
    init()
  }, [])

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      const data = await weatherService.listHistoricalObservations({
        station_id: selectedStationId,
        aggregation: aggregation,
      })
      setHistoricalData(data)
      setLoading(false)
    }
    loadHistory()
  }, [selectedStationId, aggregation])

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0]

  // Compute stats for current variable
  const values = historicalData.map(d => {
    if (selectedVariable === 'temperature') return d.temperature_celsius
    if (selectedVariable === 'rainfall') return d.rainfall_mm
    if (selectedVariable === 'humidity') return d.relative_humidity_percent
    if (selectedVariable === 'wind') return d.wind_speed_ms
    return d.pressure_hpa || 1013
  })

  const minVal = values.length > 0 ? Math.min(...values) : 0
  const maxVal = values.length > 0 ? Math.max(...values) : 100
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0'

  // Metric metadata
  const metricMeta = {
    temperature: { label: 'Temperature', unit: '°C', color: 'text-amber-700', stroke: '#f59e0b', barBg: 'bg-amber-500' },
    rainfall:    { label: 'Rainfall', unit: 'mm', color: 'text-sky-700', stroke: '#0284c7', barBg: 'bg-sky-500' },
    humidity:    { label: 'Relative Humidity', unit: '%', color: 'text-teal-700', stroke: '#0d9488', barBg: 'bg-teal-500' },
    wind:        { label: 'Wind Velocity', unit: 'm/s', color: 'text-indigo-700', stroke: '#6366f1', barBg: 'bg-indigo-500' },
    pressure:    { label: 'Barometric Pressure', unit: 'hPa', color: 'text-purple-700', stroke: '#9333ea', barBg: 'bg-purple-500' },
  }[selectedVariable]

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Historical Weather</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Historical Agro-Meteorological Archive
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-variable time-series telemetry analysis, period-over-period comparison, and climatological aggregation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/weather-trends"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>📉</span>
            <span>View Climatological Trends</span>
          </Link>
        </div>
      </div>

      {/* 2. Interactive Filter & Query Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Station Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700">Station / Basin:</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location_name})
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation Mode (Daily / Weekly / Monthly) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">Aggregation:</span>
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {(['daily', 'weekly', 'monthly'] as AggregationType[]).map((agg) => (
                <button
                  key={agg}
                  onClick={() => setAggregation(agg)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    aggregation === agg
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {agg}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Period Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnableComparison(!enableComparison)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                enableComparison
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {enableComparison ? '✓ Benchmark Comparison On (Prior Season)' : '+ Compare Prior Year'}
            </button>
          </div>
        </div>

        {/* Variable Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {(['temperature', 'rainfall', 'humidity', 'wind', 'pressure'] as VariableType[]).map((v) => {
            const isSelected = selectedVariable === v
            return (
              <button
                key={v}
                onClick={() => setSelectedVariable(v)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                  isSelected
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {v === 'temperature' && '🌡️ '}
                {v === 'rainfall' && '💧 '}
                {v === 'humidity' && '🌫️ '}
                {v === 'wind' && '💨 '}
                {v === 'pressure' && '⏲️ '}
                {v}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Summary Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Period Average</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {avgVal} <span className="text-xs font-normal text-gray-500">{metricMeta.unit}</span>
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Over {historicalData.length} records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Peak / Max Recorded</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {maxVal} <span className="text-xs font-normal text-gray-500">{metricMeta.unit}</span>
          </p>
          <span className="text-[10px] text-gray-500 font-medium">Observed high</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Minimum Reading</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {minVal} <span className="text-xs font-normal text-gray-500">{metricMeta.unit}</span>
          </p>
          <span className="text-[10px] text-gray-500 font-medium">Observed low</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Active Station Elevation</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {selectedStation?.elevation_m} <span className="text-xs font-normal text-gray-500">m ASL</span>
          </p>
          <span className="text-[10px] text-sky-700 font-medium">{selectedStation?.county} County</span>
        </div>
      </div>

      {/* 4. Interactive Analytical SVG Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {metricMeta.label} Time Series ({aggregation.toUpperCase()})
            </h3>
            <p className="text-xs text-gray-500">
              Interpolated station readings with multi-year climatic baseline comparison
            </p>
          </div>
          {enableComparison && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-gray-700 font-semibold">2026 Observed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-gray-400 border border-dashed" />
                <span className="text-gray-500">10-Yr Historical Norm</span>
              </div>
            </div>
          )}
        </div>

        {/* Pure SVG Line and Bar Canvas */}
        <div className="relative pt-6 pb-2">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              Loading station telemetry timeseries...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 w-full flex items-end gap-1.5 sm:gap-2 px-2 pt-8 border-b border-gray-200">
                {historicalData.map((rec, i) => {
                  const val =
                    selectedVariable === 'temperature' ? rec.temperature_celsius :
                    selectedVariable === 'rainfall' ? rec.rainfall_mm :
                    selectedVariable === 'humidity' ? rec.relative_humidity_percent :
                    selectedVariable === 'wind' ? rec.wind_speed_ms :
                    rec.pressure_hpa || 1013

                  const range = (maxVal - minVal) || 1
                  const heightPct = Math.max(8, Math.min(100, Math.round(((val - minVal) / range) * 85 + 15)))
                  
                  // Mock historical comparison norm
                  const normVal = val * 0.94 + Math.sin(i) * 1.2
                  const normHeightPct = Math.max(8, Math.min(100, Math.round(((normVal - minVal) / range) * 85 + 15)))

                  const dObj = new Date(rec.observed_at)
                  const dateLabel = aggregation === 'monthly'
                    ? dObj.toLocaleDateString('en-GB', { month: 'short' })
                    : dObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

                  return (
                    <div key={rec.id} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                        <span className="font-bold">{dateLabel}</span>
                        <span>{val} {metricMeta.unit} (Norm: {normVal.toFixed(1)})</span>
                      </div>

                      {/* Comparison Marker line */}
                      {enableComparison && (
                        <div
                          className="absolute w-full border-t-2 border-gray-400/80 border-dashed z-10 pointer-events-none"
                          style={{ bottom: `${normHeightPct}%` }}
                        />
                      )}

                      {/* Value Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          selectedVariable === 'rainfall'
                            ? 'bg-sky-600 group-hover:bg-sky-700'
                            : selectedVariable === 'temperature'
                            ? 'bg-amber-500 group-hover:bg-amber-600'
                            : 'bg-emerald-600 group-hover:bg-emerald-700'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />

                      {/* Bottom Label (every 3rd on small screens) */}
                      <span className="text-[9px] text-gray-400 mt-2 truncate w-full text-center hidden sm:block">
                        {dateLabel}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 px-2">
                <span>Start: {historicalData[historicalData.length - 1] ? new Date(historicalData[historicalData.length - 1].observed_at).toLocaleDateString() : ''}</span>
                <span className="font-mono text-[11px] text-gray-600">Sample Interval: {aggregation.toUpperCase()}</span>
                <span>End: {historicalData[0] ? new Date(historicalData[0].observed_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tabular Data Records */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Historical Observation Log</h3>
            <p className="text-xs text-gray-500">Raw validated sensor packets for the selected temporal window</p>
          </div>
          <button
            onClick={() => alert('Exporting validated CSV log...')}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100"
          >
            📥 Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Temp (°C)</th>
                <th className="pb-3">Rain (mm)</th>
                <th className="pb-3">Humidity</th>
                <th className="pb-3">Wind (m/s)</th>
                <th className="pb-3">Pressure</th>
                <th className="pb-3">Solar (MJ/m²)</th>
                <th className="pb-3">Soil Moisture</th>
                <th className="pb-3 text-right">Data Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historicalData.slice(0, 10).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/70">
                  <td className="py-2.5 pr-3 font-mono text-gray-900">
                    {new Date(r.observed_at).toLocaleDateString()} {new Date(r.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 pr-3 font-bold text-gray-900">{r.temperature_celsius}°C</td>
                  <td className="py-2.5 pr-3 text-sky-700 font-semibold">{r.rainfall_mm} mm</td>
                  <td className="py-2.5 pr-3 text-gray-700">{r.relative_humidity_percent}%</td>
                  <td className="py-2.5 pr-3 text-gray-700">{r.wind_speed_ms} m/s ({r.wind_direction_deg}°)</td>
                  <td className="py-2.5 pr-3 text-gray-600 font-mono">{r.pressure_hpa || 1013} hPa</td>
                  <td className="py-2.5 pr-3 text-amber-700 font-medium">{r.solar_radiation_mj_m2}</td>
                  <td className="py-2.5 pr-3 text-emerald-800">{r.soil_moisture_pct}%</td>
                  <td className="py-2.5 text-right">
                    <Badge variant={r.data_quality === 'verified' ? 'green' : 'amber'}>
                      {r.data_quality.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

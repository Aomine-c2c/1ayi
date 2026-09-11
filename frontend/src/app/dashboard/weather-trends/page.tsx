"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService } from '@/lib/services'
import type { WeatherTrendPoint, WeatherStation } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function WeatherTrendsPage() {
  const [trends, setTrends] = useState<WeatherTrendPoint[]>([])
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('WS-NAK-01')
  const [trendFocus, setTrendFocus] = useState<'all' | 'rainfall' | 'thermal' | 'anomalies'>('all')

  useEffect(() => {
    async function load() {
      const [tList, sList] = await Promise.all([
        weatherService.getWeatherTrends(),
        weatherService.listStations(),
      ])
      setTrends(tList)
      setStations(sList)
    }
    load()
  }, [])

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0]

  // Seasonal Cumulative Rainfall metrics
  const totalRainfallObserved = trends.reduce((acc, t) => acc + t.cumulative_rainfall_mm, 0).toFixed(1)
  const totalRainfallNormal = trends.reduce((acc, t) => acc + t.normal_rainfall_mm, 0).toFixed(1)
  const netRainfallAnomaly = (parseFloat(totalRainfallObserved) - parseFloat(totalRainfallNormal)).toFixed(1)

  // Growing Degree Days (GDD) Accumulation
  const totalGdd = trends.reduce((acc, t) => acc + t.gdd_c, 0)
  const totalEt0 = trends.reduce((acc, t) => acc + t.et0_mm, 0).toFixed(1)

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Weather Trends</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Climatological Trends & Seasonal Patterns
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Rainfall accumulation anomalies, thermal heat unit trajectories, evapotranspiration curves, and 10-year historical baseline comparison.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="text-gray-400 font-semibold">Basin:</span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.county})
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'rainfall', 'thermal', 'anomalies'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTrendFocus(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  trendFocus === mode ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Seasonal Trend KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Season Rainfall Accumulation</span>
          <p className="text-3xl font-black text-sky-900 mt-1">
            {totalRainfallObserved} <span className="text-sm font-normal text-gray-500">mm</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs mt-1 text-emerald-700 font-semibold">
            <span>Normal: {totalRainfallNormal} mm</span>
            <span>({parseFloat(netRainfallAnomaly) >= 0 ? `+${netRainfallAnomaly}` : netRainfallAnomaly} mm)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Accumulated GDD (Base 10°C)</span>
          <p className="text-3xl font-black text-amber-900 mt-1">
            {totalGdd} <span className="text-sm font-normal text-gray-500">°C-days</span>
          </p>
          <span className="text-xs text-amber-700 font-semibold mt-1 block">
            Optimal corn pollination thermal units reached
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Penman-Monteith ET0 Total</span>
          <p className="text-3xl font-black text-teal-900 mt-1">
            {totalEt0} <span className="text-sm font-normal text-gray-500">mm</span>
          </p>
          <span className="text-xs text-teal-700 font-semibold mt-1 block">
            Moisture balance: {(parseFloat(totalRainfallObserved) - parseFloat(totalEt0)).toFixed(1)} mm surplus
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Microclimate Climatology Index</span>
          <p className="text-3xl font-black text-emerald-800 mt-1">
            +0.82 <span className="text-sm font-normal text-gray-500">σ</span>
          </p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            Favorable agro-climatic quadrant
          </span>
        </div>
      </div>

      {/* 3. Rainfall Trends & Anomalies Visualizer */}
      {(trendFocus === 'all' || trendFocus === 'rainfall' || trendFocus === 'anomalies') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Monthly Rainfall Accumulation vs. 10-Year Climatological Normal</h3>
              <p className="text-xs text-gray-500">Evaluating moisture surplus and deficit anomalies across the crop season</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-sky-700 font-semibold">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" /> Observed Rain
              </span>
              <span className="flex items-center gap-1 text-gray-500 font-semibold">
                <span className="w-3 h-3 rounded bg-gray-300 inline-block" /> 10-Yr Normal
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {trends.map((t) => {
              const maxScale = 150
              const obsPct = Math.min(100, Math.round((t.cumulative_rainfall_mm / maxScale) * 100))
              const normPct = Math.min(100, Math.round((t.normal_rainfall_mm / maxScale) * 100))
              const isSurplus = t.rainfall_anomaly_mm >= 0

              return (
                <div key={t.period} className="space-y-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 w-28">{t.period}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sky-800 font-bold">{t.cumulative_rainfall_mm} mm</span>
                      <span className="text-gray-400">vs Normal {t.normal_rainfall_mm} mm</span>
                      <Badge variant={isSurplus ? 'green' : 'amber'}>
                        {isSurplus ? `+${t.rainfall_anomaly_mm} mm Surplus` : `${t.rainfall_anomaly_mm} mm Deficit`}
                      </Badge>
                    </div>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${obsPct}%` }} />
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: `${normPct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Temperature Trajectories & Historical Benchmark Comparison */}
      {(trendFocus === 'all' || trendFocus === 'thermal' || trendFocus === 'anomalies') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Thermal Trajectory & Historical Climatological Shift</h3>
              <p className="text-xs text-gray-500">Comparing mean seasonal temperature against 1990-2020 WMO 30-year climatological normal</p>
            </div>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              Station: {selectedStation?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {trends.map((t) => {
              const diff = (t.avg_temp_c - t.historical_benchmark_temp_c).toFixed(1)
              const isWarmer = parseFloat(diff) >= 0

              return (
                <div key={t.period} className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                  <span className="text-xs font-bold text-gray-800 block">{t.period}</span>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-black text-amber-900">{t.avg_temp_c}°C</span>
                      <span className="text-xs text-gray-400 font-semibold">{t.historical_benchmark_temp_c}°C</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">Observed vs 30-yr Benchmark</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Anomaly:</span>
                    <span className={`font-bold ${isWarmer ? 'text-rose-600' : 'text-sky-600'}`}>
                      {isWarmer ? `+${diff}°C` : `${diff}°C`}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 pt-1">
                    GDD Generated: <strong className="text-gray-800">{t.gdd_c}°C-d</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. Seasonal Crop Phenology Patterns & Historical Cycles */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Seasonal Agro-Meteorological Cycles & Phenological Risk Windows</h3>
            <p className="text-xs text-gray-500">Long Rains (MAM) vs Short Rains (OND) predictability markers</p>
          </div>
          <Badge variant="blue">Rift Valley Agro-Eco Zone 4B</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <span className="font-bold text-gray-900 block text-sm">March - May (Long Rains Season)</span>
            <p className="text-gray-600 leading-relaxed">
              Typically deposits 480 - 620mm over 75 rain days. Primary window for high-yield hybrid maize (H6213) and late-maturing cereals. Soil moisture replenishment rate: 94%.
            </p>
            <div className="text-[11px] text-emerald-800 font-semibold pt-1">
              ✓ Low drought failure recurrence (8% historical probability)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <span className="font-bold text-gray-900 block text-sm">June - August (Cool Dry Inversion)</span>
            <p className="text-gray-600 leading-relaxed">
              Characterized by persistent stratocumulus cloud deck, reduced solar flux (14 - 18 MJ/m²), and radiational night chilling. Ideal for tuber bulking in potatoes and French bean pod fill.
            </p>
            <div className="text-[11px] text-amber-800 font-semibold pt-1">
              ⚠️ Night chilling alert window below 6°C in escarpment depressions
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <span className="font-bold text-gray-900 block text-sm">October - December (Short Rains)</span>
            <p className="text-gray-600 leading-relaxed">
              High inter-annual variability driven by Indian Ocean Dipole (IOD) and ENSO teleconnections. Delivers 250 - 380mm suitable for early-maturing legumes and dry beans.
            </p>
            <div className="text-[11px] text-sky-800 font-semibold pt-1">
              💧 Convective storm intensity peaks (&gt;20mm in 1 hour)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

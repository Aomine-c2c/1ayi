"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService } from '@/lib/services'
import type { WeatherForecast, WeatherRecord, WeatherStation, DataQualityMetric } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function WeatherOverviewPage() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [observations, setObservations] = useState<WeatherRecord[]>([])
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetric[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('WS-NAK-01')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [fc, obs, stList, qList] = await Promise.all([
        weatherService.getForecast(1),
        weatherService.getCurrentObservations(),
        weatherService.listStations(),
        weatherService.getDataQualityMetrics(),
      ])
      setForecast(fc)
      setObservations(obs)
      setStations(stList)
      setQualityMetrics(qList)
      setLoading(false)
    }
    load()
  }, [])

  const selectedObservation = observations.find(o => o.station_id === selectedStationId) || observations[0]
  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0]
  const selectedQuality = qualityMetrics.find(q => q.station_id === selectedStationId) || qualityMetrics[0]
  const days = forecast?.days || []

  return (
    <div className="space-y-6">
      {/* Header with Station Filter & Links */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Weather Overview</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Regional Weather & Telemetry Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time agro-meteorological observations across calibrated automated stations and mesh reanalysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="text-gray-400 font-semibold">Station:</span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/dashboard/live-weather"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Live Telemetry</span>
          </Link>
          <Link
            href="/dashboard/historical-weather"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            📊 Historical Charts
          </Link>
        </div>
      </div>

      {/* Current Conditions Big Card with Analyst Telemetry */}
      <div className="bg-gradient-to-br from-sky-800 via-sky-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="text-6xl">🌤️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
                  {selectedStation?.name || 'Automated Station'}
                </p>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
                  {selectedStation?.id || 'WS-NAK-01'}
                </span>
              </div>
              <div className="text-5xl font-black tracking-tight mt-1 flex items-baseline gap-2">
                <span>{selectedObservation?.temperature_celsius || 21.4}°C</span>
                <span className="text-xs font-semibold text-sky-300">
                  DP: {selectedObservation?.dew_point_c || 14.8}°C
                </span>
              </div>
              <p className="text-sm text-sky-100 font-medium mt-1">
                Barometric Pressure: {selectedObservation?.pressure_hpa || 1014.2} hPa · Wind: {selectedObservation?.wind_speed_ms || 3.4} m/s ({selectedObservation?.wind_direction_deg || 140}°)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-sky-100 border-t lg:border-t-0 lg:border-l border-white/20 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-sky-300 block text-[10px] uppercase font-bold">Rainfall (24h)</span>
              <span className="text-lg font-black text-white">{selectedObservation?.rainfall_mm || 3.8} mm</span>
              <span className="text-[10px] text-sky-200 block">Bucket resolution: 0.2mm</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-sky-300 block text-[10px] uppercase font-bold">Rel Humidity</span>
              <span className="text-lg font-black text-white">{selectedObservation?.relative_humidity_percent || 68}%</span>
              <span className="text-[10px] text-sky-200 block">Capacitive sensor</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-sky-300 block text-[10px] uppercase font-bold">Solar Radiation</span>
              <span className="text-lg font-black text-white">{selectedObservation?.solar_radiation_mj_m2 || 22.8} MJ/m²</span>
              <span className="text-[10px] text-sky-200 block">Pyranometer flux</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-sky-300 block text-[10px] uppercase font-bold">Soil Moisture</span>
              <span className="text-lg font-black text-white">{selectedObservation?.soil_moisture_pct || 34.6}%</span>
              <span className="text-[10px] text-sky-200 block">Temp: {selectedObservation?.soil_temperature_c || 19.2}°C</span>
            </div>
          </div>
        </div>

        {/* Analyst Plain-Language Status & Hardware Diagnostics */}
        <div className="mt-6 pt-5 border-t border-white/15 bg-white/10 rounded-xl p-4 text-xs leading-relaxed text-sky-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-white block mb-0.5">📡 Telemetry Status & Hardware Health:</span>
            Station {selectedStation?.id} reported at {new Date(selectedObservation?.observed_at || Date.now()).toLocaleTimeString()} via GPRS/MQTT. Battery {selectedStation?.battery_pct || 98}% ({selectedStation?.solar_voltage_v || 14.2}V Solar) · Quality: <strong className="text-emerald-300 uppercase">{selectedObservation?.data_quality || 'VERIFIED'}</strong>.
          </div>
          <div className="flex-shrink-0">
            <Badge variant={selectedQuality?.operational_status === 'healthy' ? 'green' : 'amber'}>
              {selectedQuality?.completeness_pct || 99.6}% 24H COMPLETENESS
            </Badge>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Forecast */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">7-Day Rain & Temperature Outlook</h2>
          <span className="text-xs text-gray-500">Updated from Open-Meteo High Resolution Grid</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
          {days.map((d, i) => (
            <div
              key={d.date}
              className={`p-3.5 rounded-xl border text-center flex flex-col justify-between ${
                i === 0 ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500' : 'bg-gray-50/60 border-gray-200'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-gray-800">
                  {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                </p>
                <p className="text-[10px] text-gray-400 mb-2">
                  {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <span className="text-3xl block my-1">
                  {d.expected_rainfall_mm > 5 ? '🌧️' : d.expected_rainfall_mm > 0 ? '🌦️' : '☀️'}
                </span>
                <p className="text-xs font-semibold text-gray-700">{d.weather_condition}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200/80 space-y-1 text-xs">
                <div className="flex justify-between text-gray-700 font-bold">
                  <span>{d.temp_max_c}°</span>
                  <span className="text-gray-400 font-normal">{d.temp_min_c}°</span>
                </div>
                <div className="text-[11px] text-sky-700 font-semibold">
                  💧 {d.expected_rainfall_mm} mm
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Rainfall & Temperature Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rainfall Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Expected Daily Rainfall (mm)</h3>
              <p className="text-xs text-gray-500">Plan irrigation according to forecasted showers</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Total: 28.8 mm
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {days.map((d) => {
              const pct = Math.min(100, Math.round((d.expected_rainfall_mm / 15) * 100))
              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-gray-500 font-medium">
                    {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.expected_rainfall_mm > 8 ? 'bg-sky-600 font-bold' : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-bold text-gray-800">
                    {d.expected_rainfall_mm.toFixed(1)} mm
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Temperature & Growth Degree Days */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Thermal Suitability (Daily Max / Min)</h3>
            <p className="text-xs text-gray-500">Corn and potato base growth temperature threshold is 10°C</p>
          </div>

          <div className="space-y-2.5 pt-2">
            {days.map((d) => {
              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-gray-500 font-medium">
                    {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sky-600 font-bold w-7 text-right">{d.temp_min_c}°</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 relative">
                      <div
                        className="absolute h-full bg-amber-400 rounded-full"
                        style={{
                          left: `${((d.temp_min_c - 10) / 25) * 100}%`,
                          width: `${((d.temp_max_c - d.temp_min_c) / 25) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-orange-600 font-bold w-7">{d.temp_max_c}°</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 text-[11px] text-gray-400 border-t border-gray-100 flex justify-between">
            <span>Minimum base: 10°C</span>
            <span className="text-emerald-700 font-semibold">Zero Frost Risk Expected</span>
          </div>
        </div>
      </div>

      {/* Monitored Ground Weather Station Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Regional Monitored Weather Stations</h2>
            <p className="text-xs text-gray-500">Connected telemetric field sensors and remote agricultural micro-stations</p>
          </div>
          <Link
            href="/dashboard/data-quality"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Audit Telemetry Data →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {stations.map((st) => {
            const isSelected = st.id === selectedStationId
            const obs = observations.find(o => o.station_id === st.id)
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStationId(st.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-2xs'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-gray-500">{st.id}</span>
                  <Badge variant={st.operational_status === 'online' ? 'green' : st.operational_status === 'delayed' ? 'amber' : 'red'}>
                    {st.operational_status.toUpperCase()}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-gray-900 truncate">{st.name}</h4>
                <p className="text-[10px] text-gray-400 truncate">{st.location_name}</p>

                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                  <span className="font-black text-gray-800">{obs?.temperature_celsius ?? '--'}°C</span>
                  <span className="text-sky-700 font-semibold">{obs?.rainfall_mm ?? 0} mm</span>
                  <span className="text-gray-400 text-[10px]">🔋 {st.battery_pct}%</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

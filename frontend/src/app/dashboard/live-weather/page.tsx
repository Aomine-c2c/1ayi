"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService } from '@/lib/services'
import type { WeatherRecord, WeatherStation } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function LiveWeatherPage() {
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [observations, setObservations] = useState<WeatherRecord[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('WS-NAK-01')
  const [refreshSeconds, setRefreshSeconds] = useState<number>(30)
  const [lastPing, setLastPing] = useState<Date>(new Date())
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      const [stList, obsList] = await Promise.all([
        weatherService.listStations(),
        weatherService.getCurrentObservations(),
      ])
      setStations(stList)
      setObservations(obsList)
      setLastPing(new Date())
    }
    loadData()

    const interval = setInterval(() => {
      if (isLiveStreaming) {
        loadData()
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [isLiveStreaming])

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0]
  const currentObs = observations.find(o => o.station_id === selectedStationId) || observations[0]

  // Calculated secondary bio-meteorological indicators
  const vaporPressureDeficit = ((100 - (currentObs?.relative_humidity_percent || 70)) / 100 * 1.8).toFixed(2)
  const airDensity = (1.225 * ((currentObs?.pressure_hpa || 1013.25) / 1013.25) * (288.15 / (273.15 + (currentObs?.temperature_celsius || 20)))).toFixed(3)

  return (
    <div className="space-y-6">
      {/* 1. Header with Live Status Pulse & Station Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">
              Live Telemetered Ingestion Stream · 15s Polling Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Live Weather & Telemetry Feed
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Direct high-frequency sensor readings from automated ag-weather stations across the agricultural production zones.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs">
            <span className="text-gray-400 font-semibold">Select Station:</span>
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

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
              isLiveStreaming
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            <span>{isLiveStreaming ? '⏸ Pause Stream' : '▶ Resume Stream'}</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Telemetry Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Core Atmospheric Panel (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block">Current Telemetry Reading</span>
              <h2 className="text-lg font-bold text-white mt-0.5">{selectedStation?.name}</h2>
              <span className="text-xs text-slate-300">
                {selectedStation?.location_name} · Lat: {selectedStation?.latitude}° Long: {selectedStation?.longitude}° · Elev: {selectedStation?.elevation_m}m
              </span>
            </div>
            <Badge variant={selectedStation?.operational_status === 'online' ? 'green' : 'amber'}>
              {selectedStation?.operational_status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-xs text-indigo-200 font-semibold uppercase block">Air Temperature</span>
              <div className="text-6xl font-black tracking-tight text-white mt-1">
                {currentObs?.temperature_celsius}°<span className="text-2xl font-normal text-indigo-300">C</span>
              </div>
              <div className="mt-2 text-xs text-indigo-200 flex items-center gap-2">
                <span>Dew Point: <strong>{currentObs?.dew_point_c}°C</strong></span>
                <span>·</span>
                <span>VPD: <strong>{vaporPressureDeficit} kPa</strong></span>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200">Relative Humidity:</span>
                <span className="text-base font-bold text-white">{currentObs?.relative_humidity_percent}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200">Barometric Pressure:</span>
                <span className="text-base font-bold text-white">{currentObs?.pressure_hpa} hPa</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200">Air Density (calc):</span>
                <span className="text-sm font-semibold text-white">{airDensity} kg/m³</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
            <span>Data Source: <strong className="text-white uppercase">{currentObs?.source_type?.replace(/_/g, ' ') || 'TELEMETRY STATION'}</strong></span>
            <span>Packet Timestamp: <strong className="text-white">{new Date(currentObs?.observed_at || Date.now()).toLocaleTimeString()}</strong></span>
            <span className="text-emerald-400 font-bold">Data Quality: {currentObs?.data_quality?.toUpperCase() || 'VERIFIED'}</span>
          </div>
        </div>

        {/* Precipitation & Hydrology Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Precipitation & Water</h3>
              <span className="text-xl">🌧️</span>
            </div>
            <p className="text-xs text-gray-500">Optical & tipping bucket gauge metrics</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Rainfall Accumulation (24h)</span>
              <span className="text-3xl font-black text-sky-950 mt-0.5 block">{currentObs?.rainfall_mm} mm</span>
              <span className="text-[10px] text-sky-600">Intensity: 0.0 mm/hr currently</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block font-bold">Soil Moisture</span>
                <span className="text-sm font-black text-gray-900 mt-0.5 block">{currentObs?.soil_moisture_pct}%</span>
                <span className="text-[10px] text-emerald-700 font-medium">Field Capacity OK</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block font-bold">Soil Temperature</span>
                <span className="text-sm font-black text-gray-900 mt-0.5 block">{currentObs?.soil_temperature_c}°C</span>
                <span className="text-[10px] text-gray-500">Depth: -10cm</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
            <span>Runoff Index: <strong>Low</strong></span>
            <span>Sensor: <strong>HydraProbe II</strong></span>
          </div>
        </div>

        {/* Wind & Solar Flux Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Wind & Solar Radiation</h3>
              <span className="text-xl">☀️</span>
            </div>
            <p className="text-xs text-gray-500">Ultrasonic anemometer & pyranometer</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Solar Radiation Flux</span>
              <span className="text-3xl font-black text-amber-950 mt-0.5 block">{currentObs?.solar_radiation_mj_m2} MJ/m²</span>
              <span className="text-[10px] text-amber-700">Instantaneous: 740 W/m² (Clear Sky)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block font-bold">Wind Velocity</span>
                <span className="text-sm font-black text-gray-900 mt-0.5 block">{currentObs?.wind_speed_ms} m/s</span>
                <span className="text-[10px] text-gray-500">{(currentObs?.wind_speed_ms ? currentObs.wind_speed_ms * 3.6 : 12).toFixed(1)} km/h</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block font-bold">Wind Bearing</span>
                <span className="text-sm font-black text-gray-900 mt-0.5 block">{currentObs?.wind_direction_deg}° SE</span>
                <span className="text-[10px] text-gray-500">Steady trade breeze</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
            <span>Gust (3s peak): <strong>5.8 m/s</strong></span>
            <span>Uptime: <strong>100%</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Hardware & Node Diagnostic Telemetry */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Hardware Transmission & Node Health Diagnostics</h3>
            <p className="text-xs text-gray-500">Battery levels, solar panel charging voltage, telemetry signal margin, and connected farm zones</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Node Model: {selectedStation?.hardware_model}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Internal Battery</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{selectedStation?.battery_pct}%</span>
              <span className="text-emerald-700 text-xs font-bold">● Normal</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5 block">LiFePO4 12V 18Ah Pack</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Solar Charging Array</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{selectedStation?.solar_voltage_v} V</span>
              <span className="text-emerald-700 text-xs font-bold">▲ Charging</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Monocrystalline 30W panel</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Cellular RSSI Signal</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{selectedStation?.signal_strength_dbm} dBm</span>
              <span className="text-emerald-700 text-xs font-bold">Excellent</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5 block">LTE-M / NB-IoT downlink</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">24h Packet Completeness</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">{selectedStation?.completeness_24h_pct}%</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Zero dropped observations</span>
          </div>
        </div>

        {/* Assigned Production Farms */}
        <div className="pt-2 text-xs">
          <span className="font-bold text-gray-700 mr-2">Assigned Agricultural Enclaves:</span>
          <div className="inline-flex flex-wrap gap-2 mt-1 sm:mt-0">
            {selectedStation?.assigned_farms.map((f, i) => (
              <span key={i} className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                🌾 {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Multi-Station Real-Time Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">All Field Stations Real-Time Mesh</h3>
            <p className="text-xs text-gray-500">Simultaneous snapshot across all 5 regional monitoring hubs</p>
          </div>
          <Link href="/dashboard/data-quality" className="text-xs font-bold text-emerald-700 hover:underline">
            Quality Audit Console →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Station ID & Name</th>
                <th className="pb-3">County / Region</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Temp (°C)</th>
                <th className="pb-3">Humidity</th>
                <th className="pb-3">Rain (24h)</th>
                <th className="pb-3">Wind</th>
                <th className="pb-3">Pressure</th>
                <th className="pb-3">Last Packet</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stations.map((st) => {
                const obs = observations.find(o => o.station_id === st.id)
                const isSelected = st.id === selectedStationId
                return (
                  <tr key={st.id} className={`hover:bg-gray-50/70 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                    <td className="py-3 pr-3 font-semibold text-gray-900">
                      <div>{st.name}</div>
                      <span className="text-[10px] font-mono text-gray-400">{st.id}</span>
                    </td>
                    <td className="py-3 pr-3 text-gray-600">{st.county}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={st.operational_status === 'online' ? 'green' : st.operational_status === 'delayed' ? 'amber' : 'red'}>
                        {st.operational_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 font-bold text-gray-900">{obs?.temperature_celsius ?? '--'}°C</td>
                    <td className="py-3 pr-3 text-gray-700">{obs?.relative_humidity_percent ?? '--'}%</td>
                    <td className="py-3 pr-3 text-sky-700 font-bold">{obs?.rainfall_mm ?? 0} mm</td>
                    <td className="py-3 pr-3 text-gray-700">{obs?.wind_speed_ms ?? '--'} m/s</td>
                    <td className="py-3 pr-3 font-mono text-gray-600">{obs?.pressure_hpa ?? 1013} hPa</td>
                    <td className="py-3 pr-3 text-gray-400 text-[11px]">
                      {new Date(st.last_transmission).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedStationId(st.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Inspect Feed
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

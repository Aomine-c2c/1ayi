"use client"
import React, { useState, useEffect } from 'react'
import { adminService, weatherService } from '@/lib/services'
import type { WeatherSourceConfig, WeatherStation } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

export default function WeatherConfigPage() {
  const [sources, setSources] = useState<WeatherSourceConfig[]>([])
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<WeatherSourceConfig | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<WeatherSourceConfig>>({})

  const loadData = async () => {
    setLoading(true)
    const [srcs, stns] = await Promise.all([
      adminService.listWeatherSources(),
      weatherService.listStations(),
    ])
    setSources([...srcs])
    setStations([...stns])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenEdit = (src: WeatherSourceConfig) => {
    setSelectedSource(src)
    setEditFormData({
      ...src,
      thresholds: { ...src.thresholds },
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSource) return
    setIsSubmitting(true)
    try {
      const updated = await adminService.updateWeatherSource(selectedSource.id, editFormData)
      if (updated) {
        setSources(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)))
      }
      setIsEditModalOpen(false)
      setSaveMessage('Weather source configuration saved successfully.')
      setTimeout(() => setSaveMessage(''), 3500)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (src: WeatherSourceConfig) => {
    const nextStatus = src.status === 'active' ? 'standby' : 'active'
    const updated = await adminService.updateWeatherSource(src.id, { status: nextStatus })
    if (updated) {
      setSources(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)))
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Telemetry Pipelines & Feeds · Data Ingestion
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Weather Configuration & Sources
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure atmospheric data feeds, station telemetry polling frequencies, monitored geographic coordinates, and agronomic threshold alarms.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ {saveMessage}
            </span>
          )}
          <button
            onClick={loadData}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Refresh Sync Status</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Level Telemetry Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Configured Providers</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{sources.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Telemetry, ECMWF, ERA5</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Active Ingestion Pipelines</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {sources.filter(s => s.status === 'active').length}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Real-time polling active</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Monitored Locations</span>
          <p className="text-2xl font-black text-sky-700 mt-0.5">
            {stations.length} Reference Stations
          </p>
          <span className="text-[10px] text-sky-700 font-medium">Rift Valley & Highlands grid</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Fastest Ingestion Rate</span>
          <p className="text-2xl font-black text-purple-700 mt-0.5">60 sec</p>
          <span className="text-[10px] text-purple-700 font-medium">Solar MQTT push feed</span>
        </div>
      </div>

      {/* 3. Weather Sources Configuration List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Configured Meteorological Sources</h2>
          <p className="text-xs text-gray-500">Master provider endpoints, sync rates, and live operational states</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">Loading sources...</div>
          ) : (
            sources.map((src) => (
              <div
                key={src.id}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {src.provider === 'telemetry_mesh' ? '📡' : src.provider === 'open_meteo' ? '☁️' : '🌍'}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">{src.name}</h3>
                      <Badge variant={src.status === 'active' ? 'green' : src.status === 'standby' ? 'amber' : 'red'}>
                        {src.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      Endpoint: {src.api_endpoint}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleToggleStatus(src)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        src.status === 'active'
                          ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {src.status === 'active' ? 'Switch to Standby' : 'Activate Pipeline'}
                    </button>
                    <Button
                      variant="primary"
                      onClick={() => handleOpenEdit(src)}
                      className="text-xs font-bold px-3.5 py-1.5"
                    >
                      Configure Thresholds
                    </Button>
                  </div>
                </div>

                {/* Source Stats & Thresholds Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px] pt-3 border-t border-gray-200/60">
                  <div>
                    <span className="text-gray-400 text-[10px] block">UPDATE FREQUENCY</span>
                    <strong className="text-gray-900 font-mono">Every {src.update_frequency_minutes} min</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">MONITORED REGIONS</span>
                    <strong className="text-gray-900">{src.monitored_locations_count} Stations</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">LAST SYNC</span>
                    <strong className="text-gray-700 font-mono text-[10px]">{new Date(src.last_sync_timestamp).toLocaleTimeString()}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">FROST ALARM</span>
                    <strong className="text-sky-700 font-mono">≤ {src.thresholds.frost_temp_c}°C</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">HEAT ALARM</span>
                    <strong className="text-rose-600 font-mono">≥ {src.thresholds.extreme_heat_temp_c}°C</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">SQUALL / RAIN</span>
                    <strong className="text-blue-700 font-mono">≥ {src.thresholds.heavy_rain_mm_hr} mm/hr</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Monitored Physical Station Locations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Monitored Geographical Locations</h2>
            <p className="text-xs text-gray-500">Autonomous agricultural stations mapped to regional crop sectors</p>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {stations.length} Active Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stations.map((stn) => (
            <div key={stn.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800">{stn.id}</span>
                  <Badge variant={stn.operational_status === 'online' ? 'green' : 'amber'}>
                    {stn.operational_status.toUpperCase()}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-gray-900">{stn.name}</h4>
                <p className="text-[10px] text-gray-500">
                  {stn.location_name} · Lat: {stn.latitude.toFixed(3)}, Lon: {stn.longitude.toFixed(3)}
                </p>
              </div>
              <span className="text-base text-gray-400">📍</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Threshold Configuration Modal */}
      {isEditModalOpen && selectedSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Weather Threshold & Frequency Config</h3>
                <p className="text-xs text-gray-500">{selectedSource.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Update Frequency (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.update_frequency_minutes ?? 15}
                    onChange={(e) => setEditFormData({ ...editFormData, update_frequency_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Operational State</label>
                  <select
                    value={editFormData.status ?? 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="active">Active (Ingesting)</option>
                    <option value="standby">Standby</option>
                    <option value="rate_limited">Rate Limited</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">API / Telemetry Endpoint</label>
                <input
                  type="text"
                  value={editFormData.api_endpoint ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, api_endpoint: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Thresholds Box */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px] text-gray-500">
                  Atmospheric Hazard Alarm Thresholds
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Frost Trigger (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editFormData.thresholds?.frost_temp_c ?? 4.0}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        thresholds: { ...editFormData.thresholds!, frost_temp_c: parseFloat(e.target.value) },
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Extreme Heat (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editFormData.thresholds?.extreme_heat_temp_c ?? 32.0}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        thresholds: { ...editFormData.thresholds!, extreme_heat_temp_c: parseFloat(e.target.value) },
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Heavy Rain (mm/h)</label>
                    <input
                      type="number"
                      step="1"
                      value={editFormData.thresholds?.heavy_rain_mm_hr ?? 15.0}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        thresholds: { ...editFormData.thresholds!, heavy_rain_mm_hr: parseFloat(e.target.value) },
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">High Wind (m/s)</label>
                    <input
                      type="number"
                      step="1"
                      value={editFormData.thresholds?.high_wind_ms ?? 16.0}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        thresholds: { ...editFormData.thresholds!, high_wind_ms: parseFloat(e.target.value) },
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Dry Spell (Days)</label>
                    <input
                      type="number"
                      value={editFormData.thresholds?.dry_spell_consecutive_days ?? 14}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        thresholds: { ...editFormData.thresholds!, dry_spell_consecutive_days: parseInt(e.target.value) },
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

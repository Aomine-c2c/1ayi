"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService } from '@/lib/services'
import type { WeatherAlert } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

const SEVERITY_STYLES: Record<string, { badge: 'red' | 'amber' | 'blue' | 'gray'; border: string; bg: string }> = {
  extreme:  { badge: 'red', border: 'border-rose-500', bg: 'bg-rose-50/60' },
  critical: { badge: 'red', border: 'border-rose-400', bg: 'bg-rose-50/50' },
  severe:   { badge: 'red', border: 'border-rose-300', bg: 'bg-rose-50/40' },
  high:     { badge: 'red', border: 'border-rose-300', bg: 'bg-rose-50/30' },
  medium:   { badge: 'amber', border: 'border-amber-300', bg: 'bg-amber-50/30' },
  moderate: { badge: 'amber', border: 'border-amber-300', bg: 'bg-amber-50/30' },
  low:      { badge: 'blue', border: 'border-sky-300', bg: 'bg-sky-50/30' },
  minor:    { badge: 'blue', border: 'border-sky-300', bg: 'bg-sky-50/30' },
  informational: { badge: 'gray', border: 'border-gray-200', bg: 'bg-gray-50/50' },
}

export default function WeatherAlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    weatherService.getAlerts().then((data) => {
      setAlerts(data)
    })
  }, [])

  const handleUpdateStatus = async (id: number, newStatus: 'active' | 'monitoring' | 'resolved') => {
    await weatherService.updateAlertStatus(id, newStatus)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setActionSuccess(`Alert #${id} status updated to ${newStatus.toUpperCase()}`)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  const filteredAlerts = alerts.filter(al => {
    if (severityFilter !== 'all') {
      if (severityFilter === 'high' && !['extreme', 'critical', 'severe', 'high'].includes(al.severity)) return false
      if (severityFilter === 'medium' && !['medium', 'moderate'].includes(al.severity)) return false
      if (severityFilter === 'low' && !['low', 'minor', 'informational'].includes(al.severity)) return false
    }
    if (statusFilter !== 'all' && (al.status || 'active') !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchHeadline = al.headline.toLowerCase().includes(q)
      const matchLocation = (al.location || '').toLowerCase().includes(q)
      const matchTrigger = (al.trigger_condition || '').toLowerCase().includes(q)
      const matchFarms = (al.affected_farms || []).some(f => f.toLowerCase().includes(q))
      const matchCrops = (al.affected_crops || []).some(c => c.toLowerCase().includes(q))
      if (!matchHeadline && !matchLocation && !matchTrigger && !matchFarms && !matchCrops) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Weather Alerts</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agro-Meteorological Threat & Alert Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time atmospheric hazards, biophysical threshold triggers, vulnerable farm clusters, and protective protocols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/data-quality"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
          >
            🛡️ Sensor Health Audit
          </Link>
          <Link
            href="/dashboard/live-weather"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            ⚡ Live Station Feeds
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <span>✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search alerts by location, crop, farm, trigger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="high">High / Critical / Severe</option>
              <option value="medium">Medium / Moderate</option>
              <option value="low">Low / Minor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Showing <strong>{filteredAlerts.length}</strong> alerts</span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
            <span className="text-4xl block mb-2">🌿</span>
            <h3 className="text-sm font-bold text-gray-900">No matching weather alerts</h3>
            <p className="text-xs text-gray-500 mt-1">All monitored stations report atmospheric conditions within normal operating thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((al) => {
            const style = SEVERITY_STYLES[al.severity] || SEVERITY_STYLES.medium
            const currentStatus = al.status || 'active'
            return (
              <div
                key={al.id}
                className={`p-6 rounded-2xl border ${style.border} ${style.bg} bg-white shadow-xs space-y-4 transition-all`}
              >
                {/* Header line: Type icon, Headline, Severity, Status & Station */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <span className="text-3xl mt-0.5">
                      {al.alert_type === 'frost' ? '❄️' : al.alert_type === 'heavy_rain' ? '⛈️' : al.alert_type === 'high_winds' ? '💨' : '⚠️'}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-gray-900 text-sm">{al.headline}</h3>
                        <Badge variant={style.badge}>
                          {al.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={currentStatus === 'resolved' ? 'green' : currentStatus === 'monitoring' ? 'blue' : 'red'}>
                          {currentStatus.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
                        <span>📍 Location: <strong className="text-gray-800">{al.location || 'Rift Valley Regional Basin'}</strong></span>
                        {al.station_id && (
                          <span className="font-mono text-[11px] text-gray-500 bg-white/70 px-2 py-0.5 rounded border border-gray-200">
                            Station: {al.station_id}
                          </span>
                        )}
                        <span>
                          📅 Effective: <strong>{new Date(al.effective_from).toLocaleDateString()}</strong> ({new Date(al.effective_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-1.5 self-start lg:self-auto">
                    {currentStatus !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(al.id, 'resolved')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {currentStatus === 'active' && (
                      <button
                        onClick={() => handleUpdateStatus(al.id, 'monitoring')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg transition-colors"
                      >
                        Set Monitoring
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-gray-100">
                  {al.description}
                </p>

                {/* Biophysical Trigger Condition */}
                {al.trigger_condition && (
                  <div className="text-xs text-gray-700 bg-amber-500/10 border border-amber-300/40 p-3 rounded-xl">
                    <span className="font-bold text-amber-900 block mb-0.5">⚙️ Trigger Condition / Algorithmic Threshold:</span>
                    <span className="font-mono text-[11px] text-amber-950">{al.trigger_condition}</span>
                  </div>
                )}

                {/* Impacted Farms & Crops Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/70 p-3 rounded-xl border border-gray-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Affected Farms:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(al.affected_farms && al.affected_farms.length > 0 ? al.affected_farms : ['Green Ridge Highland Estate']).map((farm, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                          🏡 {farm}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/70 p-3 rounded-xl border border-gray-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Vulnerable Crops & Growth Stages:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(al.affected_crops && al.affected_crops.length > 0 ? al.affected_crops : ['Highland Maize', 'French Beans']).map((crop, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          🌱 {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommended Mitigation Steps */}
                {al.recommended_actions.length > 0 && (
                  <div className="pt-2 border-t border-gray-200/60">
                    <h4 className="text-xs font-bold text-gray-800 mb-1.5">Prescribed Agricultural Mitigation Steps:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {al.recommended_actions.map((act, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                          <span className="text-emerald-700 font-bold">✓</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

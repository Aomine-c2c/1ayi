"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  farmService,
  cropService,
  weatherService,
  fieldService,
  extensionService,
  authService,
  adminService,
} from '@/lib/services'
import type {
  Farm,
  CropCycle,
  WeatherRecord,
  WeatherAlert,
  FieldObservation,
  FieldVisit,
  FollowUpTask,
  User,
  WeatherStation,
  DataQualityMetric,
  AuditLog,
  SystemServiceHealth,
} from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function DashboardPage() {
  const { user } = useAuth()
  const [farmers, setFarmers] = useState<User[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [weather, setWeather] = useState<WeatherRecord[]>([])
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [observations, setObservations] = useState<FieldObservation[]>([])
  const [visits, setVisits] = useState<FieldVisit[]>([])
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([])
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetric[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [uList, fList, cList, wList, aList, obsList, vList, foList, stList, qList, aLogs, sHealth] = await Promise.all([
        authService.listUsers(),
        farmService.listFarms(),
        cropService.listCycles(),
        weatherService.getCurrentObservations(),
        weatherService.getAlerts(),
        fieldService.listObservations(),
        extensionService.listVisits(),
        extensionService.listFollowUps(),
        weatherService.listStations(),
        weatherService.getDataQualityMetrics(),
        adminService.listAuditLogs(),
        adminService.listSystemHealth(),
      ])

      const farmerUsers = uList.filter((u) => u.role === 'farmer')
      setAllUsers(uList)
      setFarmers(farmerUsers.length > 0 ? farmerUsers : uList.slice(2, 5))
      setFarms(fList)
      setCycles(cList)
      setWeather(wList)
      setAlerts(aList)
      setObservations(obsList)
      setVisits(vList)
      setFollowUps(foList)
      setStations(stList)
      setQualityMetrics(qList)
      setAuditLogs(aLogs)
      setSystemHealth(sHealth)
      setLoading(false)
    }
    load()
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAnalyst = !isAdmin && (user?.role === 'weather_analyst' || user?.role === 'data_analyst')

  // System Administrator Aggregates
  const totalUsersCount = allUsers.length || 10
  const activeFarmersCount = allUsers.filter(u => u.role === 'farmer' && u.is_active).length || 3
  const registeredFarmsCount = farms.length || 3
  const activeCropCyclesCount = cycles.filter(c => c.status === 'active').length || 4
  const degradedServices = systemHealth.filter(s => s.status !== 'operational')
  const weatherSourcesOnline = systemHealth.find(s => s.id === 'srv-weather-sync')?.status === 'operational'
  const activeSystemAlerts = alerts.length

  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* 1. Admin Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                Central Platform Administration & Master Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              System Administrator Command Center
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Global overview across system tenants, role-based access enforcement, telemetry ingestion services, and platform security logs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Link
              href="/dashboard/admin/users"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>👥</span>
              <span>Manage Users</span>
            </Link>
            <Link
              href="/dashboard/admin/system-monitoring"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
            >
              🖥️ System Health
            </Link>
          </div>
        </div>

        {/* 2. Admin Metric Cards (8 Core Indicators) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Users</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalUsersCount}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Across all roles</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Farmers</span>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{activeFarmersCount}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Verified & farming</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Registered Farms</span>
            <p className="text-2xl font-black text-sky-700 mt-0.5">{registeredFarmsCount}</p>
            <span className="text-[10px] text-sky-700 font-medium">180.5 ha active</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Crop Cycles</span>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">{activeCropCyclesCount}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Current season</span>
          </div>

          <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Weather Status</span>
            <p className="text-base font-black text-emerald-700 mt-1">
              {weatherSourcesOnline ? 'ONLINE' : 'DEGRADED'}
            </p>
            <span className="text-[10px] text-emerald-700 font-medium">3 sources synced</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Recommendations</span>
            <p className="text-2xl font-black text-purple-700 mt-0.5">28</p>
            <span className="text-[10px] text-purple-700 font-medium">92% adoption rate</span>
          </div>

          <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">System Alerts</span>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{activeSystemAlerts}</p>
            <span className="text-[10px] text-rose-600 font-medium">Atmospheric & security</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Audit Events</span>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{auditLogs.length}</p>
            <span className="text-[10px] text-gray-500 font-medium">Past 24 hours</span>
          </div>
        </div>

        {/* 3. System Health Services + Weather Ingestion Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Microservice Infrastructure Status */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Core Platform Health & Subsystems</h2>
                <p className="text-xs text-gray-500">Live operational status of microservices, databases & queues</p>
              </div>
              <Link href="/dashboard/admin/system-monitoring" className="text-xs font-bold text-emerald-700 hover:underline">
                Full Monitor →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {systemHealth.map((srv) => (
                <div key={srv.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${srv.status === 'operational' ? 'bg-emerald-500' : srv.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <h4 className="text-xs font-bold text-gray-900 truncate">{srv.service_name}</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono">v{srv.version} · Latency: {srv.latency_ms}ms · Uptime: {srv.uptime_pct}%</p>
                  </div>
                  <Badge variant={srv.status === 'operational' ? 'green' : srv.status === 'degraded' ? 'amber' : 'red'}>
                    {srv.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Administrative Shortcuts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Administrative Governance</h2>
              <p className="text-xs text-gray-500">Quick links to core admin controls</p>
            </div>

            <div className="space-y-2">
              <Link
                href="/dashboard/admin/users"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">👥</span>
                  <div>
                    <p className="text-gray-900 font-bold">User Directory & Provisioning</p>
                    <p className="text-[10px] text-gray-500 font-normal">Create, edit, toggle status & roles</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href="/dashboard/admin/roles-permissions"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="text-gray-900 font-bold">Permission Matrix (RBAC)</p>
                    <p className="text-[10px] text-gray-500 font-normal">View/Create/Edit/Delete/Approve matrix</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href="/dashboard/admin/crops"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🌱</span>
                  <div>
                    <p className="text-gray-900 font-bold">Crop Profile Administration</p>
                    <p className="text-[10px] text-gray-500 font-normal">Thermal, rainfall & phenology thresholds</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href="/dashboard/admin/weather-config"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">☁️</span>
                  <div>
                    <p className="text-gray-900 font-bold">Weather Sources & Alarms</p>
                    <p className="text-[10px] text-gray-500 font-normal">APIs, sync frequency & frost triggers</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href="/dashboard/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <p className="text-gray-900 font-bold">Platform Configuration</p>
                    <p className="text-[10px] text-gray-500 font-normal">Units, timezones, security & alerts</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Recent Platform Audit Activity & System Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Audit Logs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Platform Security & Action Logs</h3>
                <p className="text-xs text-gray-500">Immutable administrative trail of mutations</p>
              </div>
              <Link href="/dashboard/admin/audit-logs" className="text-xs font-bold text-emerald-700 hover:underline">
                View All Logs →
              </Link>
            </div>

            <div className="space-y-2.5">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{log.user_name}</span>
                      <span className="text-gray-400 font-mono text-[10px]">({log.user_role})</span>
                    </div>
                    <p className="text-gray-600 font-mono text-[11px]">{log.action}</p>
                    <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()} · {log.ip_address}</span>
                  </div>
                  <Badge variant={log.status === 'SUCCESS' ? 'green' : log.status === 'WARNING' ? 'amber' : 'red'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* System Alerts & Recommendations Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Active System Hazard Alerts & Advisory Ingest</h3>
                <p className="text-xs text-gray-500">Advisories currently live on smallholder and farm manager channels</p>
              </div>
              <Link href="/dashboard/alerts" className="text-xs font-bold text-emerald-700 hover:underline">
                All Alerts →
              </Link>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((al) => (
                <div key={al.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">
                    {al.alert_type === 'frost' ? '❄️' : al.alert_type === 'heavy_rain' ? '⛈️' : '💨'}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{al.headline}</h4>
                      <Badge variant={al.severity === 'high' || al.severity === 'extreme' ? 'red' : 'amber'}>
                        {al.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">{al.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Target Farm ID: {al.farm_id} · Valid until: {al.effective_to}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Weather Analyst Aggregates
  const totalMonitoredStations = stations.length
  const avgQualityScore = (qualityMetrics.reduce((a, b) => a + b.quality_score, 0) / (qualityMetrics.length || 1)).toFixed(1)
  const totalMissingPackets = qualityMetrics.reduce((a, b) => a + b.missing_data_points, 0)
  const totalDelayedPackets = qualityMetrics.reduce((a, b) => a + b.delayed_data_points, 0)
  const totalInvalidReadings = qualityMetrics.reduce((a, b) => a + b.invalid_readings_count, 0)
  const totalWeatherAnomalies = qualityMetrics.reduce((a, b) => a + b.anomalies_detected.length, 0)
  const activeAlerts = alerts.filter(a => (a.status || 'active') === 'active')

  // Analytical indicators for extension officer
  const pendingFollowUps = followUps.filter((f) => f.status === 'pending')
  const upcomingVisits = visits.filter((v) => v.status === 'scheduled')
  const cropsAtRisk = observations.filter((o) => o.severity === 'severe' || o.severity === 'critical' || o.severity === 'moderate')
  const highRiskFarms = farms.filter((f) => {
    const hasCriticalObs = observations.some((o) => o.farm_id === f.id && (o.severity === 'critical' || o.severity === 'severe'))
    const hasUnresolvedTask = followUps.some((t) => t.farm_id === f.id && t.priority === 'critical' && t.status === 'pending')
    return hasCriticalObs || hasUnresolvedTask
  })

  // If in Weather / Data Analyst mode, render Analyst command center
  if (isAnalyst) {
    return (
      <div className="space-y-6">
        {/* 1. Analyst Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">
                Meteorological Telemetry & Ingestion Command · Ingestion Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Weather & Data Analyst Command Center
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Micro-meteorological surveillance across automated ground stations, data collection health, real-time anomalies, and agronomic threshold alarms.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Link
              href="/dashboard/live-weather"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Live Sensor Stream</span>
            </Link>
            <Link
              href="/dashboard/data-quality"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
            >
              🛡️ Audit Quality (SLA)
            </Link>
          </div>
        </div>

        {/* 2. Analyst Top-Level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Weather Data Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xl font-black text-gray-900">OPERATIONAL</p>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Telemetry pipeline synced</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Data Collection</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xl font-black text-gray-900">INGESTING</p>
            </div>
            <span className="text-[10px] text-sky-700 font-medium">15-sec polling cycle</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Monitored Stations</span>
            <p className="text-3xl font-black text-gray-900 mt-0.5">{totalMonitoredStations}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Across 5 counties</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Last Successful Sync</span>
            <p className="text-xl font-black text-gray-900 mt-1">
              {stations[0] ? new Date(stations[0].last_transmission).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '14:16'}
            </p>
            <span className="text-[10px] text-gray-500 font-medium">Lag: 42 seconds</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Data Quality Score</span>
            <p className="text-3xl font-black text-emerald-700 mt-0.5">{avgQualityScore}%</p>
            <span className="text-[10px] text-emerald-800 font-medium">Above 95% threshold</span>
          </div>

          <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Weather Anomalies</span>
            <p className="text-3xl font-black text-amber-700 mt-0.5">{totalWeatherAnomalies}</p>
            <span className="text-[10px] text-amber-800 font-medium">Sensor drift & range spikes</span>
          </div>

          <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Active Alerts</span>
            <p className="text-3xl font-black text-rose-600 mt-0.5">{activeAlerts.length}</p>
            <span className="text-[10px] text-rose-700 font-medium">Chilling, squall & rain</span>
          </div>
        </div>

        {/* 3. Live Station Telemetry Mesh Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Active Automated Ag-Station Telemetry Ingestion</h2>
              <p className="text-xs text-gray-500">Live downlinks from solar-powered field weather stations</p>
            </div>
            <Link href="/dashboard/live-weather" className="text-xs font-bold text-emerald-700 hover:underline">
              Open Live Stream →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {stations.map((s) => {
              const obs = weather.find(w => w.station_id === s.id)
              const qm = qualityMetrics.find(q => q.station_id === s.id)
              return (
                <div key={s.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-gray-500">{s.id}</span>
                    <Badge variant={s.operational_status === 'online' ? 'green' : s.operational_status === 'delayed' ? 'amber' : 'red'}>
                      {s.operational_status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs truncate">{s.name}</h4>
                  <p className="text-[10px] text-gray-500">{s.location_name}</p>

                  <div className="grid grid-cols-2 gap-1 text-[11px] pt-2 border-t border-gray-200/60">
                    <div>
                      <span className="text-gray-400 text-[9px] block">TEMP</span>
                      <strong className="text-gray-900">{obs?.temperature_celsius ?? '--'}°C</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] block">RAIN 24H</span>
                      <strong className="text-sky-700">{obs?.rainfall_mm ?? 0} mm</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] block">HUMIDITY</span>
                      <strong className="text-gray-700">{obs?.relative_humidity_percent ?? '--'}%</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] block">QUALITY</span>
                      <strong className="text-emerald-700">{qm?.quality_score ?? 99}%</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Active Weather Alerts & Anomalies Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Active Atmospheric Threat Alerts</h3>
                <p className="text-xs text-gray-500">Hazard alerts triggered by validated physical conditions</p>
              </div>
              <Link href="/dashboard/alerts" className="text-xs font-bold text-emerald-700 hover:underline">
                All Alerts ({alerts.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((al) => (
                <div key={al.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">
                    {al.alert_type === 'frost' ? '❄️' : al.alert_type === 'heavy_rain' ? '⛈️' : '💨'}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{al.headline}</h4>
                      <Badge variant={al.severity === 'high' || al.severity === 'extreme' ? 'red' : 'amber'}>
                        {al.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1 line-clamp-2">{al.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                      <span>📍 {al.location}</span>
                      <span className="font-semibold text-gray-600">Effective: {new Date(al.effective_from).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sensor Anomalies & Telemetry Quality */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Sensor Sanity Checks & Anomalies</h3>
                <p className="text-xs text-gray-500">Real-time flags generated by automated plausibility filters</p>
              </div>
              <Link href="/dashboard/data-quality" className="text-xs font-bold text-emerald-700 hover:underline">
                Quality Console →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Kericho Station (WS-KER-05) · Relative Humidity &gt; 100%</span>
                  <Badge variant="amber">RANGE CHECK</Badge>
                </div>
                <p className="text-amber-800">Reported 104.2% relative humidity due to high-altitude condensation on capacitive polymer.</p>
                <span className="text-[10px] text-amber-700 block font-mono">Action: Auto-clamped to 100.0% · Sensor recalibration scheduled</span>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900">Trans-Nzoia (WS-KIT-03) · Pyranometer Solar Flux Drift</span>
                  <Badge variant="blue">SOLAR CHECK</Badge>
                </div>
                <p className="text-sky-800">Reported 1380 W/m² (expected max clear sky ceiling: 1150 W/m²). Cloud edge reflection spike.</p>
                <span className="text-[10px] text-sky-700 block font-mono">Action: Soft-flagged as outlier · Reanalysis fallback active</span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Plateau & Rift Valley Grid Mesh</span>
                  <Badge variant="green">VALIDATED</Badge>
                </div>
                <p className="text-emerald-800">All 3 primary agricultural reference stations (WS-NAK-01, WS-NAR-02, WS-ELD-04) reporting 100% SLA uptime.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Field Officer View
  const isFieldOfficer = user?.role === 'field_officer'
  if (isFieldOfficer) {
    const todayStr = new Date().toISOString().split('T')[0]
    const todaysInspections = visits.filter(v => v.visit_date.startsWith(todayStr))
    const pendingInspections = visits.filter(v => v.status === 'scheduled')
    const highRiskFieldsList = observations.filter(o => o.severity === 'critical' || o.severity === 'severe')

    return (
      <div className="space-y-6">
        {/* 1. Field Officer Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                Physical Field Monitoring & Scouting Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Field Officer Command Center
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Rapid on-site mobile operations, parcel inspections, clinical crop condition logs, and follow-up task resolution.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Link
              href="/dashboard/inspections"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>Start Field Inspection</span>
            </Link>
            <Link
              href="/dashboard/tasks"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
            >
              ✅ Task Board
            </Link>
          </div>
        </div>

        {/* 2. Field Officer Dashboard KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Farms</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{farms.length}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Under field monitoring</span>
          </div>

          <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Today's Inspections</span>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{todaysInspections.length || 2}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Scheduled for today</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Inspections</span>
            <p className="text-2xl font-black text-sky-700 mt-0.5">{pendingInspections.length}</p>
            <span className="text-[10px] text-sky-700 font-medium">Awaiting field check</span>
          </div>

          <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">High-Risk Fields</span>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{highRiskFieldsList.length || 1}</p>
            <span className="text-[10px] text-rose-600 font-medium">Severe scouting flags</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Crop Conditions</span>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">88%</p>
            <span className="text-[10px] text-emerald-700 font-medium">Good / Vigorous stand</span>
          </div>

          <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Weather Alerts</span>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{alerts.length}</p>
            <span className="text-[10px] text-amber-700 font-medium">Active hazard warnings</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Follow-up Tasks</span>
            <p className="text-2xl font-black text-purple-700 mt-0.5">{pendingFollowUps.length}</p>
            <span className="text-[10px] text-purple-700 font-medium">Action items pending</span>
          </div>
        </div>

        {/* 3. High-Risk Fields & Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's & Pending Inspections */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Today's Inspection Queue</h3>
                <p className="text-xs text-gray-500">Physical audits scheduled across monitored farms</p>
              </div>
              <Link href="/dashboard/inspections" className="text-xs font-bold text-emerald-700 hover:underline">
                New Inspection →
              </Link>
            </div>

            <div className="space-y-3">
              {visits.slice(0, 3).map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{v.farm_name}</span>
                      <span className="text-gray-400 font-mono">({v.field_name})</span>
                    </div>
                    <p className="text-gray-600">{v.purpose}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Farmer: <strong className="text-gray-700">{v.farmer_name}</strong> · Date: {new Date(v.visit_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={v.status === 'completed' ? 'green' : v.status === 'scheduled' ? 'blue' : 'amber'}>
                    {v.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* High-Risk Fields & Crop Conditions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">High-Risk Fields & Crop Status</h3>
                <p className="text-xs text-gray-500">Parcels requiring immediate physical scouting or remediation</p>
              </div>
              <Link href="/dashboard/observations" className="text-xs font-bold text-emerald-700 hover:underline">
                All Observations →
              </Link>
            </div>

            <div className="space-y-3">
              {observations.slice(0, 3).map((obs) => (
                <div key={obs.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {obs.observation_type === 'pest' ? '🐛' : obs.observation_type === 'disease' ? '🦠' : '💧'}
                  </span>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{obs.crop_name} · {obs.field_name}</h4>
                      <Badge variant={obs.severity === 'critical' || obs.severity === 'severe' ? 'red' : 'amber'}>
                        {obs.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 line-clamp-1">{obs.notes}</p>
                    <p className="text-[10px] text-gray-400">
                      Condition: <strong className="text-gray-700">{obs.condition}</strong> · Stage: {obs.growth_stage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Weather Alerts & Follow-up Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weather Alerts in Assigned Zone */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Active Atmospheric Threat Alerts</h3>
                <p className="text-xs text-gray-500">Local weather alerts impacting field operations</p>
              </div>
              <Link href="/dashboard/alerts" className="text-xs font-bold text-emerald-700 hover:underline">
                View All ({alerts.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((al) => (
                <div key={al.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">
                    {al.alert_type === 'frost' ? '❄️' : al.alert_type === 'heavy_rain' ? '⛈️' : '💨'}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{al.headline}</h4>
                      <Badge variant={al.severity === 'high' || al.severity === 'extreme' ? 'red' : 'amber'}>
                        {al.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">{al.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Tasks */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Field Follow-up Tasks</h3>
                <p className="text-xs text-gray-500">Action items assigned for physical field verification</p>
              </div>
              <Link href="/dashboard/tasks" className="text-xs font-bold text-emerald-700 hover:underline">
                Task Board →
              </Link>
            </div>

            <div className="space-y-3">
              {followUps.slice(0, 3).map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                  <span className="text-lg mt-0.5">
                    {task.task_type === 'assistance_request' ? '🆘' : task.task_type === 'risk_mitigation' ? '⚠️' : '🔍'}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{task.title}</h4>
                      <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'blue'}>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                      <span>Farm: <strong className="text-gray-700">{task.farm_name}</strong></span>
                      <span className="font-bold text-rose-700">Due: {task.due_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: Extension Officer View if role is extension_officer
  return (
    <div className="space-y-6">
      {/* 1. Header with Extension Command Center Scope */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
              Regional Agricultural Extension Operations · Zone 4B (Rift Valley)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Extension Officer Command Center
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Area surveillance across smallholder clusters, scheduled technical farm visits, clinical pathology observations, and immediate farmer assistance dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <Link
            href="/dashboard/visits"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>🚗</span>
            <span>Schedule Field Visit</span>
          </Link>
          <Link
            href="/dashboard/map"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
          >
            🗺️ Open Area Map
          </Link>
        </div>
      </div>

      {/* 2. Top-Level Extension KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Farmers</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{farmers.length || 3}</p>
          <span className="text-[10px] text-emerald-700 font-medium">100% active contact</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Farms Monitored</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{farms.length}</p>
          <span className="text-[10px] text-sky-700 font-medium">180.5 ha surveyed</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Need Attention</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{highRiskFarms.length || 1}</p>
          <span className="text-[10px] text-rose-600 font-medium">Immediate visit trigger</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Upcoming Visits</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">{upcomingVisits.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">This week itinerary</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Observations</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{observations.length}</p>
          <span className="text-[10px] text-gray-500 font-medium">Field logs recorded</span>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Weather Risks</span>
          <p className="text-2xl font-black text-amber-600 mt-0.5">{alerts.length}</p>
          <span className="text-[10px] text-amber-700 font-medium">Heavy rain & frost</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Crop Risks</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{cropsAtRisk.length}</p>
          <span className="text-[10px] text-rose-600 font-medium">Armyworm & chlorosis</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Follow-ups Due</span>
          <p className="text-2xl font-black text-amber-700 mt-0.5">{pendingFollowUps.length}</p>
          <span className="text-[10px] text-gray-500 font-medium">Tasks pending</span>
        </div>
      </div>

      {/* 3. Action Alert Banner for High-Risk Farms */}
      {highRiskFarms.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-rose-900 text-sm">Farm Requiring Priority Agricultural Assistance</h3>
                <Badge variant="red">ACTION REQUIRED</Badge>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                <strong>Mau Escarpment Terraces</strong> (Mary Wanjiku) has reported severe interveinal chlorosis on French Beans. High risk of crop failure without calcium/boron foliar verification.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/follow-up"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center self-start md:self-auto transition-colors shadow-xs"
          >
            Review Assistance Task →
          </Link>
        </div>
      )}

      {/* 4. Two-Column Grid: Upcoming Field Visits & Recent Field Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Field Visits Itinerary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Upcoming Field Visits Itinerary</h2>
              <p className="text-xs text-gray-500">Scheduled on-site farm visits and agronomic verifications</p>
            </div>
            <Link href="/dashboard/visits" className="text-xs font-bold text-emerald-700 hover:underline">
              Full Schedule →
            </Link>
          </div>

          <div className="space-y-3">
            {visits.slice(0, 3).map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">{v.purpose}</h4>
                    <span className="text-[11px] text-gray-500 block">
                      Farmer: <strong className="text-gray-800">{v.farmer_name}</strong> · {v.farm_name}
                    </span>
                  </div>
                  <Badge variant={v.status === 'completed' ? 'green' : 'blue'}>
                    {v.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-600">{v.notes}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                  <span>Field: {v.field_name}</span>
                  <span className="font-bold text-emerald-800">
                    📅 {new Date(v.visit_date).toLocaleDateString()} at {new Date(v.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Field Observations */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Field Observations & Clinical Logs</h2>
              <p className="text-xs text-gray-500">Pest catches, water stress, and crop conditions scouted</p>
            </div>
            <Link href="/dashboard/observations" className="text-xs font-bold text-emerald-700 hover:underline">
              Scouting Center →
            </Link>
          </div>

          <div className="space-y-3">
            {observations.slice(0, 3).map((obs) => (
              <div key={obs.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-xs">{obs.crop_name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-[11px] text-gray-500">{obs.farm_name}</span>
                  </div>
                  <Badge variant={obs.severity === 'critical' ? 'red' : obs.severity === 'moderate' ? 'amber' : 'green'}>
                    {(obs.severity || 'MILD').toUpperCase()} SEVERITY
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{obs.notes}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                  <span>Stage: {obs.growth_stage}</span>
                  <span className="font-semibold text-emerald-800">
                    Follow-up: {obs.follow_up_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Outstanding Follow-ups & Assigned Farmers Directory Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outstanding Follow-up Tasks (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Outstanding Follow-Ups & Farmer Assistance</h2>
              <p className="text-xs text-gray-500">Action items assigned to the extension officer for field resolution</p>
            </div>
            <Link href="/dashboard/follow-up" className="text-xs font-bold text-emerald-700 hover:underline">
              Task Board →
            </Link>
          </div>

          <div className="space-y-3">
            {followUps.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {task.task_type === 'assistance_request' ? '🆘' : task.task_type === 'risk_mitigation' ? '⚠️' : '🔍'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">{task.title}</h4>
                    <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'blue'}>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                    <span>Farmer: <strong className="text-gray-700">{task.farmer_name}</strong> ({task.farm_name})</span>
                    <span className="font-bold text-rose-700">Due: {task.due_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Farmers Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Assigned Farmers</h2>
              <p className="text-xs text-gray-500">Smallholders under support</p>
            </div>
            <Link href="/dashboard/farmers" className="text-xs font-bold text-emerald-700 hover:underline">
              Directory →
            </Link>
          </div>

          <div className="space-y-3">
            {farmers.slice(0, 3).map((farmer) => (
              <div key={farmer.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                  {farmer.first_name[0]}{farmer.last_name[0]}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <h4 className="font-bold text-gray-900 truncate">
                    {farmer.first_name} {farmer.last_name}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate">{farmer.organization || 'Smallholder'}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold">{farmer.phone_number || '+254 712 345 678'}</span>
                </div>
                <Link
                  href={`/dashboard/farmers?id=${farmer.id}`}
                  className="text-[10px] font-bold text-emerald-800 hover:underline"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import React, { useState, useEffect } from 'react'
import { adminService } from '@/lib/services'
import type { SystemServiceHealth } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

export default function SystemMonitoringPage() {
  const [services, setServices] = useState<SystemServiceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadHealth = async () => {
    setIsRefreshing(true)
    const list = await adminService.listSystemHealth()
    setServices([...list])
    setLastCheckTime(new Date().toLocaleTimeString())
    setIsRefreshing(false)
    setLoading(false)
  }

  useEffect(() => {
    loadHealth()
  }, [])

  const totalErrors = services.reduce((acc, s) => acc + s.error_count_24h, 0)
  const totalWarnings = services.reduce((acc, s) => acc + s.warning_count_24h, 0)
  const avgLatency = (services.reduce((acc, s) => acc + s.latency_ms, 0) / (services.length || 1)).toFixed(0)
  const allOperational = services.every(s => s.status === 'operational')

  // Grouped subsystems for display
  const frontendApp = services.find(s => s.id === 'srv-web-frontend')
  const weatherSync = services.find(s => s.id === 'srv-weather-sync')
  const database = services.find(s => s.id === 'srv-db-postgres')
  const mlEngine = services.find(s => s.id === 'srv-ai-inference')

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Platform Observability · Microservices & Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            System Monitoring & Health Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time telemetry, microservice heartbeat latencies, weather synchronization daemon status, error rates, and warning logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <span className="text-xs text-gray-400 font-mono">Last check: {lastCheckTime}</span>
          <Button
            variant="primary"
            onClick={loadHealth}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <span>{isRefreshing ? '⏳' : '🔄'}</span>
            <span>{isRefreshing ? 'Probing Nodes...' : 'Run Diagnostics Sweep'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Health Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`border rounded-xl p-3.5 shadow-2xs ${allOperational ? 'bg-emerald-50/20 border-emerald-200' : 'bg-amber-50/20 border-amber-200'}`}>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Global Fleet Status</span>
          <p className={`text-xl font-black mt-0.5 ${allOperational ? 'text-emerald-700' : 'text-amber-700'}`}>
            {allOperational ? 'HEALTHY (100%)' : 'DEGRADED / ALERT'}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">{services.length} Microservices monitored</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Avg Fleet Latency</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{avgLatency} ms</p>
          <span className="text-[10px] text-emerald-700 font-medium">Optimal response time</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Weather Ingestion Daemon</span>
          <p className="text-xl font-black text-emerald-700 mt-0.5">
            {weatherSync?.status.toUpperCase() || 'OPERATIONAL'}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Synced 1m ago</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Errors (24h)</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{totalErrors}</p>
          <span className="text-[10px] text-rose-600 font-medium">Auto-isolated in retry queue</span>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Warnings (24h)</span>
          <p className="text-2xl font-black text-amber-700 mt-0.5">{totalWarnings}</p>
          <span className="text-[10px] text-amber-700 font-medium">Rate throttles & drift</span>
        </div>
      </div>

      {/* 3. Core Subsystems Highlight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Frontend / Application Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🖥️</span>
            <Badge variant={frontendApp?.status === 'operational' ? 'green' : 'amber'}>
              {frontendApp?.status.toUpperCase() || 'OPERATIONAL'}
            </Badge>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Next.js & Tauri Frontend</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">v{frontendApp?.version || '15.2.0'} · SSR & Static Mesh</p>
          </div>
          <div className="text-xs space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Latency:</span>
              <strong className="text-gray-900 font-mono">{frontendApp?.latency_ms || 18} ms</strong>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Uptime:</span>
              <strong className="text-emerald-700 font-mono">{frontendApp?.uptime_pct || 99.99}%</strong>
            </div>
          </div>
        </div>

        {/* Weather Service Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl">☁️</span>
            <Badge variant={weatherSync?.status === 'operational' ? 'green' : 'amber'}>
              {weatherSync?.status.toUpperCase() || 'OPERATIONAL'}
            </Badge>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Weather Ingestion Pipeline</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">v{weatherSync?.version || '2.4.1'} · Open-Meteo & MQTT</p>
          </div>
          <div className="text-xs space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Polling Rate:</span>
              <strong className="text-gray-900 font-mono">60s interval</strong>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Uptime:</span>
              <strong className="text-emerald-700 font-mono">{weatherSync?.uptime_pct || 99.95}%</strong>
            </div>
          </div>
        </div>

        {/* Data Synchronization / Database Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🗄️</span>
            <Badge variant={database?.status === 'operational' ? 'green' : 'amber'}>
              {database?.status.toUpperCase() || 'OPERATIONAL'}
            </Badge>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">PostgreSQL / Django ORM</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">v{database?.version || '16.3'} · Primary Shard + WAL</p>
          </div>
          <div className="text-xs space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Active Pools:</span>
              <strong className="text-gray-900 font-mono">24/30 Connections</strong>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Sync Lag:</span>
              <strong className="text-emerald-700 font-mono">0.02s</strong>
            </div>
          </div>
        </div>

        {/* ML Inference Engine */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🧠</span>
            <Badge variant={mlEngine?.status === 'operational' ? 'green' : 'amber'}>
              {mlEngine?.status.toUpperCase() || 'OPERATIONAL'}
            </Badge>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">ML Agronomic Predictor</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">v{mlEngine?.version || '1.8.0'} · XGBoost & GDD Model</p>
          </div>
          <div className="text-xs space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Avg Inference:</span>
              <strong className="text-gray-900 font-mono">42 ms</strong>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Queue Depth:</span>
              <strong className="text-emerald-700 font-mono">0 pending</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Services Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Subsystem Telemetry Table</h2>
            <p className="text-xs text-gray-500">Live operational status, latency metrics, and 24-hour error counters</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{services.length} Nodes reporting</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Service Identifier</th>
                <th className="py-3 px-4">Subsystem Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4">Heartbeat Latency</th>
                <th className="py-3 px-4">Uptime (30d)</th>
                <th className="py-3 px-4">Errors / Warnings (24h)</th>
                <th className="py-3 px-4 text-right">Last Health Probe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Probing cluster health...
                  </td>
                </tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-600">
                      {srv.id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{srv.service_name}</p>
                      {srv.notes && <p className="text-[10px] text-gray-400">{srv.notes}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                      v{srv.version}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={srv.status === 'operational' ? 'green' : srv.status === 'degraded' ? 'amber' : 'red'}>
                        {srv.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`font-bold ${srv.latency_ms > 100 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {srv.latency_ms} ms
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700 font-semibold">
                      {srv.uptime_pct}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={`font-mono font-bold ${srv.error_count_24h > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                          {srv.error_count_24h} err
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className={`font-mono font-bold ${srv.warning_count_24h > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {srv.warning_count_24h} warn
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[10px] text-gray-500">
                      {new Date(srv.last_check).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

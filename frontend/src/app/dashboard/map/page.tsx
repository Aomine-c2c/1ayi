"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { farmService, cropService, weatherService, extensionService, fieldService } from '@/lib/services'
import type { Farm, CropCycle, WeatherAlert, FieldVisit, FieldObservation } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function AreaMapOverviewPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [visits, setVisits] = useState<FieldVisit[]>([])
  const [observations, setObservations] = useState<FieldObservation[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [activeLayer, setActiveLayer] = useState<'all' | 'risk' | 'crops' | 'weather' | 'visits'>('all')

  useEffect(() => {
    async function load() {
      const [fList, cList, aList, vList, obsList] = await Promise.all([
        farmService.listFarms(),
        cropService.listCycles(),
        weatherService.getAlerts(),
        extensionService.listVisits(),
        fieldService.listObservations(),
      ])
      setFarms(fList)
      setCycles(cList)
      setAlerts(aList)
      setVisits(vList)
      setObservations(obsList)
      if (fList.length > 0) setSelectedFarm(fList[0])
    }
    load()
  }, [])

  // Derive risk for each farm
  const getFarmRisk = (farmId: number) => {
    const hasCriticalObs = observations.some((o) => o.farm_id === farmId && (o.severity === 'critical' || o.severity === 'severe'))
    if (hasCriticalObs) return { level: 'High Risk', color: 'bg-rose-500 text-white border-rose-600', badge: 'red' }
    const hasModObs = observations.some((o) => o.farm_id === farmId && o.severity === 'moderate')
    if (hasModObs) return { level: 'Medium Risk', color: 'bg-amber-500 text-white border-amber-600', badge: 'amber' }
    return { level: 'Normal / Low Risk', color: 'bg-emerald-600 text-white border-emerald-700', badge: 'green' }
  }

  const farmCycles = cycles.filter((c) => c.farm === selectedFarm?.id)
  const farmVisits = visits.filter((v) => v.farm_id === selectedFarm?.id)
  const farmObs = observations.filter((o) => o.farm_id === selectedFarm?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Geographical Area Map</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Regional Agricultural Area Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Geospatial surveillance showing monitored farms, crop types, risk tiers, micro-climate weather alerts, and scheduled field visits.
          </p>
        </div>

        {/* Drill-down Navigation Trail Reminder */}
        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-[11px] font-semibold text-emerald-800 hidden md:block">
          Trail: Regional Overview → Farmer → Farm → Field → Crop Cycle → Recommendation
        </div>
      </div>

      {/* Layer Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-bold uppercase text-[10px] pr-1">Map Layers:</span>
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeLayer === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Holdings
          </button>
          <button
            onClick={() => setActiveLayer('risk')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeLayer === 'risk' ? 'bg-rose-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Risk Levels
          </button>
          <button
            onClick={() => setActiveLayer('crops')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeLayer === 'crops' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Crop Types
          </button>
          <button
            onClick={() => setActiveLayer('weather')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeLayer === 'weather' ? 'bg-sky-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weather Alerts
          </button>
          <button
            onClick={() => setActiveLayer('visits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeLayer === 'visits' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Field Visits
          </button>
        </div>
      </div>

      {/* Map Interactive Canvas & Drill-down Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map Canvas Representation */}
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 min-h-[460px] relative overflow-hidden flex flex-col justify-between text-white shadow-md">
          {/* Top Map HUD */}
          <div className="flex items-center justify-between z-10">
            <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Rift Valley Agro-Ecological Grid · Coordinates -0.303S, 36.080E</span>
            </div>

            <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300">
              Active Holdings: <strong>{farms.length}</strong>
            </div>
          </div>

          {/* Graphical Stylized Grid with Farm Pins */}
          <div className="my-8 relative h-64 border border-slate-800 rounded-2xl bg-slate-950/40 p-4">
            {/* Background Contours */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Farm Pins placed across coordinate canvas */}
            {farms.map((f, i) => {
              const risk = getFarmRisk(f.id)
              const isSelected = selectedFarm?.id === f.id
              const positions = [
                { top: '25%', left: '30%' },
                { top: '65%', left: '55%' },
                { top: '40%', left: '75%' },
              ]
              const pos = positions[i % positions.length]

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFarm(f)}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-transform hover:scale-110"
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-1.5 ${risk.color} ${
                      isSelected ? 'ring-4 ring-white/50 scale-105' : ''
                    }`}
                  >
                    <span>📍</span>
                    <span>{f.name}</span>
                    <span className="text-[10px] opacity-80">({f.area_ha}ha)</span>
                  </div>

                  {/* Pin Pulse Anchor */}
                  <div className="w-2.5 h-2.5 rounded-full bg-white mx-auto mt-1 animate-ping" />
                </div>
              )
            })}
          </div>

          {/* Map Legend */}
          <div className="bg-slate-800/80 backdrop-blur p-3 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300 z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Normal / Healthy</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Moderate Warning</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>High Risk (Intervention Needed)</span>
              </span>
            </div>
            <span className="text-slate-400">Click any parcel pin to inspect drill-down trail</span>
          </div>
        </div>

        {/* Right Column: Drill-down Trail Inspector */}
        <div className="lg:col-span-4">
          {selectedFarm ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs sticky top-24">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={getFarmRisk(selectedFarm.id).badge as any}>
                    {getFarmRisk(selectedFarm.id).level.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-gray-500">{selectedFarm.area_ha} ha</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2">{selectedFarm.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">📍 {selectedFarm.location_name || 'Rift Valley'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Soil: <strong className="text-gray-800">{selectedFarm.soil_type}</strong> · Climate: {selectedFarm.climate_zone}
                </p>
              </div>

              {/* Drill-down Section 1: Farmer Attribution */}
              <div className="pt-3 border-t border-gray-100 text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">1. Assigned Smallholder</span>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-900 block">{selectedFarm.owner_username === 'farmer_otieno' ? 'Peter Otieno' : 'David Kiprono'}</span>
                    <span className="text-[10px] text-gray-500">Cooperative Smallholder</span>
                  </div>
                  <Link
                    href={`/dashboard/farmers?id=${selectedFarm.owner}`}
                    className="text-[10px] font-bold text-emerald-800 hover:underline"
                  >
                    View Farmer Profile →
                  </Link>
                </div>
              </div>

              {/* Drill-down Section 2: Active Crops */}
              <div className="pt-2 border-t border-gray-100 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">2. Crop Cycles & Phenology</span>
                {farmCycles.length === 0 ? (
                  <p className="text-gray-400 text-[11px]">No active cycles registered.</p>
                ) : (
                  farmCycles.map((c) => (
                    <div key={c.id} className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900">{c.crop_name}</span>
                        <span className="text-[10px] text-gray-500 block">{c.variety_name}</span>
                      </div>
                      <Badge variant="green">{c.current_stage.toUpperCase()}</Badge>
                    </div>
                  ))
                )}
              </div>

              {/* Drill-down Section 3: Scheduled Visits & Observations */}
              <div className="pt-2 border-t border-gray-100 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">3. Field Visits & Scouting</span>
                <p className="text-gray-600 text-[11px]">
                  Visits Logged: <strong className="text-gray-800">{farmVisits.length}</strong> · Observations: <strong className="text-gray-800">{farmObs.length}</strong>
                </p>
                {farmObs.length > 0 && (
                  <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-950 text-[11px]">
                    <strong>Recent Observation:</strong> {farmObs[0].notes}
                  </div>
                )}
              </div>

              {/* Quick Action Navigation Link */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                <Link
                  href="/dashboard/visits"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Schedule Visit Here
                </Link>
                <Link
                  href="/dashboard/recommendations"
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  Advisories →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              Select a farm parcel on the map.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

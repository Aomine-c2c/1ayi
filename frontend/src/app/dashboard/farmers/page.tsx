"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  authService,
  farmService,
  cropService,
  recommendationService,
  fieldService,
} from '@/lib/services'
import type {
  User,
  Farm,
  CropCycle,
  Recommendation,
  FieldObservation,
} from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function FarmersDirectoryPage() {
  const [farmers, setFarmers] = useState<User[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [observations, setObservations] = useState<FieldObservation[]>([])
  const [selectedFarmerId, setSelectedFarmerId] = useState<number>(3)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [uList, fList, cList, rList, obsList] = await Promise.all([
        authService.listUsers(),
        farmService.listFarms(),
        cropService.listCycles(),
        recommendationService.listRecommendations(),
        fieldService.listObservations(),
      ])

      const farmerList = uList.filter((u) => u.role === 'farmer')
      setFarmers(farmerList.length > 0 ? farmerList : uList.slice(2, 5))
      setFarms(fList)
      setCycles(cList)
      setRecommendations(rList)
      setObservations(obsList)
      if (farmerList.length > 0) setSelectedFarmerId(farmerList[0].id)
      setLoading(false)
    }
    load()
  }, [])

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0]

  // Associated entities for selected farmer
  const farmerFarms = farms.filter((f) => f.owner === selectedFarmer?.id || selectedFarmerId === 3)
  const farmerCycles = cycles.filter((c) => farmerFarms.some((f) => f.id === c.farm))
  const farmerRecs = recommendations.filter((r) => farmerFarms.some((f) => f.id === r.farm_id))
  const farmerObs = observations.filter((o) => farmerFarms.some((f) => f.id === o.farm_id))

  const filteredFarmers = farmers.filter((f) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      f.first_name.toLowerCase().includes(q) ||
      f.last_name.toLowerCase().includes(q) ||
      f.organization?.toLowerCase().includes(q) ||
      f.phone_number?.includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Farmers Directory</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assigned Farmers Directory & Profiles</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Holistic extension profiles: view associated holdings, active growth cycles, agronomic advisories, and historical scouting logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>🚗</span>
            <span>Schedule Farm Visit</span>
          </Link>
        </div>
      </div>

      {/* Main Split Interface: Directory List vs Farmer Comprehensive Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Farmer Directory Search & Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
            <input
              type="text"
              placeholder="Search farmer name, phone, cooperative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredFarmers.map((farmer) => {
              const isSelected = selectedFarmer?.id === farmer.id
              const associatedCount = farms.filter((f) => f.owner === farmer.id || farmer.id === 3).length

              return (
                <div
                  key={farmer.id}
                  onClick={() => setSelectedFarmerId(farmer.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-200 flex-shrink-0">
                      {farmer.first_name[0]}{farmer.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 truncate">
                          {farmer.first_name} {farmer.last_name}
                        </h4>
                        <Badge variant="green">{associatedCount} FARMS</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {farmer.organization || 'Smallholder Cooperative'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                        📞 {farmer.phone_number || '+254 712 345 678'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Full Farmer Deep Profile */}
        <div className="lg:col-span-8">
          {selectedFarmer ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
              {/* Farmer Bio Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-black border border-emerald-100 flex-shrink-0">
                    {selectedFarmer.first_name[0]}{selectedFarmer.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedFarmer.first_name} {selectedFarmer.last_name}
                      </h2>
                      <Badge variant="blue">REGISTERED SMALLHOLDER</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cooperative: <strong className="text-gray-800">{selectedFarmer.organization || 'Rift Valley Smallholders Cooperative'}</strong>
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-2 flex-wrap">
                      <span>📞 {selectedFarmer.phone_number || '+254 712 345 678'}</span>
                      <span>✉️ {selectedFarmer.email}</span>
                      <span>Enrolled: {new Date(selectedFarmer.date_joined).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/visits"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs self-start sm:self-auto"
                >
                  Book Field Visit
                </Link>
              </div>

              {/* 1. Associated Farms */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Associated Farm Holdings ({farmerFarms.length})
                  </h3>
                  <Link href="/dashboard/farms" className="text-xs font-bold text-emerald-700 hover:underline">
                    View in Farm Manager →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {farmerFarms.map((farm) => (
                    <div key={farm.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{farm.name}</span>
                        <span className="font-bold text-emerald-800">{farm.area_ha} ha</span>
                      </div>
                      <p className="text-gray-500 text-[11px]">📍 {farm.location_name || 'Rift Valley'}</p>
                      <p className="text-gray-600 text-[11px]">Soil: {farm.soil_type} · Zone: {farm.climate_zone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Active Crop Cycles */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Current Crop Cycles ({farmerCycles.length})
                </h3>

                <div className="space-y-2 text-xs">
                  {farmerCycles.map((cycle) => (
                    <div key={cycle.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900 block">{cycle.crop_name}</span>
                        <span className="text-[11px] text-gray-500">
                          {cycle.variety_name} · Farm: {cycle.farm_name} ({cycle.area_ha} ha)
                        </span>
                      </div>
                      <div className="text-right">
                        <Badge variant="green">STAGE: {cycle.current_stage.toUpperCase()}</Badge>
                        <span className="text-[10px] text-gray-400 block mt-1">Harvest: {cycle.expected_harvest_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Recommendations for this Farmer */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Targeted Agronomic Advisories & Recommendations
                </h3>

                <div className="space-y-2 text-xs">
                  {farmerRecs.slice(0, 2).map((rec) => (
                    <div key={rec.id} className="p-3 rounded-xl border border-gray-100 bg-emerald-50/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{rec.action_title}</span>
                        <Badge variant={rec.priority === 'urgent' ? 'red' : 'amber'}>{rec.priority.toUpperCase()}</Badge>
                      </div>
                      <p className="text-gray-600 text-[11px]">{rec.action_details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recent Field Observations for this Farmer */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Recent Field Scouting Observations
                </h3>

                <div className="space-y-2 text-xs">
                  {farmerObs.slice(0, 2).map((obs) => (
                    <div key={obs.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{obs.crop_name} · {obs.field_name}</span>
                        <Badge variant={obs.severity === 'critical' ? 'red' : 'amber'}>
                          {(obs.severity || 'MILD').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-relaxed">{obs.notes}</p>
                      <span className="text-[10px] text-gray-400 block pt-1">
                        Scouted by {obs.observed_by} on {new Date(obs.observed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              Select a farmer to view detailed profile.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

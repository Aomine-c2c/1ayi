"use client"
import React, { useState, useEffect } from 'react'
import { cropService, farmService, fieldService } from '@/lib/services'
import type { CropCycle, Farm, Field, Crop } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

const FULL_LIFECYCLE_STAGES = [
  { id: 'planned', label: 'Planned', desc: 'Pre-season budget & seed allocated', color: 'bg-gray-100 text-gray-700' },
  { id: 'preparing', label: 'Preparing', desc: 'Tillage, harrowing & basal fertilizer', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'planted', label: 'Planted', desc: 'Seed emergence and stand establishment', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'growing', label: 'Growing', desc: 'Vegetative leaf and stem extension', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'flowering', label: 'Flowering', desc: 'Anthesis, pollination & tassel emergence', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { id: 'maturing', label: 'Maturing', desc: 'Grain filling & tuber dry matter buildup', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'harvesting', label: 'Harvesting', desc: 'Active combines / manual crop harvesting', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { id: 'completed', label: 'Completed', desc: 'Crop collected, weighed & warehoused', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
]

export default function FarmManagerCyclesPage() {
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null)
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false)

  // New Cycle Form State
  const [farmId, setFarmId] = useState<number>(1)
  const [cropId, setCropId] = useState<number>(1)
  const [variety, setVariety] = useState('')
  const [stage, setStage] = useState('planned')
  const [plantDate, setPlantDate] = useState('2025-10-01')
  const [harvestDate, setHarvestDate] = useState('2026-03-15')
  const [area, setArea] = useState<number>(15)

  useEffect(() => {
    async function load() {
      const [cList, fList, fieldList, crList] = await Promise.all([
        cropService.listCycles(),
        farmService.listFarms(),
        fieldService.listFieldsByFarm(),
        cropService.listCrops(),
      ])
      setCycles(cList)
      setFarms(fList)
      setFields(fieldList)
      setCrops(crList)
      if (cList.length > 0) setSelectedCycle(cList[0])
    }
    load()
  }, [])

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault()
    const farmObj = farms.find((f) => f.id === farmId)
    const cropObj = crops.find((c) => c.id === cropId)

    const created: CropCycle = {
      id: Date.now(),
      farm: farmId,
      farm_name: farmObj?.name || 'Estate Farm',
      crop: cropId,
      crop_name: cropObj?.name || 'Crop',
      variety_name: variety || 'Commercial Cultivar',
      planting_date: plantDate,
      expected_harvest_date: harvestDate,
      current_stage: stage as any,
      status: 'active',
      area_ha: area,
      notes: 'New production cycle initialized in manager suite.',
    }
    setCycles([created, ...cycles])
    setSelectedCycle(created)
    setIsNewCycleOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Crop Lifecycle Management</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Crop Lifecycle & Operations Timeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Full 8-stage lifecycle tracking from pre-season planning and soil prep to active harvest.
          </p>
        </div>
        <button
          onClick={() => setIsNewCycleOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Schedule New Cycle</span>
        </button>
      </div>

      {/* Complete Lifecycle Timeline Stepper Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Enterprise 8-Stage Lifecycle Architecture</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {FULL_LIFECYCLE_STAGES.map((s, idx) => (
            <div key={s.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 text-left flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 block">Stage {idx + 1}</span>
                <span className="font-bold text-gray-900 text-xs block mt-0.5">{s.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle List Feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cycles.map((c) => {
          const isSelected = selectedCycle?.id === c.id
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCycle(c)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">🌱</span>
                <Badge variant={c.status === 'completed' ? 'green' : 'blue'}>
                  {c.current_stage.toUpperCase()}
                </Badge>
              </div>

              <h3 className="font-bold text-gray-900 text-sm mt-1">{c.crop_name}</h3>
              <p className="text-xs text-gray-500">{c.variety_name || 'Standard Cultivar'}</p>
              <p className="text-xs text-gray-700 font-medium mt-1">📍 {c.farm_name}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">{c.area_ha || 14} ha</span>
                <span className="font-bold text-emerald-800">Harvest: {c.expected_harvest_date || 'Q4'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Cycle Visual Timeline */}
      {selectedCycle && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Active Cycle Schedule
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                {selectedCycle.crop_name} ({selectedCycle.variety_name})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Planted: <span className="font-semibold text-gray-800">{selectedCycle.planting_date}</span> · Expected Harvest: <span className="font-semibold text-emerald-800">{selectedCycle.expected_harvest_date}</span>
              </p>
            </div>
            <Badge variant="green" size="md">
              AREA: {selectedCycle.area_ha || 14.5} HECTARES
            </Badge>
          </div>

          {/* Timeline Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>Planting Window</span>
              <span className="text-emerald-700 font-bold">Current: {selectedCycle.current_stage.toUpperCase()}</span>
              <span>Harvest Window</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: '65%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{selectedCycle.planting_date}</span>
              <span>65% through growth cycle</span>
              <span>{selectedCycle.expected_harvest_date}</span>
            </div>
          </div>

          {selectedCycle.notes && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
              <span className="font-bold text-gray-900 block mb-1">Agronomy Protocol & Notes</span>
              {selectedCycle.notes}
            </div>
          )}
        </div>
      )}

      {/* New Cycle Modal */}
      <Modal isOpen={isNewCycleOpen} onClose={() => setIsNewCycleOpen(false)} title="Initialize Crop Cycle">
        <form onSubmit={handleCreateCycle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Estate Farm</label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Crop</label>
            <select
              value={cropId}
              onChange={(e) => setCropId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cultivar / Seed Variety</label>
            <input
              type="text"
              required
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. Certified Seed G2"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Planting Date</label>
              <input
                type="date"
                required
                value={plantDate}
                onChange={(e) => setPlantDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Planted Area (ha)</label>
              <input
                type="number"
                step="0.1"
                required
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Starting Lifecycle Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FULL_LIFECYCLE_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewCycleOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Initialize Cycle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

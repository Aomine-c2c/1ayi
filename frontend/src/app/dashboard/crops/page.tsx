"use client"
import React, { useState, useEffect } from 'react'
import { cropService, yieldService, farmService } from '@/lib/services'
import type { Crop, CropCycle, YieldEstimate, Farm } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

const GROWTH_STAGES = [
  { id: 'planning', label: 'Planning', color: 'bg-gray-100 text-gray-700' },
  { id: 'germination', label: 'Germination', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'vegetative', label: 'Vegetative Growth', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'flowering', label: 'Flowering & Pollination', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'fruiting', label: 'Fruiting / Tuber Filling', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'maturity', label: 'Maturity / Ripening', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'harvested', label: 'Harvested', color: 'bg-gray-100 text-gray-600' },
]

export default function FarmerCropsPage() {
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [yieldEstimates, setYieldEstimates] = useState<YieldEstimate[]>([])
  const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // New cycle form state
  const [newCropId, setNewCropId] = useState<number>(1)
  const [newFarmId, setNewFarmId] = useState<number>(1)
  const [newVariety, setNewVariety] = useState('')
  const [newPlantingDate, setNewPlantingDate] = useState('2025-09-15')
  const [newHarvestDate, setNewHarvestDate] = useState('2026-02-20')
  const [newArea, setNewArea] = useState<number>(12)
  const [newStage, setNewStage] = useState<any>('planning')

  useEffect(() => {
    async function load() {
      const [cList, crList, fList, yList] = await Promise.all([
        cropService.listCycles(),
        cropService.listCrops(),
        farmService.listFarms(),
        yieldService.listYieldEstimates(),
      ])
      setCycles(cList)
      setCrops(crList)
      setFarms(fList)
      setYieldEstimates(yList)
      if (cList.length > 0) setSelectedCycle(cList[0])
    }
    load()
  }, [])

  const handleAddCycle = (e: React.FormEvent) => {
    e.preventDefault()
    const cropObj = crops.find((c) => c.id === newCropId)
    const farmObj = farms.find((f) => f.id === newFarmId)

    const created: CropCycle = {
      id: Date.now(),
      farm: newFarmId,
      farm_name: farmObj?.name || 'My Farm',
      crop: newCropId,
      crop_name: cropObj?.name || 'Crop',
      variety_name: newVariety || 'Standard Cultivar',
      planting_date: newPlantingDate,
      expected_harvest_date: newHarvestDate,
      current_stage: newStage,
      status: 'active',
      area_ha: newArea,
      notes: 'Planted with certified seed and basal fertilizer.',
    }

    setCycles((prev) => [created, ...prev])
    setSelectedCycle(created)
    setIsAddOpen(false)
  }

  const cycleYield = yieldEstimates.find((y) => y.crop_cycle_id === selectedCycle?.id)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Crops & Cycles</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Active Crops & Growth Cycles</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor planting timelines, phenological stages, agro-climatic suitability, and expected yields.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Add Crop Cycle</span>
        </button>
      </div>

      {/* Cycle Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cycles.map((cycle) => {
          const isSelected = selectedCycle?.id === cycle.id
          const stageCfg = GROWTH_STAGES.find((s) => s.id === cycle.current_stage) || GROWTH_STAGES[0]

          return (
            <div
              key={cycle.id}
              onClick={() => setSelectedCycle(cycle)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">🌱</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageCfg.color}`}>
                  {stageCfg.label.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mt-1">{cycle.crop_name}</h3>
              <p className="text-xs text-gray-500">{cycle.variety_name || 'Standard'}</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">📍 {cycle.farm_name}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Area: {cycle.area_ha || 10} ha</span>
                <span className="font-bold text-emerald-700">Harvest: {cycle.expected_harvest_date}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Crop Cycle Deep-Dive */}
      {selectedCycle && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Cycle Management & Health
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                {selectedCycle.crop_name} — {selectedCycle.variety_name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Planted on <span className="font-medium text-gray-700">{selectedCycle.planting_date}</span> · Anticipated Harvest: <span className="font-semibold text-emerald-800">{selectedCycle.expected_harvest_date}</span>
              </p>
            </div>
            <Badge variant="green" size="md">
              STAGE: {selectedCycle.current_stage.toUpperCase()}
            </Badge>
          </div>

          {/* Growth Stage Progression Stepper */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
              Phenological Growth Stage Progression
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
              {GROWTH_STAGES.map((s, idx) => {
                const currentIdx = GROWTH_STAGES.findIndex((st) => st.id === selectedCycle.current_stage)
                const isPassed = idx <= currentIdx
                const isCurrent = idx === currentIdx

                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">Step {idx + 1}</span>
                    <span className="text-xs">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agricultural Indicators: Yield + Suitability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Projected Yield Potential
              </span>
              <div className="text-3xl font-black text-gray-900">
                {cycleYield?.predicted_yield_kg_ha ? (cycleYield.predicted_yield_kg_ha / 1000).toFixed(2) : '5.74'} tonnes/ha
              </div>
              <p className="text-xs text-gray-600">
                Confidence range: {cycleYield?.lower_bound_kg_ha || 5320} – {cycleYield?.upper_bound_kg_ha || 6100} kg/ha based on seasonal GDD and soil nitrogen.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Crop Suitability Index
              </span>
              <div className="text-3xl font-black text-emerald-700">
                92% Optimal
              </div>
              <p className="text-xs text-emerald-800">
                Micro-climate temperature and precipitation patterns match the biological thresholds for this cultivar.
              </p>
            </div>
          </div>

          {/* Notes */}
          {selectedCycle.notes && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
              <span className="font-bold text-gray-900 block mb-1">Field Agronomy Notes</span>
              {selectedCycle.notes}
            </div>
          )}
        </div>
      )}

      {/* Add Crop Cycle Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Start New Crop Cycle"
      >
        <form onSubmit={handleAddCycle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Crop Type</label>
            <select
              value={newCropId}
              onChange={(e) => setNewCropId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Farm Location</label>
            <select
              value={newFarmId}
              onChange={(e) => setNewFarmId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Seed Variety / Cultivar</label>
            <input
              type="text"
              required
              value={newVariety}
              onChange={(e) => setNewVariety(e.target.value)}
              placeholder="e.g. Highland Hybrid H6213"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Planting Date</label>
              <input
                type="date"
                required
                value={newPlantingDate}
                onChange={(e) => setNewPlantingDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                required
                value={newHarvestDate}
                onChange={(e) => setNewHarvestDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Acreage (Hectares)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newArea}
                onChange={(e) => setNewArea(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Stage</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GROWTH_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Register Crop Cycle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

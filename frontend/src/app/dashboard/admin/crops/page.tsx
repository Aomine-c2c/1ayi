"use client"
import React, { useState, useEffect } from 'react'
import { cropService } from '@/lib/services'
import type { Crop, CropStage } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

const CROP_CATEGORIES = [
  'All Categories',
  'Cereals & Grains',
  'Legumes & Pulses',
  'Solanaceae & Vegetables',
  'Horticulture & Fruits',
  'Cash & Commercial Crops',
]

export default function CropProfilesAdminPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<Crop>>({
    name: '',
    variety: '',
    category: 'Cereals & Grains',
    description: '',
    optimal_temperature_min: 18,
    optimal_temperature_max: 28,
    optimal_rainfall_min: 600,
    optimal_rainfall_max: 1200,
    growing_period_days_min: 90,
    growing_period_days_max: 140,
    min_water_requirement_mm: 500,
    expected_yield_min: 3.5,
    expected_yield_max: 6.0,
    yield_unit: 'tonnes/ha',
    stages: [
      { name: 'Emergence', duration_days: 10, gdd_required: 120, water_requirement_mm: 40 },
      { name: 'Vegetative', duration_days: 35, gdd_required: 420, water_requirement_mm: 180 },
      { name: 'Flowering / Tasseling', duration_days: 25, gdd_required: 380, water_requirement_mm: 220 },
      { name: 'Grain Filling', duration_days: 30, gdd_required: 410, water_requirement_mm: 190 },
      { name: 'Physiological Maturity', duration_days: 15, gdd_required: 180, water_requirement_mm: 40 },
    ],
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCrops = async () => {
    setLoading(true)
    const list = await cropService.listCrops()
    setCrops([...list])
    setLoading(false)
  }

  useEffect(() => {
    loadCrops()
  }, [])

  const filteredCrops = crops.filter(c => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.variety && c.variety.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    const matchesCategory =
      categoryFilter === 'All Categories' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      variety: '',
      category: 'Cereals & Grains',
      description: '',
      optimal_temperature_min: 18,
      optimal_temperature_max: 28,
      optimal_rainfall_min: 600,
      optimal_rainfall_max: 1200,
      growing_period_days_min: 90,
      growing_period_days_max: 140,
      min_water_requirement_mm: 500,
      expected_yield_min: 3.5,
      expected_yield_max: 6.0,
      yield_unit: 'tonnes/ha',
      stages: [
        { name: 'Emergence', duration_days: 10, gdd_required: 120, water_requirement_mm: 40 },
        { name: 'Vegetative', duration_days: 35, gdd_required: 420, water_requirement_mm: 180 },
        { name: 'Flowering / Tasseling', duration_days: 25, gdd_required: 380, water_requirement_mm: 220 },
        { name: 'Grain Filling', duration_days: 30, gdd_required: 410, water_requirement_mm: 190 },
        { name: 'Physiological Maturity', duration_days: 15, gdd_required: 180, water_requirement_mm: 40 },
      ],
    })
    setIsEditing(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (crop: Crop, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setFormData({
      ...crop,
      stages: crop.stages ? [...crop.stages] : [
        { name: 'Emergence', duration_days: 10, gdd_required: 120, water_requirement_mm: 40 },
        { name: 'Vegetative', duration_days: 35, gdd_required: 420, water_requirement_mm: 180 },
        { name: 'Flowering', duration_days: 25, gdd_required: 380, water_requirement_mm: 220 },
        { name: 'Maturity', duration_days: 20, gdd_required: 200, water_requirement_mm: 50 },
      ],
    })
    setIsEditing(true)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setFormError('Crop name is mandatory.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      if (isEditing && formData.id) {
        const updated = await cropService.updateCrop(formData.id, formData)
        if (updated) {
          setCrops(prev => prev.map(c => (c.id === updated.id ? { ...c, ...updated } : c)))
          if (selectedCrop && selectedCrop.id === updated.id) {
            setSelectedCrop({ ...selectedCrop, ...updated })
          }
        }
      } else {
        const created = await cropService.createCrop(formData)
        setCrops([created, ...crops])
      }
      setIsModalOpen(false)
    } catch (err) {
      setFormError('Failed to save crop configuration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (cropId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you wish to delete this crop profile from the ag-catalogue?')) {
      await cropService.deleteCrop(cropId)
      setCrops(prev => prev.filter(c => c.id !== cropId))
      if (selectedCrop && selectedCrop.id === cropId) {
        setIsDetailDrawerOpen(false)
      }
    }
  }

  const handleStageChange = (index: number, field: keyof CropStage, value: any) => {
    const updatedStages = [...(formData.stages || [])]
    updatedStages[index] = {
      ...updatedStages[index],
      [field]: value,
    }
    setFormData({ ...formData, stages: updatedStages })
  }

  const handleAddStage = () => {
    const updatedStages = [
      ...(formData.stages || []),
      { name: 'New Stage', duration_days: 15, gdd_required: 150, water_requirement_mm: 60 },
    ]
    setFormData({ ...formData, stages: updatedStages })
  }

  const handleRemoveStage = (index: number) => {
    const updatedStages = (formData.stages || []).filter((_, i) => i !== index)
    setFormData({ ...formData, stages: updatedStages })
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Agronomic Intelligence · Master Catalogue
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Crop Profile Administration
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Define crop phenology stages, physiological temperature/rainfall envelopes, growing cycle days, and expected yield ranges.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <span>➕</span>
            <span>Add New Crop</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crops by name, variety (e.g. H6213, Katumani, Rosecoco)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:border-emerald-500 w-full md:w-auto"
        >
          {CROP_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 3. Crop Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-gray-400">
            Loading crop profiles...
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-gray-400">
            No crop profiles found matching your search.
          </div>
        ) : (
          filteredCrops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => {
                setSelectedCrop(crop)
                setIsDetailDrawerOpen(true)
              }}
              className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 hover:border-emerald-500 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                      {crop.category || 'General Crop'}
                    </span>
                    <h3 className="text-base font-black text-gray-900 mt-0.5">
                      {crop.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Variety: <strong className="text-gray-700">{crop.variety || 'Standard'}</strong>
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-base flex items-center justify-center border border-emerald-200 shrink-0">
                    🌱
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">
                  {crop.description || 'Comprehensive agro-climatic profile calibrated for Kenyan agricultural agro-ecological zones.'}
                </p>

                {/* Key Agronomic Thresholds */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-gray-100">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[9px] font-bold block uppercase">Opt. Temperature</span>
                    <span className="font-bold text-gray-900">
                      {crop.optimal_temperature_min}°C – {crop.optimal_temperature_max}°C
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[9px] font-bold block uppercase">Rainfall Range</span>
                    <span className="font-bold text-sky-700">
                      {crop.optimal_rainfall_min} – {crop.optimal_rainfall_max} mm
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[9px] font-bold block uppercase">Growing Period</span>
                    <span className="font-bold text-gray-900">
                      {crop.growing_period_days_min} – {crop.growing_period_days_max} Days
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[9px] font-bold block uppercase">Expected Yield</span>
                    <span className="font-bold text-emerald-700">
                      {crop.expected_yield_min} – {crop.expected_yield_max} {crop.yield_unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                <span className="text-[11px] text-gray-400">
                  {crop.stages?.length || 5} Phenology Stages
                </span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(crop, e)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(crop.id, e)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Crop Details Drawer */}
      {isDetailDrawerOpen && selectedCrop && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center border border-emerald-200">
                    🌱
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selectedCrop.name}</h3>
                    <span className="text-xs text-gray-500 font-medium">{selectedCrop.variety} · {selectedCrop.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Overview & Description */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase text-[10px] text-gray-400 tracking-wider">
                  Botanical Description & Agronomy
                </h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  {selectedCrop.description || 'No detailed botanical overview entered.'}
                </p>
              </div>

              {/* Requirement Envelopes */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase text-[10px] text-gray-400 tracking-wider">
                  Biophysical Requirements
                </h4>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Optimal Temperature Range</span>
                    <strong className="text-gray-900">{selectedCrop.optimal_temperature_min}°C – {selectedCrop.optimal_temperature_max}°C</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Optimal Rainfall Range</span>
                    <strong className="text-sky-700">{selectedCrop.optimal_rainfall_min} mm – {selectedCrop.optimal_rainfall_max} mm</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Min. Water Requirement</span>
                    <strong className="text-sky-700">{selectedCrop.min_water_requirement_mm} mm</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Total Growing Period</span>
                    <strong className="text-gray-900">{selectedCrop.growing_period_days_min} – {selectedCrop.growing_period_days_max} Days</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Expected Yield Range</span>
                    <strong className="text-emerald-700">{selectedCrop.expected_yield_min} – {selectedCrop.expected_yield_max} {selectedCrop.yield_unit}</strong>
                  </div>
                </div>
              </div>

              {/* Growth Stages Timeline */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase text-[10px] text-gray-400 tracking-wider">
                  Calibrated Phenological Growth Stages ({selectedCrop.stages?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(selectedCrop.stages || []).map((stage, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{stage.name}</p>
                          <p className="text-[10px] text-gray-400">Duration: {stage.duration_days} days</p>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="text-gray-900 font-mono font-bold block">{stage.gdd_required} GDD</span>
                        <span className="text-sky-700 font-mono text-[10px]">{stage.water_requirement_mm} mm H2O</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setIsDetailDrawerOpen(false)
                  handleOpenEdit(selectedCrop)
                }}
                className="flex-1 text-xs font-bold py-2.5"
              >
                Edit Crop Profile
              </Button>
              <button
                onClick={(e) => handleDelete(selectedCrop.id, e)}
                className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add / Edit Crop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isEditing ? 'Edit Crop Profile' : 'Add New Crop Profile'}
                </h3>
                <p className="text-xs text-gray-500">Configure agronomic ranges, climate thresholds & growth stages</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* General Information */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Crop Common Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Maize, Sorghum, Common Bean"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Variety / Cultivar</label>
                  <input
                    type="text"
                    value={formData.variety || ''}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. H6213"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={formData.category || 'Cereals & Grains'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {CROP_CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Yield Unit</label>
                  <input
                    type="text"
                    value={formData.yield_unit || 'tonnes/ha'}
                    onChange={(e) => setFormData({ ...formData, yield_unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. tonnes/ha or bags/acre"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Agronomic Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Describe physiological adaptation, soil preference, and drought tolerance..."
                />
              </div>

              {/* Biophysical Thresholds */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px] text-gray-500">
                  Biophysical & Climate Envelopes
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Optimal Temperature Min (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.optimal_temperature_min ?? 18}
                      onChange={(e) => setFormData({ ...formData, optimal_temperature_min: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Optimal Temperature Max (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.optimal_temperature_max ?? 28}
                      onChange={(e) => setFormData({ ...formData, optimal_temperature_max: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Optimal Rainfall Min (mm)</label>
                    <input
                      type="number"
                      value={formData.optimal_rainfall_min ?? 600}
                      onChange={(e) => setFormData({ ...formData, optimal_rainfall_min: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Optimal Rainfall Max (mm)</label>
                    <input
                      type="number"
                      value={formData.optimal_rainfall_max ?? 1200}
                      onChange={(e) => setFormData({ ...formData, optimal_rainfall_max: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Growing Days (Min)</label>
                    <input
                      type="number"
                      value={formData.growing_period_days_min ?? 90}
                      onChange={(e) => setFormData({ ...formData, growing_period_days_min: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Growing Days (Max)</label>
                    <input
                      type="number"
                      value={formData.growing_period_days_max ?? 140}
                      onChange={(e) => setFormData({ ...formData, growing_period_days_max: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Min Water (mm)</label>
                    <input
                      type="number"
                      value={formData.min_water_requirement_mm ?? 500}
                      onChange={(e) => setFormData({ ...formData, min_water_requirement_mm: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Expected Yield (Min)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.expected_yield_min ?? 3.5}
                      onChange={(e) => setFormData({ ...formData, expected_yield_min: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Expected Yield (Max)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.expected_yield_max ?? 6.0}
                      onChange={(e) => setFormData({ ...formData, expected_yield_max: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phenological Growth Stages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px] text-gray-500">
                    Phenological Growth Stages
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    + Add Growth Stage
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.stages || []).map((st, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2">
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                        placeholder="Stage Name"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      />
                      <input
                        type="number"
                        value={st.duration_days}
                        onChange={(e) => handleStageChange(idx, 'duration_days', parseInt(e.target.value))}
                        placeholder="Days"
                        title="Duration in days"
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      />
                      <input
                        type="number"
                        value={st.gdd_required}
                        onChange={(e) => handleStageChange(idx, 'gdd_required', parseInt(e.target.value))}
                        placeholder="GDD"
                        title="Growing Degree Days"
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                        title="Remove stage"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? 'Saving Profile...' : isEditing ? 'Save Changes' : 'Create Crop Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

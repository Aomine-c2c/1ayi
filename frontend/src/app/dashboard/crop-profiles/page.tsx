"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { cropService } from '@/lib/services'
import type { Crop, CropProfile } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function CropProfilesPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCropId, setSelectedCropId] = useState<number>(1)
  const [profile, setProfile] = useState<CropProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const list = await cropService.listCrops()
      setCrops(list)
      if (list.length > 0) {
        const p = await cropService.getCropProfile(list[0].id)
        setProfile(p || null)
        setSelectedCropId(list[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSelectCrop = async (id: number) => {
    setSelectedCropId(id)
    const p = await cropService.getCropProfile(id)
    setProfile(p || null)
  }

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crop-intelligence" className="hover:text-emerald-700">Crop Intelligence</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Crop Profiles</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Comprehensive Crop Profiles</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Deep-dive agronomic specifications: climate tolerance, phenological stages, nutrient requirements (NPK), and pathological risk factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/suitability"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
          >
            Run Suitability Test
          </Link>
        </div>
      </div>

      {/* Crop Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {crops.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelectCrop(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedCropId === c.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{c.category === 'cereal' ? '🌽' : c.category === 'tuber' ? '🥔' : '🫘'}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {selectedCrop && (
        <div className="space-y-6">
          {/* Hero Banner with General Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl border border-emerald-100 flex-shrink-0">
                  {selectedCrop.category === 'cereal' ? '🌽' : selectedCrop.category === 'tuber' ? '🥔' : '🫘'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="green">{selectedCrop.category.toUpperCase()}</Badge>
                    <Badge variant="blue">COMMERCIAL CULTIVAR</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mt-1">{selectedCrop.name}</h2>
                  <p className="text-xs italic text-gray-500">{selectedCrop.scientific_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Growing Period</span>
                  <span className="text-base font-black text-gray-900 mt-0.5 block">
                    {selectedCrop.growing_days_typical || 150} days
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Typical Yield</span>
                  <span className="text-base font-black text-emerald-700 mt-0.5 block">
                    {((selectedCrop.expected_yield_typical_kg_ha || 5500) / 1000).toFixed(1)} t/ha
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Optimal Temp</span>
                  <span className="text-base font-black text-gray-900 mt-0.5 block">
                    {selectedCrop.optimal_temp_min || 18}° – {selectedCrop.optimal_temp_max || 27}°C
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Water Requirement</span>
                  <span className="text-base font-black text-sky-700 mt-0.5 block">
                    {profile?.water_requirement_mm || selectedCrop.rainfall_optimum_mm || 700} mm
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4 leading-relaxed max-w-4xl">
              {selectedCrop.description} Well suited for high-altitude volcanic soils with continuous moisture management during critical reproductive stages.
            </p>
          </div>

          {/* Detailed Agronomic Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Climate & Rainfall Requirements */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-lg">🌤️</span>
                <h3 className="font-bold text-gray-900 text-sm">Climate & Rainfall Envelope</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block">Temperature Cardinal Points</span>
                  <p className="text-gray-600 mt-1">
                    Base thermal threshold: <span className="font-semibold text-gray-900">10°C</span>. Optimal growth bracket: <span className="font-semibold text-gray-900">{selectedCrop.optimal_temp_min || 18}°C to {selectedCrop.optimal_temp_max || 27}°C</span>. Severe heat stress threshold: <span className="font-semibold text-rose-700">&gt;34°C</span>.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block">Precipitation & Water Balance</span>
                  <p className="text-gray-600 mt-1">
                    Annual rainfall requirement: <span className="font-semibold text-gray-900">{selectedCrop.rainfall_optimum_mm || 750}mm</span> evenly distributed. Sensitivity to waterlogging is high during seedling and silking.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block">Photoperiod & Radiation</span>
                  <p className="text-gray-600 mt-1">
                    Requires 6.5 – 8.0 daily sunshine hours. Radiation use efficiency averages 1.45 g/MJ during full canopy cover.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Critical Growth Stages & Suitability Factors */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-lg">📈</span>
                <h3 className="font-bold text-gray-900 text-sm">Growth Stages & Sensitivity</h3>
              </div>

              <div className="space-y-2.5">
                {(profile?.critical_growth_stages || ['Germination & Emergence', 'Vegetative Stem Elongation', 'Flowering & Pollination', 'Maturity & Drying']).map((st, i) => (
                  <div key={st} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 block">Stage {i + 1}</span>
                      <span className="font-bold text-gray-900">{st}</span>
                    </div>
                    <Badge variant={i === 1 ? 'amber' : 'green'}>
                      {i === 1 ? 'CRITICAL MOISTURE' : 'NORMAL'}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Soil Suitability Factors</span>
                <p className="text-gray-600 leading-relaxed">
                  Deep clay loam or sandy loam with minimum rooting depth of 90cm. Optimal soil pH range between 5.8 and 6.8.
                </p>
              </div>
            </div>

            {/* 3. Nutrient Requirements & Biological Risk Factors */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-lg">🧪</span>
                <h3 className="font-bold text-gray-900 text-sm">Nutrients & Risk Factors</h3>
              </div>

              {/* N-P-K Table */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Nutrient Intake Balance (Target: {((selectedCrop.expected_yield_typical_kg_ha || 5500)/1000).toFixed(1)} t/ha)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-gray-400 font-bold block">Nitrogen (N)</span>
                    <span className="font-black text-gray-900">{profile?.nutrient_requirements.nitrogen_kg_ha || 120} kg/ha</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-gray-400 font-bold block">Phosphorus (P)</span>
                    <span className="font-black text-gray-900">{profile?.nutrient_requirements.phosphorus_kg_ha || 60} kg/ha</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-gray-400 font-bold block">Potassium (K)</span>
                    <span className="font-black text-gray-900">{profile?.nutrient_requirements.potassium_kg_ha || 40} kg/ha</span>
                  </div>
                </div>
              </div>

              {/* Common Pests & Diseases */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">Key Insect Pests</span>
                  <div className="space-y-1">
                    {(profile?.common_pests || ['Fall Armyworm', 'Stalk Borer']).map((p) => (
                      <div key={p} className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-lg text-rose-900 font-medium text-[11px]">
                        🪲 {p}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Prevalent Pathologies</span>
                  <div className="space-y-1">
                    {(profile?.common_diseases || ['Northern Corn Leaf Blight', 'Maize Lethal Necrosis']).map((d) => (
                      <div key={d} className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-900 font-medium text-[11px]">
                        🦠 {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

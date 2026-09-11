"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { cropService } from '@/lib/services'
import type { Crop } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function CropIntelligenceCataloguePage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await cropService.listCrops()
      setCrops(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['all', 'cereal', 'legume', 'tuber', 'vegetable', 'cash_crop']

  const filteredCrops = crops.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(c.scientific_name && c.scientific_name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Crop Intelligence</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agricultural Crop Catalogue & Taxonomy</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Bioclimatic requirements, phenological durations, thermal thresholds, water requirements, and expected yield ranges.
          </p>
        </div>

        <Link
          href="/dashboard/crop-profiles"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>📖</span>
          <span>View Deep Profiles</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-gray-400 font-bold uppercase text-[10px] pr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Classes' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search crop or scientific name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Crop Catalogue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCrops.map((crop) => (
          <div
            key={crop.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:border-emerald-500 hover:shadow-xs transition-all space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="green">{crop.category.toUpperCase()}</Badge>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{crop.name}</h3>
                  <p className="text-xs italic text-gray-500">{crop.scientific_name}</p>
                </div>
                <span className="text-3xl">
                  {crop.category === 'cereal' ? '🌽' : crop.category === 'tuber' ? '🥔' : crop.category === 'legume' ? '🫘' : '🥬'}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                {crop.description}
              </p>

              {/* Requirement Metrics Matrix */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Growing Period</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {crop.growing_days_typical || crop.growing_days_max || 120} days
                  </span>
                  <span className="text-[10px] text-gray-500">Seed to physiologic maturity</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Thermal Band</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {crop.optimal_temp_min || 18}°C – {crop.optimal_temp_max || 28}°C
                  </span>
                  <span className="text-[10px] text-gray-500">Optimal cardinal temp</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Rainfall / Water</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {crop.rainfall_optimum_mm || 650} mm
                  </span>
                  <span className="text-[10px] text-gray-500">Seasonal evapotranspiration</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Expected Yield</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {((crop.expected_yield_typical_kg_ha || 5000) / 1000).toFixed(1)} t/ha
                  </span>
                  <span className="text-[10px] text-gray-500">High-management baseline</span>
                </div>
              </div>

              {/* Suitable Conditions and Stages */}
              <div className="mt-3.5 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Suitable Conditions</span>
                  <span className="text-gray-700 font-medium">
                    {crop.planting_season || 'Well-drained loams, pH 5.8 - 6.8, elevation 1,500m - 2,200m ASL'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Growth Stages</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Germination', 'Vegetative', 'Flowering', 'Maturity'].map((st) => (
                      <span key={st} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-semibold rounded-md">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <Link
                href={`/dashboard/crop-profiles`}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Examine Agronomic Profile</span>
                <span>→</span>
              </Link>
              <Link
                href="/dashboard/suitability"
                className="text-[11px] text-gray-500 hover:text-gray-900"
              >
                Check Suitability
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

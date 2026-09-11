"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { yieldService, farmService, cropService } from '@/lib/services'
import type { YieldEstimate, Farm, Crop } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function AgronomistYieldIntelligencePage() {
  const [estimates, setEstimates] = useState<YieldEstimate[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all')
  const [comparisonMode, setComparisonMode] = useState<'crop' | 'farm'>('crop')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [est, fList, crList] = await Promise.all([
        yieldService.listYieldEstimates(),
        farmService.listFarms(),
        cropService.listCrops(),
      ])
      setEstimates(est)
      setFarms(fList)
      setCrops(crList)
      setLoading(false)
    }
    load()
  }, [])

  const filteredEstimates = estimates.filter((e) => {
    if (selectedCropFilter !== 'all' && !e.crop_name.toLowerCase().includes(selectedCropFilter.toLowerCase())) return false
    return true
  })

  // Historical yield comparison data (seasonal benchmarks)
  const seasonalTrends = [
    { season: '2023 Long Rains', maize: 5.1, potato: 17.2, beans: 7.4, rain_mm: 680 },
    { season: '2023 Short Rains', maize: 4.8, potato: 16.5, beans: 7.1, rain_mm: 520 },
    { season: '2024 Long Rains', maize: 5.6, potato: 18.9, beans: 8.0, rain_mm: 740 },
    { season: '2024 Short Rains', maize: 5.2, potato: 17.8, beans: 7.6, rain_mm: 610 },
    { season: '2025 Projected', maize: 5.74, potato: 19.2, beans: 8.35, rain_mm: 750 },
  ]

  // Farm-by-farm comparison
  const farmComparisons = [
    { farm: 'Green Ridge Highland Estate', elevation: '1,920m', soil: 'Volcanic Loam', area: '145 ha', avg_yield: '6.2 t/ha', efficiency: 94 },
    { farm: 'Mau Escarpment Terraces', elevation: '2,150m', soil: 'Clay Loam', area: '82 ha', avg_yield: '5.8 t/ha', efficiency: 89 },
    { farm: 'Kitale Seed Research Station', elevation: '1,890m', soil: 'Sandy Clay', area: '50 ha', avg_yield: '6.7 t/ha', efficiency: 97 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Yield Intelligence</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Predictive Yield Intelligence Suite</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Biophysical ensemble crop forecasting, confidence bounds, historical multi-season benchmarks, and farm productivity comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/reports"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
          >
            Export Yield Dossier
          </Link>
        </div>
      </div>

      {/* Yield Forecast Cards with Confidence Intervals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEstimates.map((est) => {
          const predictedTonnes = (est.predicted_yield_kg_ha / 1000).toFixed(2)
          const lowerTonnes = (est.lower_bound_kg_ha / 1000).toFixed(2)
          const upperTonnes = (est.upper_bound_kg_ha / 1000).toFixed(2)
          const confidencePct = Math.round(est.confidence_level * 100)

          return (
            <div
              key={est.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <Badge variant="green">ACTIVE ENSEMBLE FORECAST</Badge>
                  <h3 className="text-lg font-bold text-gray-900 mt-1.5">{est.crop_name}</h3>
                  <p className="text-xs text-gray-500">
                    Farm Holding: <strong className="text-gray-800">{est.farm_name}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Predicted Yield</span>
                  <span className="text-3xl font-black text-emerald-700">{predictedTonnes}</span>
                  <span className="text-xs text-gray-500 font-medium"> tonnes/ha</span>
                </div>
              </div>

              {/* Confidence Interval Visualization */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium text-gray-700">
                  <span>Confidence Level: <strong className="text-emerald-800">{confidencePct}%</strong></span>
                  <span>Range: <strong>{lowerTonnes} – {upperTonnes} t/ha</strong></span>
                </div>

                <div className="relative pt-2 pb-1">
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-200 h-full" style={{ width: '20%' }} />
                    <div className="bg-emerald-600 h-full" style={{ width: `${confidencePct - 30}%` }} />
                    <div className="bg-emerald-200 h-full" style={{ width: '20%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Lower 95%: {lowerTonnes} t</span>
                    <span className="font-bold text-emerald-800">Mode: {predictedTonnes} t</span>
                    <span>Upper 95%: {upperTonnes} t</span>
                  </div>
                </div>
              </div>

              {/* Factor Contribution Attribution */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">Weather Impact</span>
                  <span className="font-bold text-gray-900">{est.factors_analyzed.weather_impact_pct}%</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">Soil Chemistry</span>
                  <span className="font-bold text-gray-900">{est.factors_analyzed.soil_impact_pct}%</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">Management</span>
                  <span className="font-bold text-gray-900">{est.factors_analyzed.management_impact_pct}%</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 italic">
                Model: {est.prediction_model} · Calibrated with MODIS NDVI + High Resolution Rainfall
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Toggle Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Comparative Yield Analysis</h2>
            <p className="text-xs text-gray-500">Benchmark across historical seasons or evaluate estate farm productivity</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setComparisonMode('crop')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                comparisonMode === 'crop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Seasonal & Crop Comparison
            </button>
            <button
              onClick={() => setComparisonMode('farm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                comparisonMode === 'farm' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Farm Holding Comparison
            </button>
          </div>
        </div>

        {comparisonMode === 'crop' ? (
          /* Seasonal Historical Trend Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Crop Season</th>
                  <th className="py-2.5 px-3">Rainfall (mm)</th>
                  <th className="py-2.5 px-3">Maize (t/ha)</th>
                  <th className="py-2.5 px-3">Potato (t/ha)</th>
                  <th className="py-2.5 px-3">French Beans (t/ha)</th>
                  <th className="py-2.5 px-3">Trend Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {seasonalTrends.map((st, i) => (
                  <tr key={st.season} className={i === seasonalTrends.length - 1 ? 'bg-emerald-50/40 font-bold' : 'hover:bg-gray-50'}>
                    <td className="py-3 px-3 text-gray-900 font-semibold">{st.season}</td>
                    <td className="py-3 px-3 text-gray-600">{st.rain_mm} mm</td>
                    <td className="py-3 px-3 text-emerald-800 font-bold">{st.maize} t/ha</td>
                    <td className="py-3 px-3 text-emerald-800 font-bold">{st.potato} t/ha</td>
                    <td className="py-3 px-3 text-emerald-800 font-bold">{st.beans} t/ha</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span>↗</span>
                        <span>+{((st.maize - 4.8) * 10).toFixed(0)}% vs Base</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Farm Holding Benchmark */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {farmComparisons.map((fc) => (
              <div key={fc.farm} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm">{fc.farm}</h4>
                  <Badge variant="green">{fc.efficiency}% EFFICIENCY</Badge>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>Elevation: <strong className="text-gray-800">{fc.elevation}</strong></p>
                  <p>Soil Type: <strong className="text-gray-800">{fc.soil}</strong></p>
                  <p>Cultivated Area: <strong className="text-gray-800">{fc.area}</strong></p>
                  <p className="pt-2 text-base font-bold text-emerald-800">
                    Average Output: {fc.avg_yield}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

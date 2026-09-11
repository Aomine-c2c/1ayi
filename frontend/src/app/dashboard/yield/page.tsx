"use client"
import React, { useState, useEffect } from 'react'
import { yieldService, cropService } from '@/lib/services'
import type { YieldEstimate, CropCycle } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function FarmerYieldPage() {
  const [estimates, setEstimates] = useState<YieldEstimate[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])

  useEffect(() => {
    async function load() {
      const [est, cyc] = await Promise.all([
        yieldService.listYieldEstimates(),
        cropService.listCycles(),
      ])
      setEstimates(est)
      setCycles(cyc)
    }
    load()
  }, [])

  const topEstimate = estimates[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Yield & Production</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Yield Estimates & Production Planning</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Expected harvest volumes, historical comparison, and field production benchmarks.
        </p>
      </div>

      {/* Yield Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Total Projected Farm Output
          </span>
          <div className="text-4xl sm:text-5xl font-black mt-1">
            {topEstimate ? (topEstimate.predicted_yield_kg_ha / 1000).toFixed(1) : '5.7'}
            <span className="text-xl font-normal text-emerald-200"> tonnes/hectare</span>
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            Estimated for {topEstimate?.crop_name || 'White Maize H6213'} on {topEstimate?.farm_name || 'Green Ridge Estate'}
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-xs text-emerald-50 text-right self-start sm:self-auto">
          <span className="block font-bold text-white text-base">+12.4%</span>
          <span className="text-emerald-200">Above last season harvest</span>
        </div>
      </div>

      {/* Yield Breakdown By Crop */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Current Season Yield Forecast by Crop</h2>
        <div className="space-y-4 pt-1">
          {estimates.map((est) => (
            <div key={est.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{est.crop_name}</h3>
                  <p className="text-xs text-gray-500">{est.farm_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-700">
                    {(est.predicted_yield_kg_ha / 1000).toFixed(2)} tonnes/ha
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Range: {(est.lower_bound_kg_ha / 1000).toFixed(1)} – {(est.upper_bound_kg_ha / 1000).toFixed(1)} t/ha
                  </p>
                </div>
              </div>

              {/* Contributing factors */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Soil Nutrients</span>
                  <span className="font-bold text-emerald-700">{est.factors_analyzed.soil_impact_pct}%</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Rainfall Match</span>
                  <span className="font-bold text-sky-700">{est.factors_analyzed.weather_impact_pct}%</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Field Management</span>
                  <span className="font-bold text-amber-700">{est.factors_analyzed.management_impact_pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Historical Season Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase">
                <th className="pb-3">Season</th>
                <th className="pb-3">Crop Cultivar</th>
                <th className="pb-3">Planted Area</th>
                <th className="pb-3 text-right">Actual Harvest (t/ha)</th>
                <th className="pb-3 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-3 font-semibold text-gray-900">2025 Short Rains</td>
                <td className="py-3">Shangi Potato (Certified G2)</td>
                <td className="py-3">28.0 ha</td>
                <td className="py-3 text-right font-bold text-emerald-700">19.2 t/ha</td>
                <td className="py-3 text-right">
                  <Badge variant="green">+3.7% Target</Badge>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-gray-900">2024 Long Rains</td>
                <td className="py-3">White Maize (H6213)</td>
                <td className="py-3">14.5 ha</td>
                <td className="py-3 text-right font-bold text-gray-900">5.2 t/ha</td>
                <td className="py-3 text-right">
                  <Badge variant="blue">Met Average</Badge>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-gray-900">2024 Short Rains</td>
                <td className="py-3">French Beans (Export Grade)</td>
                <td className="py-3">18.0 ha</td>
                <td className="py-3 text-right font-bold text-gray-900">7.9 t/ha</td>
                <td className="py-3 text-right">
                  <Badge variant="amber">-1.2% Mild Rust</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { weatherService, farmService } from '@/lib/services'
import type { WeatherStation, WeatherTrendPoint, Farm } from '@/lib/types'
import { Badge } from '@/components/ui/DesignSystem'

export default function WeatherAnalyticsPage() {
  const [stations, setStations] = useState<WeatherStation[]>([])
  const [trends, setTrends] = useState<WeatherTrendPoint[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [activeModel, setActiveModel] = useState<'et0' | 'gdd' | 'stress'>('et0')

  useEffect(() => {
    async function load() {
      const [sList, tList, fList] = await Promise.all([
        weatherService.listStations(),
        weatherService.getWeatherTrends(),
        farmService.listFarms(),
      ])
      setStations(sList)
      setTrends(tList)
      setFarms(fList)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Analytics</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Advanced Agro-Meteorological Analytics & Modeling
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            FAO-56 Penman-Monteith reference evapotranspiration, thermal unit accumulation curves, and atmospheric water vapor deficit indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {(['et0', 'gdd', 'stress'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveModel(m)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                  activeModel === m ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {m === 'et0' ? '💧 FAO-56 ET0' : m === 'gdd' ? '🌡️ GDD Thermal' : '🌾 Crop Water Stress'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Analytical Model Cockpit */}
      {activeModel === 'et0' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Reference Evapotranspiration (ET0) vs. Effective Precipitation</h3>
              <p className="text-xs text-gray-500">Irrigation water requirement calculation per agro-ecological parcel</p>
            </div>
            <Badge variant="blue">FAO-56 Penman-Monteith Equation</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            {trends.map((t) => {
              const deficit = (t.et0_mm - t.cumulative_rainfall_mm).toFixed(1)
              const hasDeficit = parseFloat(deficit) > 0

              return (
                <div key={t.period} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <span className="font-bold text-gray-900 block">{t.period}</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>ET0 Demand:</span>
                      <strong className="text-teal-800">{t.et0_mm} mm</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Rain Inflow:</span>
                      <strong className="text-sky-800">{t.cumulative_rainfall_mm} mm</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-gray-500">Water Balance:</span>
                    <Badge variant={hasDeficit ? 'amber' : 'green'}>
                      {hasDeficit ? `-${deficit}mm Deficit` : `+${Math.abs(parseFloat(deficit))}mm Surplus`}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 leading-relaxed">
            <span className="font-bold block mb-1">💡 Agronomic Irrigation Takeaway:</span>
            Sub-humid highland zones show accumulated moisture surplus throughout May and August. Supplemental drip irrigation is only mathematically warranted during the July cool dry inversion interval for shallow-rooted horticulture.
          </div>
        </div>
      )}

      {activeModel === 'gdd' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Cumulative Growing Degree Days (GDD) Phenology Curve</h3>
              <p className="text-xs text-gray-500">Thermal heat unit tracking against physiological crop maturity benchmarks</p>
            </div>
            <Badge variant="amber">Base Temp: 10°C / Cap: 30°C</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Highland Hybrid Maize (H6213)</h4>
                <Badge variant="green">VEGETATIVE TO TASSEL</Badge>
              </div>
              <p className="text-gray-500">Target GDD for maturity: 1,450 °C-d. Current accumulated: 1,132 °C-d (78% achieved).</p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
              </div>
              <span className="text-[10px] text-gray-400 block">Estimated Black Layer physiological maturity: Sept 28</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Shangi Seed Potato</h4>
                <Badge variant="blue">TUBER BULKING</Badge>
              </div>
              <p className="text-gray-500">Target GDD for maturity: 950 °C-d. Current accumulated: 890 °C-d (93% achieved).</p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '93%' }} />
              </div>
              <span className="text-[10px] text-gray-400 block">Skin set haulm-killing recommended in 6 days</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">French Export Beans</h4>
                <Badge variant="amber">FLOWERING</Badge>
              </div>
              <p className="text-gray-500">Target GDD for maturity: 680 °C-d. Current accumulated: 410 °C-d (60% achieved).</p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-[10px] text-gray-400 block">First pick harvest projected: Oct 02</span>
            </div>
          </div>
        </div>
      )}

      {activeModel === 'stress' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Atmospheric Vapor Pressure Deficit (VPD) & Crop Stress Matrix</h3>
              <p className="text-xs text-gray-500">Stomatal conductance risk and transpirational pull index</p>
            </div>
            <Badge variant="blue">Biophysical Equilibrium</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-950 block">0.4 - 0.8 kPa (Low VPD)</span>
              <p className="text-emerald-800 mt-1 text-[11px]">High humidity, low transpirational demand. Elevated foliar fungus / blight hazard.</p>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-2">Station: Kericho High Ridge (88% RH)</span>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <span className="font-bold text-sky-950 block">0.8 - 1.2 kPa (Optimal)</span>
              <p className="text-sky-800 mt-1 text-[11px]">Ideal photosystem transpirational gradient. Stomata open fully with zero dehydration shock.</p>
              <span className="text-[10px] text-sky-700 font-semibold block mt-2">Station: Nakuru North (68% RH)</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-950 block">1.2 - 1.6 kPa (Moderate Stress)</span>
              <p className="text-amber-800 mt-1 text-[11px]">Dry atmosphere. Seedlings conserve moisture by partial stomatal closure.</p>
              <span className="text-[10px] text-amber-700 font-semibold block mt-2">Station: Kitale Demo (59% RH)</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-950 block">&gt; 1.6 kPa (Severe Deficit)</span>
              <p className="text-rose-800 mt-1 text-[11px]">Stomatal shutdown, wilting potential, extreme transpiration pull.</p>
              <span className="text-[10px] text-rose-700 font-semibold block mt-2">Zero stations currently</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cross-Farm Microclimatic Variogram */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-gray-900">Monitored Farm Zones & Microclimatic Association</h3>
        <p className="text-xs text-gray-500">Spatial linkage between agricultural enterprises and primary telemetric weather hubs</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {farms.map((f) => (
            <div key={f.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-xs">{f.name}</h4>
                <span className="text-emerald-800 font-bold">{f.area_ha} ha</span>
              </div>
              <p className="text-[11px] text-gray-500">{f.location_name}</p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                <span>Soil: <strong>{f.soil_type}</strong></span>
                <span>Zone: <strong>{f.climate_zone}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

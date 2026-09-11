"use client"
import React, { useState } from 'react'
import { Badge } from '@/components/ui/DesignSystem'

const REPORT_TEMPLATES = [
  {
    id: 'farm_performance',
    title: 'Farm Performance & Land Productivity Audit',
    category: 'Executive Operations',
    format: 'PDF / Excel',
    desc: 'Comprehensive multi-farm audit detailing total acreage, soil classifications, seasonal outputs, and cultivation efficiency.',
    frequency: 'Monthly / Quarterly',
    tags: ['Acreage', 'Productivity', 'Land Assets'],
  },
  {
    id: 'crop_performance',
    title: 'Crop Variety Phenology & Yield Realization Report',
    category: 'Agronomy Analysis',
    format: 'PDF / CSV',
    desc: 'Cultivar-by-cultivar benchmark tracking actual vs target yields, days-to-maturity, and lodging/disease incidence rates.',
    frequency: 'Post-Harvest',
    tags: ['Hybrids', 'Yield (t/ha)', 'Maturity'],
  },
  {
    id: 'weather_audit',
    title: 'Agro-Meteorological Micro-Climate Audit',
    category: 'Weather & Climate',
    format: 'PDF',
    desc: 'Precipitation accumulation patterns, GDD curves, evapotranspiration totals, and risk events recorded over 90 days.',
    frequency: 'Seasonal',
    tags: ['Rainfall', 'GDD', 'Frost Risk'],
  },
  {
    id: 'station_telemetry_sla',
    title: 'Automated Weather Station Telemetry & Data Quality Audit',
    category: 'Weather & Climate',
    format: 'PDF / CSV',
    desc: 'Packet completeness rates, transmission latency, missing data imputations, and physical range plausibility violations per sensor.',
    frequency: 'Monthly SLA',
    tags: ['Data Quality', 'Telemetry', 'SLA Health'],
  },
  {
    id: 'climatological_risk_bulletin',
    title: 'Seasonal Extreme Weather & Hazard Risk Bulletin',
    category: 'Weather & Climate',
    format: 'PDF',
    desc: 'Deep analytical report on cold air drainage frost occurrences, storm cell squalls, drought deciles, and vulnerable crop cycles.',
    frequency: 'Bi-Weekly Advisory',
    tags: ['Frost', 'Squalls', 'Vulnerable Crops'],
  },
  {
    id: 'yield_estimates',
    title: 'Ensemble Model Yield Predictions & Confidence Bounds',
    category: 'Yield Intelligence',
    format: 'PDF / Excel',
    desc: 'Predictive modeling sheets showing expected yield tonnage per parcel with upper and lower bound confidence intervals.',
    frequency: 'Bi-Weekly in Season',
    tags: ['Predictions', 'Ensemble AI', 'Tonnage'],
  },
  {
    id: 'production_planning',
    title: 'Seasonal Production Planning & Commodity Distribution',
    category: 'Production & Logistics',
    format: 'PDF / Excel',
    desc: 'Aggregated planting schedules, harvest delivery projections, storage warehouse allocation, and input requirements.',
    frequency: 'Pre-Season & Mid-Season',
    tags: ['Planning', 'Logistics', 'Projections'],
  },
]

export default function FarmManagerReportsPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')

  const handleDownload = (id: string) => {
    setDownloadingId(id)
    setTimeout(() => {
      setDownloadingId(null)
      alert(`Report generated and ready for download: ${id.replace(/_/g, ' ').toUpperCase()}.pdf`)
    }, 900)
  }

  const filtered = activeTab === 'all'
    ? REPORT_TEMPLATES
    : REPORT_TEMPLATES.filter((r) => r.category.toLowerCase().includes(activeTab))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Reports & Audits</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Agricultural Reports & Exports</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Downloadable executive summaries, yield estimates, weather audits, and production planning dossiers.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {['all', 'operations', 'agronomy', 'weather'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'all' ? 'All Templates' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Feed */}
      <div className="space-y-4">
        {filtered.map((rpt) => (
          <div
            key={rpt.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-emerald-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0 border border-emerald-100">
                📋
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-base">{rpt.title}</h3>
                  <Badge variant="blue">{rpt.category}</Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">{rpt.desc}</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-medium">Cadence: {rpt.frequency} · Format: {rpt.format}</span>
                  <span className="text-gray-300">•</span>
                  {rpt.tags.map((t) => (
                    <span key={t} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownload(rpt.id)}
              disabled={downloadingId === rpt.id}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2 flex-shrink-0 self-start sm:self-auto"
            >
              {downloadingId === rpt.id ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

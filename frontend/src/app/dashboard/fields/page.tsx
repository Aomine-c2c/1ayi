"use client"
import React, { useState, useEffect } from 'react'
import { fieldService, farmService, cropService, weatherService } from '@/lib/services'
import type { Field, Farm, CropCycle, WeatherRecord } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [cycles, setCycles] = useState<CropCycle[]>([])
  const [weatherList, setWeatherList] = useState<WeatherRecord[]>([])
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [filterFarmId, setFilterFarmId] = useState<number | 'all'>('all')

  // Observations Modal
  const [isObservationOpen, setIsObservationOpen] = useState(false)
  const [obsType, setObsType] = useState('water_stress')
  const [obsNotes, setObsNotes] = useState('')
  const [observations, setObservations] = useState([
    { id: 1, type: 'Nutrient Deficiency', date: '2025-09-10', notes: 'Slight nitrogen chlorosis visible on lower canopy leaves.', severity: 'mild' },
    { id: 2, type: 'Soil Moisture', date: '2025-09-08', notes: 'Soil tensiometer readings indicate field capacity at 82%.', severity: 'normal' },
    { id: 3, type: 'Pest Scouting', date: '2025-09-05', notes: 'Isolated egg masses of Spodoptera frugiperda spotted in perimeter row.', severity: 'moderate' },
  ])

  useEffect(() => {
    async function load() {
      const [fList, farmsList, cList, wList] = await Promise.all([
        fieldService.listFieldsByFarm(),
        farmService.listFarms(),
        cropService.listCycles(),
        weatherService.getCurrentObservations(),
      ])
      setFields(fList)
      setFarms(farmsList)
      setCycles(cList)
      setWeatherList(wList)
      if (fList.length > 0) setSelectedField(fList[0])
    }
    load()
  }, [])

  const filteredFields = filterFarmId === 'all'
    ? fields
    : fields.filter((f) => f.farm_id === filterFarmId)

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault()
    const newObs = {
      id: Date.now(),
      type: obsType.replace(/_/g, ' ').toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      notes: obsNotes,
      severity: 'normal',
    }
    setObservations([newObs, ...observations])
    setIsObservationOpen(false)
    setObsNotes('')
  }

  // Active field context helpers
  const activeCycle = selectedField ? cycles.find((c) => c.field_id === selectedField.id) : null
  const activeFarm = selectedField ? farms.find((fm) => fm.id === selectedField.farm_id) : null
  const fieldWeather = weatherList.find((w) => w.farm_id === selectedField?.farm_id) || weatherList[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Fields</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Field Parcels & Boundaries</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Detailed parcel dimensions, soil pH metrics, irrigation delivery systems, and field observations.
          </p>
        </div>

        {/* Farm Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-700">Filter Estate:</label>
          <select
            value={filterFarmId}
            onChange={(e) => setFilterFarmId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Farm Holdings ({farms.length})</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Field Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredFields.map((f) => {
          const isSelected = selectedField?.id === f.id
          const activeCycle = cycles.find((c) => c.field_id === f.id)
          const farmObj = farms.find((fm) => fm.id === f.farm_id)

          return (
            <div
              key={f.id}
              onClick={() => setSelectedField(f)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">🔲</span>
                <Badge variant={f.status === 'active' ? 'green' : 'amber'}>
                  {f.status.toUpperCase()}
                </Badge>
              </div>

              <h3 className="font-bold text-gray-900 text-sm mt-1">{f.name}</h3>
              <p className="text-xs text-gray-500 font-medium">📍 {farmObj?.name || 'Estate'}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Cultivated Area:</span>
                  <span className="font-bold text-gray-900">{f.area_ha} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Crop:</span>
                  <span className="font-semibold text-emerald-800">{activeCycle?.crop_name || 'Fallow / Rotational'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Irrigation:</span>
                  <span className="capitalize font-medium text-gray-700">{f.irrigation_type}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Field Deep-Dive */}
      {selectedField && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Parcel Inspection & Agronomy
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selectedField.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Area: {selectedField.area_ha} ha · Soil pH: {selectedField.soil_ph} · Soil Organic Matter: {selectedField.soil_organic_matter}%
              </p>
            </div>
            <button
              onClick={() => setIsObservationOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
            >
              ＋ Log Field Observation
            </button>
          </div>

          {/* Field Details Cards: Location, Area, Crop, Crop Cycle, Planting date, Expected harvest */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Field Location</span>
              <p className="text-xs font-bold text-gray-900 mt-1">📍 {activeFarm?.location || 'Central Valley Rift'}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{selectedField.coordinates || '0.2921° S, 36.0822° E'}</p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cultivated Area</span>
              <p className="text-sm font-bold text-gray-900 mt-1">{selectedField.area_ha} Hectares</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Soil type: Loam (pH {selectedField.soil_ph})</p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Crop & Variety</span>
              <p className="text-xs font-bold text-emerald-800 mt-1">{activeCycle?.crop_name || 'White Maize'}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{activeCycle?.stage || 'Flowering & Tasseling'}</p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Crop Cycle Timeline</span>
              <p className="text-xs font-bold text-gray-900 mt-1">Sown: {activeCycle?.start_date || '2025-04-12'}</p>
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">Harvest: {activeCycle?.expected_harvest_date || '2025-09-28'}</p>
            </div>
          </div>

          {/* Real-time Field Weather Section */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🌤️</span>
                <h3 className="text-xs font-bold text-gray-900">Current Field Micro-Weather & Moisture Conditions</h3>
              </div>
              <span className="text-[10px] font-mono text-blue-700 font-semibold">Telemetry Synchronized</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60">
                <span className="text-[10px] text-gray-500 block">Temperature</span>
                <span className="text-base font-bold text-gray-900">{fieldWeather?.temperature ?? 24.8}°C</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60">
                <span className="text-[10px] text-gray-500 block">Rainfall (Past 24h)</span>
                <span className="text-base font-bold text-blue-600">{fieldWeather?.rainfall ?? 3.4} mm</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60">
                <span className="text-[10px] text-gray-500 block">Relative Humidity</span>
                <span className="text-base font-bold text-gray-900">{fieldWeather?.humidity ?? 68}%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60">
                <span className="text-[10px] text-gray-500 block">Wind Velocity</span>
                <span className="text-base font-bold text-gray-900">{fieldWeather?.wind_speed ?? 11.2} km/h</span>
              </div>
            </div>
          </div>

          {/* Current Risks Assessment Matrix */}
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <h3 className="text-xs font-bold text-gray-900">Current Risks & Field Vulnerabilities</h3>
              </div>
              <Badge variant="amber" size="sm">Attention Recommended</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-amber-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">Pest Pressure (FAW)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">MODERATE</span>
                </div>
                <p className="text-[11px] text-gray-600">Fall armyworm egg masses detected along field perimeter boundary. Trap count: 7 moths/night.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">Moisture Stress</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">LOW / OPTIMAL</span>
                </div>
                <p className="text-[11px] text-gray-600">Root zone moisture sitting at 74% field capacity following recent precipitation.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">Foliar Disease (Blight)</span>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">ELEVATED</span>
                </div>
                <p className="text-[11px] text-gray-600">Sustained high humidity above 85% during night hours creating favorable microclimate for Turcicum leaf blight.</p>
              </div>
            </div>
          </div>

          {/* Historical Field Observations Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Historical Field Observations & Scouting Logs</h3>
              <span className="text-xs text-gray-500 font-medium">{observations.length} records logged</span>
            </div>
            <div className="space-y-3">
              {observations.map((obs) => (
                <div key={obs.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{obs.type}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Logged on {obs.date}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{obs.notes}</p>
                  </div>
                  <Badge variant={obs.severity === 'mild' ? 'blue' : obs.severity === 'moderate' ? 'amber' : 'green'}>
                    {obs.severity ? obs.severity.toUpperCase() : 'SCOUTED'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal */}
      <Modal isOpen={isObservationOpen} onClose={() => setIsObservationOpen(false)} title="Log Field Observation">
        <form onSubmit={handleAddObservation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Observation Type</label>
            <select
              value={obsType}
              onChange={(e) => setObsType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="water_stress">Water Stress / Moisture</option>
              <option value="pest_incidence">Pest Scouting (Armyworm / Whitefly)</option>
              <option value="disease_symptom">Foliar Disease / Rust / Blight</option>
              <option value="nutrient_deficiency">Nutrient Deficiency (Nitrogen / Zinc)</option>
              <option value="growth_milestone">Phenological Stage Transition</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Scouting Notes & Severity</label>
            <textarea
              rows={3}
              required
              value={obsNotes}
              onChange={(e) => setObsNotes(e.target.value)}
              placeholder="Describe symptoms, coverage percentage, or leaf coloration..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsObservationOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Save Observation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

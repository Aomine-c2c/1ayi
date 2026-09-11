"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { fieldService, farmService, cropService, weatherService } from '@/lib/services'
import type { FieldObservation, Farm, Crop, WeatherRecord } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

export default function ExtensionObservationsPage() {
  const [observations, setObservations] = useState<FieldObservation[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [weatherList, setWeatherList] = useState<WeatherRecord[]>([])
  const [selectedObs, setSelectedObs] = useState<FieldObservation | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Filtering
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [followUpFilter, setFollowUpFilter] = useState<string>('all')

  // Form State matching Extension Officer requirements:
  // Add observation, Crop, Growth stage, Condition, Weather conditions, Notes, Severity, Follow-up required
  const [formFarmId, setFormFarmId] = useState<number>(1)
  const [formFieldName, setFormFieldName] = useState('North Terrace Block A')
  const [formCropName, setFormCropName] = useState('White Maize (H6213)')
  const [formStage, setFormStage] = useState('Vegetative Growth')
  const [formCondition, setFormCondition] = useState('Vigorous Stand')
  const [formWeatherConditions, setFormWeatherConditions] = useState('Partly cloudy, 20°C, 4.2mm rain in last 24h')
  const [formSeverity, setFormSeverity] = useState<any>('moderate')
  const [formFollowUpRequired, setFormFollowUpRequired] = useState(true)
  const [formType, setFormType] = useState<any>('pest')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    async function load() {
      const [obs, fList, crList, wList] = await Promise.all([
        fieldService.listObservations(),
        farmService.listFarms(),
        cropService.listCrops(),
        weatherService.getCurrentObservations(),
      ])
      setObservations(obs)
      setFarms(fList)
      setCrops(crList)
      setWeatherList(wList)
      if (obs.length > 0) setSelectedObs(obs[0])
    }
    load()
  }, [])

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault()
    const farmObj = farms.find((f) => f.id === formFarmId)

    const created = await fieldService.createObservation({
      farm_id: formFarmId,
      farm_name: farmObj?.name || 'Green Ridge Highland Estate',
      field_name: formFieldName,
      crop_name: formCropName,
      growth_stage: formStage,
      condition: formCondition,
      weather_conditions: formWeatherConditions,
      observation_type: formType,
      severity: formSeverity,
      follow_up_required: formFollowUpRequired,
      follow_up_status: formFollowUpRequired ? 'pending' : 'resolved',
      observed_by: 'Brian Omondi (Extension Officer)',
      notes: formNotes,
    })

    setObservations([created, ...observations])
    setSelectedObs(created)
    setIsAddOpen(false)
    setFormNotes('')
  }

  const filtered = observations.filter((o) => {
    if (severityFilter !== 'all' && o.severity !== severityFilter) return false
    if (followUpFilter === 'required' && !o.follow_up_required && o.follow_up_status !== 'pending') return false
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
            <span className="text-gray-800 font-semibold">Field Observations</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinical Field Scouting & Crop Health Observations</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Log in-field phytosanitary observations, weather micro-climate conditions at inspection, and assign follow-up action flags.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Record New Observation</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Severity Filter</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-gray-800"
          >
            <option value="all">All Severities</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Follow-up Filter</label>
          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-gray-800"
          >
            <option value="all">All Logs</option>
            <option value="required">Follow-up Required Only</option>
          </select>
        </div>
      </div>

      {/* Observation List and Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.map((obs) => {
            const isSelected = selectedObs?.id === obs.id
            const severity = obs.severity || 'mild'

            return (
              <div
                key={obs.id}
                onClick={() => setSelectedObs(obs)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">
                      {obs.crop_name} · {obs.field_name}
                    </h4>
                    <span className="text-[11px] text-gray-500 block">{obs.farm_name}</span>
                  </div>
                  <Badge variant={severity === 'critical' ? 'red' : severity === 'severe' ? 'red' : severity === 'moderate' ? 'amber' : 'green'}>
                    {severity.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {obs.notes}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                  <span>Stage: {obs.growth_stage}</span>
                  <span className="font-bold text-emerald-800">
                    {obs.follow_up_required ? '⚠️ Follow-up Required' : 'No Follow-up'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Deep Diagnostic Inspector */}
        <div className="lg:col-span-7">
          {selectedObs ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs sticky top-24">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={selectedObs.severity === 'severe' || selectedObs.severity === 'critical' ? 'red' : 'amber'}>
                      {(selectedObs.severity || 'MILD').toUpperCase()} SEVERITY
                    </Badge>
                    <Badge variant="blue">
                      {selectedObs.observation_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {selectedObs.follow_up_required && (
                      <Badge variant="red">FOLLOW-UP ACTIVE</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedObs.crop_name} — {selectedObs.field_name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Farm Holding: <strong className="text-gray-800">{selectedObs.farm_name}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Observed At</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {new Date(selectedObs.observed_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Observation Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Crop Cultivar</span>
                  <span className="font-bold text-emerald-800 mt-0.5 block truncate">{selectedObs.crop_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Growth Stage</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedObs.growth_stage}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Crop Condition</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedObs.condition || 'Vigorous Stand'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Follow-up Flag</span>
                  <span className="font-bold text-rose-700 mt-0.5 block truncate">
                    {selectedObs.follow_up_required ? 'Required (Active)' : 'Not Required'}
                  </span>
                </div>
              </div>

              {/* Weather Conditions At Observation */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 text-xs space-y-1">
                <span className="font-bold text-sky-900 block text-[11px] uppercase tracking-wider">
                  Micro-Climate Weather Conditions at Inspection
                </span>
                <p className="text-sky-800 leading-relaxed">
                  {selectedObs.weather_conditions || 'Ambient 19.8°C, relative humidity 78%, light northern wind (11 km/h). 4.2mm rain recorded in past 24h.'}
                </p>
              </div>

              {/* Diagnostic Notes */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Clinical Scouting Notes & Diagnosis
                </h3>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 leading-relaxed">
                  {selectedObs.notes}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Inspector: <strong className="text-gray-700">{selectedObs.observed_by}</strong>
                </span>
                <Link
                  href="/dashboard/follow-up"
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Create Linked Follow-up Task →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              Select an observation to view details.
            </div>
          )}
        </div>
      </div>

      {/* Add Observation Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Clinical Field Observation"
      >
        <form onSubmit={handleCreateObservation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Farm</label>
            <select
              value={formFarmId}
              onChange={(e) => setFormFarmId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Field Block</label>
              <input
                type="text"
                required
                value={formFieldName}
                onChange={(e) => setFormFieldName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Crop Cultivar</label>
              <input
                type="text"
                required
                value={formCropName}
                onChange={(e) => setFormCropName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Growth Stage</label>
              <input
                type="text"
                required
                value={formStage}
                onChange={(e) => setFormStage(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Crop Condition Stand</label>
              <input
                type="text"
                required
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Weather Conditions at Inspection</label>
            <input
              type="text"
              required
              value={formWeatherConditions}
              onChange={(e) => setFormWeatherConditions(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Observation Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pest">Pest Scouting</option>
                <option value="disease">Phytopathology</option>
                <option value="nutrient_deficiency">Nutrient Deficiency</option>
                <option value="water_stress">Water Stress</option>
                <option value="growth_milestone">Growth Milestone</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Severity</label>
              <select
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Follow-up Required?</label>
              <select
                value={formFollowUpRequired ? 'yes' : 'no'}
                onChange={(e) => setFormFollowUpRequired(e.target.value === 'yes')}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="yes">Yes (Flag Active)</option>
                <option value="no">No (Informational)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Scouting Observations & Field Findings</label>
            <textarea
              rows={4}
              required
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Detail symptomatic evidence, pest counts, damaged foliage percentage, or immediate corrective interventions..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Save Observation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

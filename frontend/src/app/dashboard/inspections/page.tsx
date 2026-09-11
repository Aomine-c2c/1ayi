"use client"
import React, { useState, useEffect } from 'react'
import {
  farmService,
  fieldService,
  cropService,
  authService,
  extensionService,
} from '@/lib/services'
import type { Farm, Field, Crop, User, FieldObservation } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

// 9 steps requested by user:
// Step 1: Select farmer/farm.
// Step 2: Select field.
// Step 3: Select crop.
// Step 4: Select crop growth stage.
// Step 5: Record field condition.
// Step 6: Record observations.
// Step 7: Record severity.
// Step 8: Add notes.
// Step 9: Create follow-up if necessary.

const GROWTH_STAGES = [
  'Emergence & Germination',
  'Vegetative Canopy Growth',
  'Stem Elongation / Tillering',
  'Flowering / Tasseling',
  'Fruit Development / Podding',
  'Grain Filling',
  'Ripening & Physiological Maturity',
  'Post-Harvest / Fallow',
]

const FIELD_CONDITIONS = [
  { id: 'optimal', label: 'Optimal Stand', desc: 'Vigorous vegetative development with no visible biotic stress' },
  { id: 'water_stressed', label: 'Water Stressed', desc: 'Leaf wilting, moisture deficit in root zone' },
  { id: 'pest_pressure', label: 'Pest Incidence', desc: 'Folivore damage, stem borer entry holes, or aphid clusters' },
  { id: 'disease_symptom', label: 'Disease Symptoms', desc: 'Chlorotic lesions, blight spotting, rust pustules' },
  { id: 'nutrient_deficiency', label: 'Nutrient Deficiency', desc: 'Interveinal yellowing, stunting, purple margins' },
  { id: 'weed_competition', label: 'Weed Infestation', desc: 'Heavy weed canopy competing for root nutrients' },
]

const OBSERVATION_CATEGORIES = [
  { id: 'pest', label: 'Pest Scouting', icon: '🐛' },
  { id: 'disease', label: 'Disease Symptom', icon: '🦠' },
  { id: 'water_stress', label: 'Moisture / Irrigation Stress', icon: '💧' },
  { id: 'nutrient_deficiency', label: 'Nutrient Deficiency', icon: '🧪' },
  { id: 'weed', label: 'Weed Canopy Competition', icon: '🌿' },
  { id: 'growth_milestone', label: 'Phenological Transition', icon: '📈' },
]

export default function InspectionsPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmers, setFarmers] = useState<User[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [completedInspections, setCompletedInspections] = useState<FieldObservation[]>([])
  const [loading, setLoading] = useState(true)

  // 9-Step Inspection Workflow Form State
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1) // Step 1
  const [selectedFieldId, setSelectedFieldId] = useState<number>(1) // Step 2
  const [selectedCropName, setSelectedCropName] = useState<string>('White Maize (H6213)') // Step 3
  const [selectedGrowthStage, setSelectedGrowthStage] = useState<string>(GROWTH_STAGES[1]) // Step 4
  const [selectedCondition, setSelectedCondition] = useState<string>(FIELD_CONDITIONS[0].label) // Step 5
  const [selectedObsCategory, setSelectedObsCategory] = useState<string>('pest') // Step 6
  const [selectedSeverity, setSelectedSeverity] = useState<'minor' | 'moderate' | 'severe' | 'critical'>('moderate') // Step 7
  const [notes, setNotes] = useState<string>('') // Step 8
  const [createFollowUp, setCreateFollowUp] = useState<boolean>(true) // Step 9
  const [followUpTitle, setFollowUpTitle] = useState<string>('')
  const [followUpDueDate, setFollowUpDueDate] = useState<string>('')

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [fList, uList, fldList, crList, obsList] = await Promise.all([
        farmService.listFarms(),
        authService.listUsers(),
        fieldService.listFieldsByFarm(),
        cropService.listCrops(),
        fieldService.listObservations(),
      ])
      setFarms(fList)
      setFarmers(uList.filter(u => u.role === 'farmer'))
      setFields(fldList)
      setCrops(crList)
      setCompletedInspections(obsList)
      if (fList.length > 0) setSelectedFarmId(fList[0].id)
      if (fldList.length > 0) setSelectedFieldId(fldList[0].id)
      if (crList.length > 0) setSelectedCropName(crList[0].name)
      setFollowUpDueDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0])
      setLoading(false)
    }
    load()
  }, [])

  // Filter fields matching selected farm
  const currentFarmFields = fields.filter(fld => fld.farm_id === selectedFarmId)
  const activeFarm = farms.find(f => f.id === selectedFarmId)
  const activeField = fields.find(f => f.id === selectedFieldId)

  const handleNext = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const createdObs = await fieldService.createObservation({
        farm_id: selectedFarmId,
        farm_name: activeFarm?.name || 'Green Ridge Estate',
        field_name: activeField?.name || 'North Block A',
        crop_name: selectedCropName,
        growth_stage: selectedGrowthStage,
        condition: selectedCondition,
        observation_type: selectedObsCategory as any,
        severity: selectedSeverity as any,
        notes: notes || `Field inspection recorded under stage ${selectedGrowthStage}. Stand condition: ${selectedCondition}.`,
        follow_up_required: createFollowUp,
        follow_up_status: createFollowUp ? 'pending' : 'none',
      })

      if (createFollowUp) {
        await extensionService.createFollowUp({
          farm_id: selectedFarmId,
          farm_name: activeFarm?.name || 'Green Ridge Estate',
          title: followUpTitle || `Inspect & remediate ${selectedObsCategory} in ${activeField?.name || 'field'}`,
          task_type: selectedObsCategory === 'pest' ? 'scouting' : 'risk_mitigation',
          priority: selectedSeverity === 'critical' ? 'critical' : selectedSeverity === 'severe' ? 'high' : 'medium',
          due_date: followUpDueDate,
          description: `Auto-generated from 9-step field inspection. Notes: ${notes}`,
        })
      }

      setCompletedInspections([createdObs, ...completedInspections])
      setSubmittedSuccess(true)
      setCurrentStep(1)
      setNotes('')
      setTimeout(() => setSubmittedSuccess(false), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Field Operations · Mobile Scouting Workflow
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Field Inspection Checklist
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Standardized 9-step agronomic field evaluation procedure optimized for rapid handheld mobile scouting.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {submittedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
              ✓ Inspection & Follow-up Logged
            </span>
          )}
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Step {currentStep} of 9
          </span>
        </div>
      </div>

      {/* 2. Step Progress Bar (Scrollable on small screens) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {[
            { num: 1, label: 'Farm' },
            { num: 2, label: 'Field' },
            { num: 3, label: 'Crop' },
            { num: 4, label: 'Growth Stage' },
            { num: 5, label: 'Condition' },
            { num: 6, label: 'Observations' },
            { num: 7, label: 'Severity' },
            { num: 8, label: 'Notes' },
            { num: 9, label: 'Follow-up' },
          ].map((s) => {
            const isDone = s.num < currentStep
            const isCurrent = s.num === currentStep
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-gray-400 bg-gray-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                    isCurrent ? 'bg-white text-emerald-800' : isDone ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Main Workflow Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Inspection Form (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <form onSubmit={handleSubmitInspection} className="space-y-6">
            {/* STEP 1: Select Farmer / Farm */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 1 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Select Target Farmer & Agricultural Farm</h3>
                  <p className="text-xs text-gray-500">Pick the registered land holding under surveillance</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {farms.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFarmId(f.id)
                        const firstFld = fields.find(fld => fld.farm_id === f.id)
                        if (firstFld) setSelectedFieldId(firstFld.id)
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedFarmId === f.id
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">⬡</span>
                        <Badge variant={selectedFarmId === f.id ? 'green' : 'gray'}>
                          {selectedFarmId === f.id ? 'SELECTED' : 'SELECT'}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mt-2">{f.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{f.location_name || 'Rift Valley'}</p>
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">Area: {f.total_area_ha || 25} ha</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Select Field */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 2 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Select Field Parcel</h3>
                  <p className="text-xs text-gray-500">Choose the specific plot in {activeFarm?.name}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentFarmFields.length === 0 ? (
                    <div className="col-span-2 p-6 text-center text-gray-400 text-xs">
                      No registered fields found for this farm. Defaulting to Main Block A.
                    </div>
                  ) : (
                    currentFarmFields.map((fld) => (
                      <div
                        key={fld.id}
                        onClick={() => setSelectedFieldId(fld.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedFieldId === fld.id
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">🔲</span>
                          <Badge variant={selectedFieldId === fld.id ? 'green' : 'gray'}>
                            {selectedFieldId === fld.id ? 'SELECTED' : 'SELECT'}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-2">{fld.name}</h4>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          <p>Area: <strong className="text-gray-900">{fld.area_ha} ha</strong></p>
                          <p>Soil pH: <strong className="text-gray-900">{fld.soil_ph}</strong></p>
                          <p>Irrigation: <strong className="capitalize text-gray-700">{fld.irrigation_type}</strong></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Select Crop */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 3 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Select Cultivated Crop Variety</h3>
                  <p className="text-xs text-gray-500">Specify what crop variety is growing in {activeField?.name}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {crops.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCropName(c.name)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedCropName === c.name
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🌱</span>
                        <Badge variant={selectedCropName === c.name ? 'green' : 'gray'}>
                          {selectedCropName === c.name ? 'SELECTED' : 'SELECT'}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mt-2">{c.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{c.variety || 'Certified Variety'}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">Expected Yield: {c.expected_yield_typical_kg_ha || 5500} kg/ha</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Select Crop Growth Stage */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 4 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Crop Growth Stage</h3>
                  <p className="text-xs text-gray-500">Assess phenological development stage of {selectedCropName}</p>
                </div>

                <div className="space-y-2">
                  {GROWTH_STAGES.map((stg, idx) => (
                    <div
                      key={stg}
                      onClick={() => setSelectedGrowthStage(stg)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedGrowthStage === stg
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs font-bold text-emerald-900'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs">{stg}</span>
                      </div>
                      <span className="text-sm">
                        {selectedGrowthStage === stg ? '🔘' : '⚪'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Record Field Condition */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 5 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Record Overall Field Condition</h3>
                  <p className="text-xs text-gray-500">General visual appraisal of plant vigor and canopy health</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FIELD_CONDITIONS.map((cond) => (
                    <div
                      key={cond.id}
                      onClick={() => setSelectedCondition(cond.label)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedCondition === cond.label
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">{cond.label}</h4>
                        <span className="text-sm">
                          {selectedCondition === cond.label ? '🔘' : '⚪'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cond.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Record Observations */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 6 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Record Specific Scouting Observation</h3>
                  <p className="text-xs text-gray-500">Classify physical findings discovered during walking transect</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OBSERVATION_CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedObsCategory(cat.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedObsCategory === cat.id
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">{cat.label}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">Category: {cat.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Record Severity */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 7 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Record Threat Severity</h3>
                  <p className="text-xs text-gray-500">Rate potential yield loss risk or pest threshold exceedance</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'minor', label: 'Minor / Low', desc: 'Isolated occurrence (<5% crop stand). No immediate yield loss expected.', badge: 'gray' },
                    { id: 'moderate', label: 'Moderate', desc: 'Noticeable symptoms (5-20% stand). Requires monitoring & cultural practices.', badge: 'blue' },
                    { id: 'severe', label: 'Severe', desc: 'Substantial damage (20-40% stand). Fast intervention or spraying warranted.', badge: 'amber' },
                    { id: 'critical', label: 'Critical / Outbreak', desc: 'Widespread infestation (>40% stand). Immediate emergency treatment.', badge: 'red' },
                  ].map((sev) => (
                    <div
                      key={sev.id}
                      onClick={() => setSelectedSeverity(sev.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedSeverity === sev.id
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={sev.badge as any}>{sev.label.toUpperCase()}</Badge>
                        <span>{selectedSeverity === sev.id ? '🔘' : '⚪'}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{sev.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: Add Notes */}
            {currentStep === 8 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 8 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Add Field Inspection Notes</h3>
                  <p className="text-xs text-gray-500">Record on-site findings, physical counts, chemical checks, or farmer remarks</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter detailed field observation notes (e.g., armyworm frass noted on 15 plants out of 100 sampled; soil moisture dry down to 10cm depth; farmer advised on neem extract spray)..."
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 text-xs text-gray-900 leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="text-gray-400 font-semibold">Quick insert:</span>
                    {[
                      'Fall armyworm detected',
                      'Nitrogen yellowing on lower leaves',
                      'Moisture optimal after recent showers',
                      'Weed canopy cleared',
                    ].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNotes(prev => prev ? `${prev}. ${tag}` : tag)}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Create Follow-up if Necessary */}
            {currentStep === 9 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Step 9 of 9</span>
                  <h3 className="text-lg font-bold text-gray-900">Schedule Follow-up Action</h3>
                  <p className="text-xs text-gray-500">Create an assigned task on the Field Officer board for re-inspection or remediation</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">Create Automated Follow-up Task</h4>
                      <p className="text-[11px] text-gray-500">Assigns action to the task list with automated reminders</p>
                    </div>
                    <input
                      type="checkbox"
                      id="enable_followup"
                      checked={createFollowUp}
                      onChange={(e) => setCreateFollowUp(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                  </div>

                  {createFollowUp && (
                    <div className="space-y-3 pt-3 border-t border-gray-200 text-xs">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Follow-up Task Title</label>
                        <input
                          type="text"
                          value={followUpTitle}
                          onChange={(e) => setFollowUpTitle(e.target.value)}
                          placeholder={`Re-scout ${activeField?.name} for ${selectedObsCategory}`}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={followUpDueDate}
                          onChange={(e) => setFollowUpDueDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous Step
              </button>

              {currentStep < 9 ? (
                <Button type="button" variant="primary" onClick={handleNext} className="text-xs font-bold">
                  Next Step →
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={isSubmitting} className="text-xs font-bold">
                  {isSubmitting ? 'Submitting Inspection...' : '✓ Complete & Log Inspection'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Live Inspection Summary Card (1 Column - Mobile Ready) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs self-start">
          <div className="pb-3 border-b border-gray-100">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Live Payload</span>
            <h3 className="text-sm font-bold text-gray-900">Inspection Summary Sheet</h3>
          </div>

          <div className="text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">1. Farm:</span>
              <strong className="text-gray-900 truncate max-w-[140px]">{activeFarm?.name || 'Selected Farm'}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">2. Field:</span>
              <strong className="text-gray-900 truncate max-w-[140px]">{activeField?.name || 'Field Parcel'}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">3. Crop:</span>
              <strong className="text-emerald-700 font-semibold">{selectedCropName}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">4. Growth Stage:</span>
              <strong className="text-gray-800 text-[11px]">{selectedGrowthStage}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">5. Condition:</span>
              <strong className="text-gray-800">{selectedCondition}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">6. Observation:</span>
              <strong className="capitalize text-gray-800">{selectedObsCategory}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">7. Severity:</span>
              <Badge variant={selectedSeverity === 'critical' ? 'red' : selectedSeverity === 'severe' ? 'amber' : 'blue'}>
                {selectedSeverity.toUpperCase()}
              </Badge>
            </div>

            <div className="py-1 border-b border-gray-100">
              <span className="text-gray-500 block mb-0.5">8. Notes:</span>
              <p className="text-[11px] text-gray-700 italic line-clamp-2">
                {notes || 'No custom remarks entered yet.'}
              </p>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-gray-500">9. Follow-up:</span>
              <strong className="text-gray-900">{createFollowUp ? `Scheduled (${followUpDueDate})` : 'Not Required'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Completed Inspections Stream */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Completed Field Inspections</h3>
            <p className="text-xs text-gray-500">Audit trail of completed physical transects</p>
          </div>
          <span className="text-xs font-mono text-gray-400">{completedInspections.length} Records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {completedInspections.slice(0, 6).map((obs) => (
            <div key={obs.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{obs.crop_name}</span>
                <Badge variant={obs.severity === 'critical' || obs.severity === 'severe' ? 'red' : 'green'}>
                  {obs.severity.toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-600 line-clamp-2">{obs.notes}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-200/60">
                <span>{obs.farm_name} ({obs.field_name})</span>
                <span className="font-mono">{new Date(obs.observed_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

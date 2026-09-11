"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { farmService } from '@/lib/services'
import { Badge } from '@/components/ui/DesignSystem'

const PROVINCES = [
  'Rift Valley (Nakuru, Uasin Gishu, Narok)',
  'Central Highlands (Nyeri, Kiambu, Murang\'a)',
  'Eastern Agro-Zone (Machakos, Embu, Meru)',
  'Western Wet Belt (Kakamega, Bungoma, Busia)',
  'Coast Semi-Arid (Kilifi, Kwale, Taita Taveta)',
]

const FARMING_ACTIVITIES = [
  { id: 'cereal', name: 'Grain & Cereals', icon: '🌾', desc: 'Maize, Wheat, Barley, Sorghum' },
  { id: 'tuber', name: 'Root Crops & Tubers', icon: '🥔', desc: 'Irish Potato, Sweet Potato, Cassava' },
  { id: 'horticulture', name: 'Commercial Vegetables', icon: '🥦', desc: 'French Beans, Tomatoes, Cabbage, Onions' },
  { id: 'cash_crops', name: 'Perennial Cash Crops', icon: '☕', desc: 'Tea, Coffee, Macadamia, Avocado' },
  { id: 'legumes', name: 'Pulses & Legumes', icon: '🫘', desc: 'Beans, Peas, Cowpeas, Lentils' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Step 1: Personal Information
  const [fullName, setFullName] = useState('Peter Otieno')
  const [phoneNumber, setPhoneNumber] = useState('+254 712 345 678')
  const [cooperative, setCooperative] = useState('Rift Valley Smallholders Association')

  // Step 2: Farm Information
  const [farmName, setFarmName] = useState('Green Ridge Highland Estate')
  const [description, setDescription] = useState('Highland agro-ecological estate specializing in certified seed and crop rotation.')

  // Step 3: Farm Location
  const [province, setProvince] = useState(PROVINCES[0])
  const [district, setDistrict] = useState('Nakuru North Sub-County')
  const [latitude, setLatitude] = useState(-0.303099)
  const [longitude, setLongitude] = useState(36.080026)

  // Step 4: Farm Area & Units
  const [areaSize, setAreaSize] = useState<number>(42.5)
  const [unit, setUnit] = useState<'hectares' | 'acres'>('hectares')

  // Step 5: Primary Farming Activities
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['cereal', 'tuber'])

  // Interactive Pin / Location Picker Simulation
  const handleMapPreset = (name: string, lat: number, lng: number) => {
    setDistrict(name)
    setLatitude(lat)
    setLongitude(lng)
  }

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    setSubmitting(true)
    const areaInHa = unit === 'acres' ? areaSize * 0.404686 : areaSize

    await farmService.createFarm({
      name: farmName,
      area_ha: areaInHa,
      latitude,
      longitude,
      notes: `${description} Activities: ${selectedActivities.join(', ')}`,
      location_name: `${district}, ${province}`,
    })

    setSubmitting(false)
    setCompleted(true)
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Top Branding */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              🌾
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg tracking-tight">AYIS Platform</span>
              <span className="text-xs text-gray-400 block">Farmer Welcome & Setup Experience</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            Skip for now →
          </Link>
        </div>

        {/* Multi-step progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
            <span>Step {currentStep} of 6</span>
            <span className="text-emerald-700 font-semibold">
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Farm Details'}
              {currentStep === 3 && 'Location & Coordinates'}
              {currentStep === 4 && 'Farm Size & Units'}
              {currentStep === 5 && 'Farming Activities'}
              {currentStep === 6 && 'Review & Activation'}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Cards Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-10">
          {completed ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-3xl mx-auto font-black shadow-xs">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Farm Setup Completed!</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                <span className="font-semibold text-gray-900">{farmName}</span> is now fully registered with precision coordinates. The agro-meteorological intelligence and recommendation engines are preparing your field forecasts.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Enter Agricultural Intelligence Dashboard →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 1: Personal Contact Details</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tell us who you are so advisory bulletins and field alerts reach you correctly.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Peter Otieno"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (SMS Alert Notifications)</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Cooperative or Farmer Group (Optional)</label>
                      <input
                        type="text"
                        value={cooperative}
                        onChange={(e) => setCooperative(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Nakuru Smallholders Union"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Farm Information */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 2: Farm Name & Description</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      What is the primary title and background of your agricultural land holding?
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Farm Name</label>
                      <input
                        type="text"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Green Ridge Highland Estate"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Optional Farm Description / History</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Share key terrain attributes, soil conditions, or crop histories..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Farm Location & Interactive Map UI */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 3: Farm Location & Geographic Coordinates</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Precise coordinates enable hyperlocal satellite precipitation and temperature modeling.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Province / Agro-Ecological Region</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">District / Sub-County</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Nakuru North Sub-County"
                      />
                    </div>
                  </div>

                  {/* Interactive Map UI Container */}
                  <div className="border border-gray-300 rounded-xl overflow-hidden bg-gray-100">
                    <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">📍 Interactive Field Location Pin</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMapPreset('Nakuru Highlands', -0.303099, 36.080026)}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100"
                        >
                          Nakuru
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMapPreset('Narok Terraces', -0.687231, 35.871142)}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100"
                        >
                          Narok
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMapPreset('Kitale Trials', 1.015723, 35.006248)}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100"
                        >
                          Kitale
                        </button>
                      </div>
                    </div>

                    <div className="h-44 relative bg-[#e2ede0] flex items-center justify-center p-4">
                      {/* Stylized Grid / Map Texture */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="relative text-center bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200 shadow-xs max-w-sm">
                        <div className="text-2xl mb-1">📍</div>
                        <p className="text-xs font-bold text-gray-900">{district}</p>
                        <p className="text-[11px] font-mono text-gray-500">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                          ✓ Centered on verified agro-meteorological station grid
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-3 bg-white border-t border-gray-200 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 uppercase">Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={latitude}
                          onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-mono border border-gray-200 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 uppercase">Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={longitude}
                          onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-mono border border-gray-200 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Farm Area & Units */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 4: Farm Size & Measurement Unit</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      State the total cultivated area to calibrate input recommendations and yield estimations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Land Size</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={areaSize}
                        onChange={(e) => setAreaSize(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Measurement Unit</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUnit('hectares')}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            unit === 'hectares'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Hectares (ha)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnit('acres')}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            unit === 'acres'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Acres (ac)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900">
                    <p className="font-semibold mb-0.5">Platform Metric Normalization</p>
                    <p>
                      AYIS automatically records this as{' '}
                      <span className="font-bold">
                        {unit === 'acres' ? (areaSize * 0.404686).toFixed(2) : areaSize.toFixed(2)} ha
                      </span>{' '}
                      for standardized agronomic fertilizer and seed rate algorithms.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: Primary Farming Activities */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 5: Primary Farming Activities</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select all crop types and commercial enterprises active on this land parcel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {FARMING_ACTIVITIES.map((act) => {
                      const selected = selectedActivities.includes(act.id)
                      return (
                        <div
                          key={act.id}
                          onClick={() => toggleActivity(act.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">{act.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 text-xs">{act.name}</h4>
                              {selected && <span className="text-emerald-700 font-bold text-xs">✓</span>}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{act.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: Confirmation & Review */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 6: Review & Final Confirmation</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify your farm setup details before activating your intelligence dashboard.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 text-xs">
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Operator</span>
                      <span className="font-bold text-gray-900">{fullName} ({phoneNumber})</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Farm Title</span>
                      <span className="font-bold text-gray-900">{farmName}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Cultivated Area</span>
                      <span className="font-bold text-gray-900">{areaSize} {unit}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="font-bold text-gray-900">{district}, {province}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Coordinates</span>
                      <span className="font-mono text-gray-900">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-gray-500">Activities Selected</span>
                      <span className="font-semibold text-emerald-800 capitalize">
                        {selectedActivities.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    ← Previous Step
                  </button>
                ) : <span />}

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Continue to Step {currentStep + 1} →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinish}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Registering Farm...</span>
                      </>
                    ) : (
                      'Confirm & Register Farm'
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 mt-10">
        AYIS · Agricultural Yield Intelligence Platform · Simple & Accessible for Farmers
      </footer>
    </div>
  )
}

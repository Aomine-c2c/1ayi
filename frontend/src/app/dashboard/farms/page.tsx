"use client"
import React, { useState, useEffect } from 'react'
import { farmService, fieldService } from '@/lib/services'
import type { Farm, Field } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

export default function FarmManagerFarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  // Registration Form State
  const [name, setName] = useState('')
  const [area, setArea] = useState<number>(20)
  const [locationName, setLocationName] = useState('Nakuru North, Rift Valley')
  const [soilType, setSoilType] = useState('Volcanic Clay Loam')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const data = await farmService.listFarms()
      setFarms(data)
      if (data.length > 0) {
        setSelectedFarm(data[0])
        const fList = await fieldService.listFieldsByFarm(data[0].id)
        setFields(fList)
      }
    }
    load()
  }, [])

  const handleSelectFarm = async (f: Farm) => {
    setSelectedFarm(f)
    const fList = await fieldService.listFieldsByFarm(f.id)
    setFields(fList)
  }

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await farmService.createFarm({
      name,
      area_ha: area,
      location_name: locationName,
      soil_type: soilType,
      notes,
    })
    setFarms([created, ...farms])
    setSelectedFarm(created)
    setIsRegisterOpen(false)
    setName('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Farms</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farm Portfolio Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit multiple agricultural holdings, benchmark land productivity, and inspect field boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Farm Cards
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'comparison' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Farm Comparison
            </button>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>＋</span>
            <span>Register Farm</span>
          </button>
        </div>
      </div>

      {/* Comparison View vs Cards View */}
      {viewMode === 'comparison' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Multi-Farm Performance Comparison Table</h2>
            <p className="text-xs text-gray-500">Benchmark soil classifications, total area, and field allocations across estates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Farm Holding</th>
                  <th className="py-3 px-4">Agro-Region</th>
                  <th className="py-3 px-4 text-right">Total Area</th>
                  <th className="py-3 px-4">Dominant Soil Type</th>
                  <th className="py-3 px-4">Data Classification</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {farms.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {f.name.charAt(0)}
                      </span>
                      <span>{f.name}</span>
                    </td>
                    <td className="py-4 px-4">{f.location_name || 'Rift Valley'}</td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">{f.area_ha} ha</td>
                    <td className="py-4 px-4">{f.soil_type || 'Volcanic Loam'}</td>
                    <td className="py-4 px-4">
                      <Badge variant="green">{f.data_classification || 'INTERNAL'}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => { handleSelectFarm(f); setViewMode('cards') }}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        Inspect Fields →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {farms.map((f) => {
            const isSelected = selectedFarm?.id === f.id
            return (
              <div
                key={f.id}
                onClick={() => handleSelectFarm(f)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center border border-emerald-200">
                    {f.name.charAt(0)}
                  </div>
                  <Badge variant={isSelected ? 'green' : 'gray'}>
                    {f.area_ha ? `${f.area_ha} ha` : 'Estate'}
                  </Badge>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{f.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{f.location_name || 'Rift Valley Region'}</p>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 text-[11px] text-gray-600">
                  <div>
                    <span className="text-gray-400 block uppercase font-medium text-[9px]">Soil Type</span>
                    <span className="font-semibold text-gray-800">{f.soil_type || 'Volcanic Loam'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-medium text-[9px]">Active Operations</span>
                    <span className="font-semibold text-emerald-700">Drip & Sprinkler</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Farm Detail & Field Management Section */}
      {selectedFarm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Operational Estate Details
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selectedFarm.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedFarm.location_name} · GPS Coordinates: {selectedFarm.latitude?.toFixed(4)}, {selectedFarm.longitude?.toFixed(4)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total Land: {selectedFarm.area_ha} ha
              </span>
            </div>
          </div>

          {/* Farm Map Representation */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-800">📍 Satellite Field Boundary Layout</span>
              <span className="text-emerald-700 font-semibold text-[11px]">GeoJSON Verified Polygon</span>
            </div>
            <div className="h-48 bg-[#e3ece0] flex items-center justify-center relative p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative bg-white/95 p-4 rounded-xl border border-emerald-200 text-center shadow-xs max-w-sm">
                <p className="font-bold text-xs text-gray-900">{selectedFarm.name}</p>
                <p className="text-[11px] text-gray-500">{fields.length} Cultivated Field Blocks identified</p>
                <p className="text-[10px] text-emerald-800 font-mono mt-1">
                  Lat: {selectedFarm.latitude?.toFixed(6)} | Lng: {selectedFarm.longitude?.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Field Management / Parcels List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Fields & Management Parcels</h3>
              <span className="text-xs text-gray-500">{fields.length} Sub-Plots</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fields.map((f) => (
                <div key={f.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-xs">{f.name}</h4>
                    <Badge variant="blue">{f.area_ha} ha</Badge>
                  </div>
                  <div className="text-[11px] text-gray-500 space-y-0.5">
                    <p>Irrigation: <span className="capitalize font-semibold text-gray-700">{f.irrigation_type}</span></p>
                    <p>Soil pH: <span className="font-semibold text-gray-700">{f.soil_ph}</span></p>
                    <p>Status: <span className="capitalize font-semibold text-emerald-700">{f.status}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Register Farm Modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register Agricultural Holding">
        <form onSubmit={handleCreateFarm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Estate / Farm Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mau View Commercial Block"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Area (ha)</label>
              <input
                type="number"
                step="0.1"
                required
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Province</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Soil Type</label>
            <input
              type="text"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Management Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Cropping strategy, slope, water reservoir access..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Register Farm Holding
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

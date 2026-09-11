"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { extensionService, authService, farmService, fieldService } from '@/lib/services'
import type { FieldVisit, User, Farm, Field } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

export default function FieldVisitsPage() {
  const [visits, setVisits] = useState<FieldVisit[]>([])
  const [farmers, setFarmers] = useState<User[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [selectedVisit, setSelectedVisit] = useState<FieldVisit | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  // Form State
  const [formFarmerId, setFormFarmerId] = useState<number>(3)
  const [formFarmId, setFormFarmId] = useState<number>(1)
  const [formFieldName, setFormFieldName] = useState('North Terrace Block A')
  const [formDate, setFormDate] = useState('2025-09-15T10:00')
  const [formPurpose, setFormPurpose] = useState('')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    async function load() {
      const [vList, uList, fList, fieldList] = await Promise.all([
        extensionService.listVisits(),
        authService.listUsers(),
        farmService.listFarms(),
        fieldService.listFieldsByFarm(),
      ])
      setVisits(vList)
      setFarmers(uList.filter((u) => u.role === 'farmer'))
      setFarms(fList)
      setFields(fieldList)
      if (vList.length > 0) setSelectedVisit(vList[0])
    }
    load()
  }, [])

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    const farmerObj = farmers.find((f) => f.id === formFarmerId)
    const farmObj = farms.find((f) => f.id === formFarmId)

    const created = await extensionService.createVisit({
      farmer_id: formFarmerId,
      farmer_name: farmerObj ? `${farmerObj.first_name} ${farmerObj.last_name}` : 'Peter Otieno',
      farm_id: formFarmId,
      farm_name: farmObj?.name || 'Green Ridge Highland Estate',
      field_name: formFieldName,
      visit_date: new Date(formDate).toISOString(),
      purpose: formPurpose,
      status: 'scheduled',
      notes: formNotes,
    })

    setVisits([created, ...visits])
    setSelectedVisit(created)
    setIsScheduleOpen(false)
    setFormPurpose('')
    setFormNotes('')
  }

  const handleStatusChange = async (id: number, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    await extensionService.updateVisitStatus(id, status)
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    )
    if (selectedVisit && selectedVisit.id === id) {
      setSelectedVisit({ ...selectedVisit, status })
    }
  }

  const filteredVisits = visits.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
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
            <span className="text-gray-800 font-semibold">Field Visits</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">On-Site Field Visits & Itinerary</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Plan, coordinate, and document extension officer farm audits, farmer guidance, and agronomic verifications.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Schedule New Visit</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-bold uppercase text-[10px] pr-1">Filter Status:</span>
          {['all', 'scheduled', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-all capitalize ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'all' ? 'All Visits' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="text-gray-500 text-[11px]">
          Total: <strong className="text-gray-800">{filteredVisits.length}</strong> visits logged
        </span>
      </div>

      {/* Split Interface: Visit List vs Visit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visit Cards */}
        <div className="lg:col-span-5 space-y-3">
          {filteredVisits.map((visit) => {
            const isSelected = selectedVisit?.id === visit.id

            return (
              <div
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">{visit.purpose}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Farmer: <strong className="text-gray-800">{visit.farmer_name}</strong> · {visit.farm_name}
                    </p>
                  </div>
                  <Badge variant={visit.status === 'completed' ? 'green' : visit.status === 'in_progress' ? 'amber' : 'blue'}>
                    {visit.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                  <span>Field: {visit.field_name}</span>
                  <span className="font-bold text-emerald-800">
                    📅 {new Date(visit.visit_date).toLocaleDateString()} at {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Visit Detailed Inspector */}
        <div className="lg:col-span-7">
          {selectedVisit ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs sticky top-24">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={selectedVisit.status === 'completed' ? 'green' : 'blue'}>
                      {selectedVisit.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-400">ID #{selectedVisit.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedVisit.purpose}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Farmer Contact: <strong className="text-gray-800">{selectedVisit.farmer_name}</strong> · {selectedVisit.farm_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedVisit.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedVisit.id, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                    >
                      Mark Completed
                    </button>
                  )}
                  {selectedVisit.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(selectedVisit.id, 'in_progress')}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Start Visit
                    </button>
                  )}
                </div>
              </div>

              {/* Visit Specification Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Farmer</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedVisit.farmer_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Farm Holding</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedVisit.farm_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Field Target</span>
                  <span className="font-bold text-emerald-800 mt-0.5 block truncate">{selectedVisit.field_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Scheduled Date</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">
                    {new Date(selectedVisit.visit_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Extension Officer Notes */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Visit Itinerary & Preparation Notes
                </h3>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 leading-relaxed">
                  {selectedVisit.notes || 'No preparatory notes entered for this visit.'}
                </div>
              </div>

              {/* Findings Summary (if completed) */}
              {selectedVisit.findings_summary && (
                <div className="space-y-2 text-xs">
                  <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                    Field Audit Findings Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-950 leading-relaxed">
                    {selectedVisit.findings_summary}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Assigned Officer: <strong className="text-gray-700">{selectedVisit.officer_name}</strong>
                </span>
                <Link
                  href="/dashboard/observations"
                  className="text-emerald-800 font-bold hover:underline"
                >
                  Log Observation for this Visit →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              Select a field visit to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Technical Farm Visit"
      >
        <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Farmer</label>
            <select
              value={formFarmerId}
              onChange={(e) => setFormFarmerId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>{f.first_name} {f.last_name} ({f.organization || 'Smallholder'})</option>
              ))}
            </select>
          </div>

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
              <label className="block font-semibold text-gray-700 mb-1">Target Field / Block</label>
              <input
                type="text"
                required
                value={formFieldName}
                onChange={(e) => setFormFieldName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Visit Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Purpose of Visit</label>
            <input
              type="text"
              required
              placeholder="e.g. Inspect Fall Armyworm pheromone trap & check moisture status"
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Preparatory Notes / Equipment</label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Detail required test kits, trap lures, or specific farmer questions..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Confirm Visit Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

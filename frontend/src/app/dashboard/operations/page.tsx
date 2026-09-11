"use client"
import React, { useState } from 'react'
import { Badge, Modal } from '@/components/ui/DesignSystem'

interface FieldOperation {
  id: number
  title: string
  category: 'irrigation' | 'fertilizer' | 'scouting' | 'planting' | 'harvest'
  farm: string
  field: string
  operator: string
  date: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'urgent' | 'high' | 'normal'
  notes: string
}

const INITIAL_OPERATIONS: FieldOperation[] = [
  {
    id: 1,
    title: 'Calibrate drip fertigation injectors on North Terrace',
    category: 'irrigation',
    farm: 'Green Ridge Highland Estate',
    field: 'North Terrace Block A',
    operator: 'Kiprono Koech',
    date: '2025-09-12',
    status: 'pending',
    priority: 'high',
    notes: 'Apply calcium nitrate booster according to recommendation #3.',
  },
  {
    id: 2,
    title: 'Foliar scouting for early Fall Armyworm egg masses',
    category: 'scouting',
    farm: 'Green Ridge Highland Estate',
    field: 'North Terrace Block A',
    operator: 'Wanjiku Mwangi',
    date: '2025-09-13',
    status: 'pending',
    priority: 'urgent',
    notes: 'Target 20 randomized plants across 4 quadrants.',
  },
  {
    id: 3,
    title: 'Sub-surface ditch maintenance and drain clearing',
    category: 'irrigation',
    farm: 'Mau Escarpment Terraces',
    field: 'Ridge Plot 1',
    operator: 'Paul Mutua',
    date: '2025-09-14',
    status: 'in_progress',
    priority: 'normal',
    notes: 'Clear silt traps before convective rain front arrival.',
  },
  {
    id: 4,
    title: 'Potato harvest batch collection & grading',
    category: 'harvest',
    farm: 'Green Ridge Highland Estate',
    field: 'Valley Bottom Block B',
    operator: 'Field Crew Team 1',
    date: '2025-08-28',
    status: 'completed',
    priority: 'high',
    notes: '19.2 tonnes harvested; graded seed grade G2 bagged.',
  },
]

export default function FieldOperationsPage() {
  const [operations, setOperations] = useState<FieldOperation[]>(INITIAL_OPERATIONS)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isNewOpen, setIsNewOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'irrigation' | 'fertilizer' | 'scouting' | 'planting' | 'harvest'>('irrigation')
  const [farm, setFarm] = useState('Green Ridge Highland Estate')
  const [field, setField] = useState('North Terrace Block A')
  const [operator, setOperator] = useState('Kiprono Koech')
  const [date, setDate] = useState('2025-09-15')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal'>('high')
  const [notes, setNotes] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const op: FieldOperation = {
      id: Date.now(),
      title,
      category,
      farm,
      field,
      operator,
      date,
      status: 'pending',
      priority,
      notes,
    }
    setOperations([op, ...operations])
    setIsNewOpen(false)
    setTitle('')
    setNotes('')
  }

  const toggleStatus = (id: number) => {
    setOperations((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const nextStatus = o.status === 'pending' ? 'in_progress' : o.status === 'in_progress' ? 'completed' : 'pending'
        return { ...o, status: nextStatus }
      })
    )
  }

  const filtered = filterCategory === 'all'
    ? operations
    : operations.filter((o) => o.category === filterCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Field Operations</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Field Operations & Labor Dispatch</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordinate field tasks, tractor passes, scouting runs, and input applications across farm blocks.
          </p>
        </div>

        <button
          onClick={() => setIsNewOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['all', 'irrigation', 'fertilizer', 'scouting', 'planting', 'harvest'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              filterCategory === cat
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat === 'all' ? 'All Operations' : cat}
          </button>
        ))}
      </div>

      {/* Operations List */}
      <div className="space-y-3">
        {filtered.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0 border border-emerald-100">
                {op.category === 'irrigation' ? '💧' : op.category === 'fertilizer' ? '🌱' : op.category === 'scouting' ? '🔍' : '🚜'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-sm">{op.title}</h3>
                  <Badge variant={op.priority === 'urgent' ? 'red' : op.priority === 'high' ? 'amber' : 'blue'}>
                    {op.priority.toUpperCase()}
                  </Badge>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    op.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : op.status === 'in_progress'
                      ? 'bg-sky-50 text-sky-800 border-sky-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {op.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  📍 <span className="font-medium text-gray-700">{op.farm}</span> ({op.field}) · Assigned: <span className="font-semibold text-gray-800">{op.operator}</span>
                </p>
                {op.notes && (
                  <p className="text-xs text-gray-600 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                    {op.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
              <span className="text-xs font-bold text-gray-700">Scheduled: {op.date}</span>
              <button
                onClick={() => toggleStatus(op.id)}
                className="text-xs bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-bold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
              >
                {op.status === 'completed' ? 'Reopen' : op.status === 'in_progress' ? 'Mark Completed' : 'Start Task'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Operation Modal */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Dispatch Field Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inspect drip pressure regulator on Plot 2"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Activity Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="irrigation">Irrigation / Water Control</option>
                <option value="fertilizer">Fertilizer Application</option>
                <option value="scouting">Crop Scouting / Pest Inspection</option>
                <option value="planting">Planting / Seeding</option>
                <option value="harvest">Harvesting / Sorting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Field Operator</label>
              <input
                type="text"
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions / Protocols</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dosage rate, equipment needed, safety protocol..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Dispatch Operation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

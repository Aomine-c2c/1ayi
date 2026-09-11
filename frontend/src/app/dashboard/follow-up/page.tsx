"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { extensionService, farmService, authService } from '@/lib/services'
import type { FollowUpTask, Farm, User } from '@/lib/types'
import { Badge, Modal } from '@/components/ui/DesignSystem'

export default function FollowUpTaskBoardPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmers, setFarmers] = useState<User[]>([])
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'high_risk' | 'assistance'>('pending')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // New Task Form State
  const [formFarmerId, setFormFarmerId] = useState<number>(3)
  const [formFarmId, setFormFarmId] = useState<number>(1)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<any>('assistance_request')
  const [formPriority, setFormPriority] = useState<any>('high')
  const [formDueDate, setFormDueDate] = useState('2025-09-15')
  const [formDescription, setFormDescription] = useState('')

  useEffect(() => {
    async function load() {
      const [tList, fList, uList] = await Promise.all([
        extensionService.listFollowUps(),
        farmService.listFarms(),
        authService.listUsers(),
      ])
      setTasks(tList)
      setFarms(fList)
      setFarmers(uList.filter((u) => u.role === 'farmer'))
      if (tList.length > 0) setSelectedTask(tList[0])
    }
    load()
  }, [])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const farmerObj = farmers.find((f) => f.id === formFarmerId)
    const farmObj = farms.find((f) => f.id === formFarmId)

    const created = await extensionService.createFollowUp({
      farmer_id: formFarmerId,
      farmer_name: farmerObj ? `${farmerObj.first_name} ${farmerObj.last_name}` : 'Peter Otieno',
      farm_id: formFarmId,
      farm_name: farmObj?.name || 'Green Ridge Highland Estate',
      title: formTitle,
      task_type: formType,
      priority: formPriority,
      status: 'pending',
      due_date: formDueDate,
      description: formDescription,
    })

    setTasks([created, ...tasks])
    setSelectedTask(created)
    setIsCreateOpen(false)
    setFormTitle('')
    setFormDescription('')
  }

  const handleUpdateStatus = async (id: number, status: 'pending' | 'in_progress' | 'completed') => {
    await extensionService.updateFollowUpStatus(id, status)
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    )
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status })
    }
  }

  // Filter groups matching specification:
  // Pending follow-ups, Completed follow-ups, High-risk farms, Farmer assistance requests
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in_progress'
    if (activeTab === 'completed') return t.status === 'completed'
    if (activeTab === 'high_risk') return t.priority === 'critical' || t.priority === 'high'
    if (activeTab === 'assistance') return t.task_type === 'assistance_request'
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
            <span className="text-gray-800 font-semibold">Follow-Up Tasks</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Technical Follow-Up & Farmer Assistance</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Task-style resolution interface for pending follow-ups, high-risk holdings, and inbound farmer assistance calls.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Create Follow-up Task</span>
        </button>
      </div>

      {/* Task Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex gap-1.5 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending Tasks ({tasks.filter((t) => t.status !== 'completed').length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed Follow-ups ({tasks.filter((t) => t.status === 'completed').length})
        </button>

        <button
          onClick={() => setActiveTab('high_risk')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'high_risk'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          🚨 High-Risk Farms ({tasks.filter((t) => t.priority === 'critical' || t.priority === 'high').length})
        </button>

        <button
          onClick={() => setActiveTab('assistance')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'assistance'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          🆘 Farmer Assistance ({tasks.filter((t) => t.task_type === 'assistance_request').length})
        </button>
      </div>

      {/* Split View: Task List vs Task Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task List Cards */}
        <div className="lg:col-span-5 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              No tasks found under this filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTask?.id === task.id

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{task.title}</h4>
                      <span className="text-[11px] text-gray-500 block">
                        Farmer: <strong className="text-gray-800">{task.farmer_name}</strong> · {task.farm_name}
                      </span>
                    </div>

                    <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'blue'}>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                    <span className="capitalize">{task.task_type.replace('_', ' ')}</span>
                    <span className="font-bold text-rose-700">Due: {task.due_date}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Task Detail Inspector */}
        <div className="lg:col-span-7">
          {selectedTask ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs sticky top-24">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant={selectedTask.priority === 'critical' ? 'red' : selectedTask.priority === 'high' ? 'amber' : 'blue'}>
                      {selectedTask.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="green">
                      STATUS: {selectedTask.status.toUpperCase()}
                    </Badge>
                    <Badge variant="gray">
                      {selectedTask.task_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Farmer Contact: <strong className="text-gray-800">{selectedTask.farmer_name}</strong> ({selectedTask.farm_name})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTask.status !== 'completed' ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                    >
                      Mark Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'pending')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reopen Task
                    </button>
                  )}
                </div>
              </div>

              {/* Task Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Farmer Name</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedTask.farmer_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Farm Estate</span>
                  <span className="font-bold text-gray-900 mt-0.5 block truncate">{selectedTask.farm_name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Target Due Date</span>
                  <span className="font-bold text-rose-700 mt-0.5 block truncate">{selectedTask.due_date}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Resolution Status</span>
                  <span className="font-bold text-emerald-800 mt-0.5 block truncate capitalize">{selectedTask.status}</span>
                </div>
              </div>

              {/* Description & Technical Instructions */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Task Directive & Technical Follow-up Details
                </h3>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 leading-relaxed font-sans">
                  {selectedTask.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <Link
                  href="/dashboard/visits"
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold px-3 py-2 rounded-xl border border-emerald-200"
                >
                  🚗 Schedule Farm Visit for this Task
                </Link>

                <Link
                  href="/dashboard/recommendations"
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  Send Advisory Recommendation →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center text-xs text-gray-400">
              Select a task to view details.
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Technical Follow-up Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Farmer</label>
            <select
              value={formFarmerId}
              onChange={(e) => setFormFarmerId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
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

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Verify Fall Armyworm pheromone trap catches"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Task Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="assistance_request">Farmer Assistance</option>
                <option value="risk_mitigation">Risk Mitigation</option>
                <option value="scouting">Scouting Follow-up</option>
                <option value="inspection">Compliance Check</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Detailed Technical Instructions</label>
            <textarea
              rows={4}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Detail required steps, thresholds, and evidence required for closure..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Save Follow-up Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

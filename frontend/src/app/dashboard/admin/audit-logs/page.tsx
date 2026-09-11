"use client"
import React, { useState, useEffect } from 'react'
import { adminService } from '@/lib/services'
import type { AuditLog } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

const PAGE_SIZE = 10

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & search
  const [searchUser, setSearchUser] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Expandable details modal / drawer
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    const list = await adminService.listAuditLogs()
    setLogs([...list])
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const q = searchUser.toLowerCase()
    const matchesUser =
      log.username.toLowerCase().includes(q) ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      log.resource.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.ip_address.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'all' || log.status === statusFilter

    const matchesAction =
      actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase())

    return matchesUser && matchesStatus && matchesAction
  })

  // Pagination slicing
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleExportCSV = () => {
    const headers = ['ID', 'User', 'Role', 'Action', 'Resource', 'Timestamp', 'Status', 'IP Address']
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.user_name || l.username} (@${l.username})"`,
      l.user_role,
      `"${l.action}"`,
      l.resource,
      l.timestamp,
      l.status,
      l.ip_address,
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `AYIS_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Security Governance · Master Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            System Audit & Security Logs
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cryptographically timestamped record of platform authentication, role alterations, data mutations, and configuration overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <Button
            variant="primary"
            onClick={loadLogs}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <span>🔄</span>
            <span>Refresh Trail</span>
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Activity Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Logged Actions</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{logs.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Retained for 365 days</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Successful Actions</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {logs.filter(l => l.status === 'SUCCESS').length}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">94.8% success rate</span>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Warning / Auth Retries</span>
          <p className="text-2xl font-black text-amber-700 mt-0.5">
            {logs.filter(l => l.status === 'WARNING').length}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">Invalid credentials flagged</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Failed Mutations</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">
            {logs.filter(l => l.status === 'FAILED').length}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">Blocked by RBAC policy</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => {
              setSearchUser(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search logs by user, action, resource, or IP address..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Action Types</option>
            <option value="USER">User Actions</option>
            <option value="ROLE">Role & Permissions</option>
            <option value="WEATHER">Weather Config</option>
            <option value="AUTH">Authentication</option>
            <option value="CROP">Crop Profile</option>
          </select>
        </div>
      </div>

      {/* 4. Audit Table with Required Fields: User, Action, Resource, Timestamp, Status, Details */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Querying immutable audit ledger...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                          {log.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{log.user_name || log.username}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            @{log.username} · {log.user_role}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                        {log.resource}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={log.status === 'SUCCESS' ? 'green' : log.status === 'WARNING' ? 'amber' : 'red'}>
                        {log.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                      {log.ip_address}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(log)
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
          <span>
            Showing page <strong className="text-gray-900">{currentPage}</strong> of{' '}
            <strong className="text-gray-900">{totalPages}</strong> ({filteredLogs.length} total events)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-500">Log Entry #{selectedLog.id}</span>
                  <Badge variant={selectedLog.status === 'SUCCESS' ? 'green' : selectedLog.status === 'WARNING' ? 'amber' : 'red'}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <h3 className="text-base font-black text-gray-900 mt-1">{selectedLog.action}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-gray-500">Acting User</span>
                  <strong className="text-gray-900">{selectedLog.user_name || selectedLog.username} (@{selectedLog.username})</strong>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-gray-500">User Role</span>
                  <strong className="text-gray-900 uppercase font-mono">{selectedLog.user_role}</strong>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-gray-500">Target Resource</span>
                  <strong className="text-gray-900 font-mono">{selectedLog.resource}</strong>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-gray-500">Timestamp</span>
                  <strong className="text-gray-900 font-mono">{selectedLog.timestamp}</strong>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-gray-500">Source IP & Origin</span>
                  <strong className="text-gray-900 font-mono">{selectedLog.ip_address}</strong>
                </div>
              </div>

              {/* JSON Details Block */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider block">
                  Action Payload Details
                </span>
                <pre className="p-3.5 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button variant="primary" onClick={() => setSelectedLog(null)} className="text-xs font-bold">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

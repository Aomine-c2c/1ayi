"use client"
import React, { useState } from 'react'
import type { UserRole } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

// Rows requested by user:
// Dashboard, Farms, Fields, Crops, Crop Profiles, Weather, Recommendations, Yield, Reports, Users, Settings
const RESOURCES = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Platform operational overview & telemetry widgets' },
  { id: 'farms', label: 'Farms', desc: 'Registered farm land holdings & boundaries' },
  { id: 'fields', label: 'Fields', desc: 'Field parcels, soil test logs & planting zones' },
  { id: 'crops', label: 'Crops', desc: 'Active crop cycles & seasonal planting timelines' },
  { id: 'crop_profiles', label: 'Crop Profiles', desc: 'Phenological requirements, thermal & yield parameters' },
  { id: 'weather', label: 'Weather', desc: 'Live station feeds, forecasts & historical metrics' },
  { id: 'recommendations', label: 'Recommendations', desc: 'Agronomic interventions & ML-generated advisories' },
  { id: 'yield', label: 'Yield', desc: 'Harvest predictions, benchmarking & risk models' },
  { id: 'reports', label: 'Reports', desc: 'Dossiers, agronomy audits & regulatory exports' },
  { id: 'users', label: 'Users', desc: 'Platform tenant directory, credentials & provisioning' },
  { id: 'settings', label: 'Settings', desc: 'System-wide configuration, units & threshold limits' },
]

// Columns requested by user:
// View, Create, Edit, Delete, Approve, Export
const ACTIONS = [
  { id: 'view', label: 'View', desc: 'Read-only access' },
  { id: 'create', label: 'Create', desc: 'Create new records' },
  { id: 'edit', label: 'Edit', desc: 'Modify existing data' },
  { id: 'delete', label: 'Delete', desc: 'Remove records' },
  { id: 'approve', label: 'Approve', desc: 'Authorize & approve' },
  { id: 'export', label: 'Export', desc: 'Download CSV / PDF' },
]

type PermissionMatrix = Record<string, Record<string, boolean>>

// Initial baseline matrix by role
const DEFAULT_ROLE_MATRICES: Record<UserRole, PermissionMatrix> = {
  admin: {
    dashboard: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    farms: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    fields: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    crops: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    crop_profiles: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    weather: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    recommendations: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    yield: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    users: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    settings: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
  },
  farm_manager: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    fields: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    crops: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    recommendations: { view: true, create: false, edit: true, delete: false, approve: true, export: true },
    yield: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  },
  agronomist: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    fields: { view: true, create: false, edit: true, delete: false, approve: false, export: true },
    crops: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    crop_profiles: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    recommendations: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    yield: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    reports: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
  extension_officer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    fields: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    crops: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    recommendations: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
    users: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
  farmer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    farms: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    fields: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    crops: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    reports: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
  weather_analyst: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    fields: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    crops: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    reports: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
  },
  data_analyst: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    fields: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    crops: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    reports: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
  },
  field_officer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    fields: { view: true, create: false, edit: true, delete: false, approve: false, export: true },
    crops: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
  viewer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    farms: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    fields: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    crops: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    yield: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    reports: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  },
}

const ROLES: { id: UserRole; name: string; badgeVariant: 'red' | 'purple' | 'green' | 'blue' | 'amber' | 'gray' }[] = [
  { id: 'admin', name: 'System Administrator', badgeVariant: 'red' },
  { id: 'farm_manager', name: 'Farm Manager', badgeVariant: 'purple' },
  { id: 'agronomist', name: 'Agronomist', badgeVariant: 'green' },
  { id: 'extension_officer', name: 'Extension Officer', badgeVariant: 'blue' },
  { id: 'field_officer', name: 'Field Officer', badgeVariant: 'green' },
  { id: 'farmer', name: 'Farmer', badgeVariant: 'amber' },
  { id: 'weather_analyst', name: 'Weather Analyst', badgeVariant: 'blue' },
  { id: 'data_analyst', name: 'Data Analyst', badgeVariant: 'blue' },
  { id: 'viewer', name: 'Viewer (Read-Only)', badgeVariant: 'gray' },
]

export default function RolesPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')
  const [matrixState, setMatrixState] = useState<Record<UserRole, PermissionMatrix>>(DEFAULT_ROLE_MATRICES)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const currentPermissions = matrixState[selectedRole]

  const handleToggle = (resourceId: string, actionId: string) => {
    // If admin, enforce all true unless intentionally customized
    setMatrixState(prev => {
      const currentRoleMatrix = { ...prev[selectedRole] }
      const currentResourcePerms = { ...currentRoleMatrix[resourceId] }
      currentResourcePerms[actionId] = !currentResourcePerms[actionId]
      currentRoleMatrix[resourceId] = currentResourcePerms
      return {
        ...prev,
        [selectedRole]: currentRoleMatrix,
      }
    })
    setHasUnsavedChanges(true)
    setSaveSuccess(false)
  }

  const handleToggleAllRow = (resourceId: string, enable: boolean) => {
    setMatrixState(prev => {
      const currentRoleMatrix = { ...prev[selectedRole] }
      const currentResourcePerms = { ...currentRoleMatrix[resourceId] }
      ACTIONS.forEach(a => {
        currentResourcePerms[a.id] = enable
      })
      currentRoleMatrix[resourceId] = currentResourcePerms
      return {
        ...prev,
        [selectedRole]: currentRoleMatrix,
      }
    })
    setHasUnsavedChanges(true)
    setSaveSuccess(false)
  }

  const handleToggleAllCol = (actionId: string, enable: boolean) => {
    setMatrixState(prev => {
      const currentRoleMatrix = { ...prev[selectedRole] }
      RESOURCES.forEach(r => {
        if (!currentRoleMatrix[r.id]) currentRoleMatrix[r.id] = {}
        currentRoleMatrix[r.id] = {
          ...currentRoleMatrix[r.id],
          [actionId]: enable,
        }
      })
      return {
        ...prev,
        [selectedRole]: currentRoleMatrix,
      }
    })
    setHasUnsavedChanges(true)
    setSaveSuccess(false)
  }

  const handleResetToDefault = () => {
    setMatrixState(prev => ({
      ...prev,
      [selectedRole]: JSON.parse(JSON.stringify(DEFAULT_ROLE_MATRICES[selectedRole])),
    }))
    setHasUnsavedChanges(true)
    setSaveSuccess(false)
  }

  const handleSaveChanges = () => {
    setHasUnsavedChanges(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const countGranted = (role: UserRole) => {
    const mat = matrixState[role]
    let total = 0
    Object.values(mat).forEach(res => {
      Object.values(res).forEach(granted => {
        if (granted) total++
      })
    })
    return total
  }

  const totalPossible = RESOURCES.length * ACTIONS.length

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Access Governance · RBAC Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Role-Based Permissions Matrix
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure granular permissions across 11 core platform modules and 6 operational privileges.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
              Unsaved Changes
            </span>
          )}
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ✓ Matrix Saved
            </span>
          )}
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Reset Defaults
          </button>
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className="text-xs font-bold shadow-xs"
          >
            Save Matrix
          </Button>
        </div>
      </div>

      {/* 2. Role Selector Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {ROLES.map((r) => {
            const active = selectedRole === r.id
            const grantedCount = countGranted(r.id)
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{r.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-700'
                  }`}
                >
                  {grantedCount}/{totalPossible}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Active Role Summary Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center border border-emerald-200">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                {ROLES.find(r => r.id === selectedRole)?.name}
              </h2>
              <Badge variant={ROLES.find(r => r.id === selectedRole)?.badgeVariant || 'gray'}>
                {selectedRole.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Granted {countGranted(selectedRole)} of {totalPossible} total platform capabilities ({(countGranted(selectedRole) / totalPossible * 100).toFixed(0)}% access coverage).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Quick Matrix Actions:</span>
          <button
            onClick={() => {
              RESOURCES.forEach(r => handleToggleAllRow(r.id, true))
            }}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Grant All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              RESOURCES.forEach(r => handleToggleAllRow(r.id, false))
            }}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            Revoke All
          </button>
        </div>
      </div>

      {/* 4. Interactive Permissions Matrix Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-1/3">Resource Module</th>
                {ACTIONS.map((a) => (
                  <th key={a.id} className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{a.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAllCol(a.id, true)}
                          className="text-[9px] text-emerald-700 hover:underline font-mono lowercase"
                          title={`Grant ${a.label} across all resources`}
                        >
                          +all
                        </button>
                        <span className="text-gray-300 text-[9px]">/</span>
                        <button
                          onClick={() => handleToggleAllCol(a.id, false)}
                          className="text-[9px] text-gray-400 hover:underline font-mono lowercase"
                          title={`Revoke ${a.label} across all resources`}
                        >
                          -all
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-right">Row Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RESOURCES.map((res) => {
                const rowPerms = currentPermissions[res.id] || {}
                const allRowGranted = ACTIONS.every(a => rowPerms[a.id])

                return (
                  <tr key={res.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{res.label}</p>
                        <p className="text-[10px] text-gray-500">{res.desc}</p>
                      </div>
                    </td>

                    {ACTIONS.map((action) => {
                      const isGranted = !!rowPerms[action.id]
                      return (
                        <td key={action.id} className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(res.id, action.id)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              isGranted
                                ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                            }`}
                            title={`${isGranted ? 'Revoke' : 'Grant'} ${action.label} on ${res.label}`}
                          >
                            {isGranted ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </td>
                      )
                    })}

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleAllRow(res.id, !allRowGranted)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                            allRowGranted
                              ? 'text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {allRowGranted ? 'Revoke Row' : 'Grant All'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"
import React, { useState, useEffect } from 'react'
import { authService, adminService } from '@/lib/services'
import type { User, UserRole } from '@/lib/types'
import { Badge, Button } from '@/components/ui/DesignSystem'

const ROLE_OPTIONS: { value: UserRole; label: string; badgeVariant: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray' }[] = [
  { value: 'admin', label: 'System Administrator', badgeVariant: 'red' },
  { value: 'farm_manager', label: 'Farm Manager', badgeVariant: 'purple' },
  { value: 'agronomist', label: 'Agronomist', badgeVariant: 'green' },
  { value: 'extension_officer', label: 'Extension Officer', badgeVariant: 'blue' },
  { value: 'farmer', label: 'Farmer', badgeVariant: 'amber' },
  { value: 'weather_analyst', label: 'Weather Analyst', badgeVariant: 'blue' },
  { value: 'viewer', label: 'Viewer / Read-Only', badgeVariant: 'gray' },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals & details drawer
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: 'farmer',
    phone_number: '',
    organization: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const list = await authService.listUsers()
    setUsers([...list])
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      u.username.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.organization && u.organization.toLowerCase().includes(q))
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'inactive' && !u.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Handlers
  const handleToggleActive = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = await authService.toggleUserActive(userId)
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    )
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    }
  }

  const handleOpenCreate = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      role: 'farmer',
      phone_number: '',
      organization: 'Kenya Ag-Hub Cooperative',
      is_active: true,
    })
    setFormError('')
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (user: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setFormData({ ...user })
    setFormError('')
    setIsEditModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.email || !formData.first_name) {
      setFormError('Please fulfill required fields (username, email, first name).')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const created = await authService.createUser(formData)
      setUsers([created, ...users])
      setIsCreateModalOpen(false)
    } catch (err) {
      setFormError('Failed to register user. Please verify input data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id) return
    setIsSubmitting(true)
    setFormError('')
    try {
      const updated = await authService.updateUser(formData.id, formData)
      if (updated) {
        setUsers(prev => prev.map(u => (u.id === updated.id ? { ...u, ...updated } : u)))
        if (selectedUser && selectedUser.id === updated.id) {
          setSelectedUser({ ...selectedUser, ...updated })
        }
      }
      setIsEditModalOpen(false)
    } catch (err) {
      setFormError('Failed to update user profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Administration · Tenant Directory
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            User Management & Role Assignment
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Provision platform accounts, inspect credentials, assign granular operational roles, and toggle access states.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <span>➕</span>
            <span>Create New User</span>
          </Button>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Registered</span>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{users.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">All tenant accounts</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Active Users</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {users.filter(u => u.is_active).length}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Authenticated & enabled</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Extension & Agronomy</span>
          <p className="text-2xl font-black text-sky-700 mt-0.5">
            {users.filter(u => u.role === 'extension_officer' || u.role === 'agronomist').length}
          </p>
          <span className="text-[10px] text-sky-700 font-medium">Technical staff</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Farmers</span>
          <p className="text-2xl font-black text-amber-700 mt-0.5">
            {users.filter(u => u.role === 'farmer').length}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">Smallholders & growers</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Deactivated</span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">
            {users.filter(u => !u.is_active).length}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">Suspended access</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, email, or cooperative/organization..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles (Global)</option>
              <option value="admin">System Administrator</option>
              <option value="farm_manager">Farm Manager</option>
              <option value="agronomist">Agronomist</option>
              <option value="extension_officer">Extension Officer</option>
              <option value="farmer">Farmer</option>
              <option value="weather_analyst">Weather Analyst</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Users Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Organization / Cooperative</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading tenant directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No users match current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleCfg = ROLE_OPTIONS.find(r => r.value === u.role)
                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                            {(u.first_name[0] || u.username[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={roleCfg?.badgeVariant || 'gray'}>
                          {roleCfg?.label || u.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {u.organization || 'Independent Farmer'}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-gray-900 font-medium">{u.email}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{u.phone_number || 'No phone registered'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={u.is_active ? 'green' : 'red'}>
                          {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(u, e)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all text-xs font-semibold"
                            title="Edit User"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => handleToggleActive(u.id, e)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              u.is_active
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. User Details Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-base flex items-center justify-center border border-emerald-200">
                    {(selectedUser.first_name[0] || selectedUser.username[0]).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">@{selectedUser.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Account Status Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Access Privileges</span>
                  <Badge variant={selectedUser.is_active ? 'green' : 'red'}>
                    {selectedUser.is_active ? 'ENABLED' : 'SUSPENDED'}
                  </Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-gray-500">
                    Assigned Role: <strong className="text-gray-900 uppercase">{selectedUser.role}</strong>
                  </p>
                  <p className="text-gray-500">
                    Staff Status: <strong className="text-gray-900">{selectedUser.is_staff ? 'YES (Staff)' : 'NO'}</strong>
                  </p>
                </div>
              </div>

              {/* Credentials & Profile Details */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-[10px] text-gray-400">
                  Profile Information
                </h4>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Email</span>
                    <strong className="text-gray-900 font-mono">{selectedUser.email}</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Phone</span>
                    <strong className="text-gray-900">{selectedUser.phone_number || 'N/A'}</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Organization</span>
                    <strong className="text-gray-900">{selectedUser.organization || 'Independent'}</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-gray-500">Member Since</span>
                    <strong className="text-gray-900">
                      {new Date(selectedUser.date_joined).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Role Matrix Preview */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30 text-xs space-y-2">
                <h5 className="font-bold text-sky-900">Role Capabilities Summary</h5>
                <p className="text-sky-800 text-[11px]">
                  Role <span className="font-mono font-bold">[{selectedUser.role}]</span> has permissions assigned in the system master access matrix. Modifications apply globally to all users holding this role.
                </p>
              </div>
            </div>

            {/* Actions Bottom Bar */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setIsDrawerOpen(false)
                  handleOpenEdit(selectedUser)
                }}
                className="flex-1 text-xs font-bold py-2.5"
              >
                Edit Details
              </Button>
              <button
                onClick={(e) => handleToggleActive(selectedUser.id, e)}
                className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all ${
                  selectedUser.is_active
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New System User</h3>
                <p className="text-xs text-gray-500">Provision a new account with customized role assignment</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Samuel"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kiprono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. samuel_k"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="samuel@farm.co.ke"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Role Assignment *</label>
                  <select
                    value={formData.role || 'farmer'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Organization / Cooperative</label>
                <input
                  type="text"
                  value={formData.organization || ''}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Eldoret Farmers Cooperative"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="create_is_active" className="text-gray-700 font-semibold cursor-pointer">
                  Activate account immediately upon creation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? 'Provisioning...' : 'Confirm & Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit User Details</h3>
                <p className="text-xs text-gray-500">Update role assignment, contact information, and tenant details</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Username</label>
                  <input
                    type="text"
                    disabled
                    value={formData.username || ''}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Role Assignment *</label>
                  <select
                    value={formData.role || 'farmer'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Organization / Cooperative</label>
                <input
                  type="text"
                  value={formData.organization || ''}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="edit_is_active" className="text-gray-700 font-semibold cursor-pointer">
                  Account is Active (Allow platform authentication)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

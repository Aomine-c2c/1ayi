"use client"
import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/DesignSystem'

export default function ProfilePage() {
  const { user } = useAuth()
  const role = user?.role || 'farmer'

  // Personal & Contact Info State
  const [firstName, setFirstName] = useState(user?.first_name || 'Peter')
  const [lastName, setLastName] = useState(user?.last_name || 'Otieno')
  const [email, setEmail] = useState(user?.email || 'farmer.otieno@ayi-intel.org')
  const [phone, setPhone] = useState(user?.phone_number || '+254 712 345 678')
  const [organization, setOrganization] = useState(user?.organization || 'Rift Valley Smallholders Cooperative')
  const [avatarSeed, setAvatarSeed] = useState('farmer_avatar')

  // Notification Preferences State
  const [notifWeather, setNotifWeather] = useState(true)
  const [notifAdvisory, setNotifAdvisory] = useState(true)
  const [notifInspections, setNotifInspections] = useState(false)
  const [notifEmailDigest, setNotifEmailDigest] = useState(true)

  // Security / Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)

  // General feedback
  const [saved, setSaved] = useState(false)

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.')
      return
    }
    setPassSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPassSuccess(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center text-xs text-gray-500 gap-1.5 mb-2">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-800 font-semibold">User Profile & Account</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agricultural Operator Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your personal details, contact preferences, role authorization, and security credentials.
        </p>
      </div>

      {/* Main Profile & Avatar Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-5">
            {/* Avatar Selection */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border-2 border-emerald-300 shadow-xs">
                {(firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => setAvatarSeed(Date.now().toString())}
                className="absolute -bottom-1 -right-1 bg-white border border-gray-200 p-1.5 rounded-full text-xs text-gray-600 hover:text-emerald-700 hover:border-emerald-300 shadow-xs"
                title="Change Avatar"
              >
                🔄
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900">
                  {firstName} {lastName}
                </h2>
                <Badge variant="green" size="md">
                  {role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{organization}</p>
              <p className="text-xs font-mono text-gray-400 mt-1">Username: {user?.username || 'farmer_otieno'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Field Account
            </span>
          </div>
        </div>

        {/* Personal & Contact Information Form */}
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">1. Personal & Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone (SMS Weather Alerts)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cooperative or Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-semibold text-emerald-700">✓ Personal information successfully updated</span>
            ) : <span />}
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
            >
              Update Personal Details
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">2. Notification Preferences</h3>
        <p className="text-xs text-gray-500">
          Configure which operational agricultural intelligence notifications you receive in real time.
        </p>
        <div className="space-y-3 pt-2">
          {[
            { label: 'Extreme Weather & Frost Advisories', desc: 'Critical alerts when forecast deviates by >10mm or frost risk emerges', checked: notifWeather, toggle: () => setNotifWeather(!notifWeather) },
            { label: 'Agronomic Intervention Recommendations', desc: 'Prescriptions for irrigation cuts, booster fertilizer, and scout thresholds', checked: notifAdvisory, toggle: () => setNotifAdvisory(!notifAdvisory) },
            { label: 'Weekly Farm Yield & Weather Digest', desc: 'Consolidated summary of growing conditions and sensor metrics every Monday', checked: notifEmailDigest, toggle: () => setNotifEmailDigest(!notifEmailDigest) },
            { label: 'Extension Field Inspection Reports', desc: 'Alerts when an agronomist or extension officer uploads field inspection notes', checked: notifInspections, toggle: () => setNotifInspections(!notifInspections) },
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.toggle}
                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-gray-800 block">{item.label}</span>
                <span className="text-gray-500">{item.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Password & Security Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">3. Password & Security</h3>
        <p className="text-xs text-gray-500">
          Ensure your account is protected with a secure password known only to you.
        </p>

        {passError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span>✓</span>
            <span>Password successfully updated.</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            Update Security Credentials
          </button>
        </form>
      </div>
    </div>
  )
}

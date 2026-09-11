"use client"
import React, { useState, useEffect } from 'react'
import { adminService } from '@/lib/services'
import type { SystemSettings } from '@/lib/types'
import { Button } from '@/components/ui/DesignSystem'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'general' | 'units' | 'notifications' | 'regional' | 'agricultural' | 'account'
  >('general')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await adminService.getSettings()
      setSettings({ ...data })
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const updated = await adminService.updateSettings(settings)
      setSettings({ ...updated })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="py-12 text-center text-gray-400 text-xs">
        Loading system configuration...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Administration · Platform Configuration
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            System & Organization Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure system units, automated notification dispatches, regional timezones, and agricultural calculation parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
              ✓ Platform Settings Saved
            </span>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <span>{isSaving ? '⏳' : '💾'}</span>
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs (6 Sections Requested by User: General, Units, Notifications, Regional, Agricultural, Account) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'general', label: 'General Settings', icon: '⚙️' },
            { id: 'units', label: 'Measurement Units', icon: '📏' },
            { id: 'notifications', label: 'Notification Dispatch', icon: '🔔' },
            { id: 'regional', label: 'Regional & Localization', icon: '🌍' },
            { id: 'agricultural', label: 'Agricultural Configuration', icon: '🌾' },
            { id: 'account', label: 'Security & Account', icon: '🛡️' },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Settings Form Panes */}
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">General Platform Settings</h2>
                <p className="text-xs text-gray-500">Master tenant metadata and operating deployment mode</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Organization / Authority Name</label>
                  <input
                    type="text"
                    value={settings.organization_name}
                    onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Deployment Operational Mode</label>
                  <select
                    value={settings.platform_mode}
                    onChange={(e) => setSettings({ ...settings, platform_mode: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="production">Production (Strict Verification & Live Sync)</option>
                    <option value="staging">Staging (Integration Testing)</option>
                    <option value="demo">Demo / Mock Sandbox</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MEASUREMENT UNITS */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Measurement & Agronomic Units</h2>
                <p className="text-xs text-gray-500">Global display conventions applied across farmer dashboards and charts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Temperature Unit</label>
                  <select
                    value={settings.unit_temperature}
                    onChange={(e) => setSettings({ ...settings, unit_temperature: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="celsius">Celsius (°C) — Standard African Metric</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Precipitation / Rainfall Unit</label>
                  <select
                    value={settings.unit_rainfall}
                    onChange={(e) => setSettings({ ...settings, unit_rainfall: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="mm">Millimeters (mm) — Standard</option>
                    <option value="inches">Inches (in)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Land Surface Area Unit</label>
                  <select
                    value={settings.unit_area}
                    onChange={(e) => setSettings({ ...settings, unit_area: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="hectares">Hectares (ha) — Commercial & Agronomic</option>
                    <option value="acres">Acres (ac) — Smallholder Convention</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Yield Productivity Metric</label>
                  <select
                    value={settings.unit_yield}
                    onChange={(e) => setSettings({ ...settings, unit_yield: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="kg_ha">Kilograms per Hectare (kg/ha)</option>
                    <option value="tonnes_ha">Metric Tonnes per Hectare (t/ha)</option>
                    <option value="bags_acre">90kg Bags per Acre (bags/acre)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Notification & Alert Channels</h2>
                <p className="text-xs text-gray-500">Dispatch protocols for frost, drought, pest risks, and agronomic advisories</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">Email Notifications</h4>
                    <p className="text-gray-500 text-[11px]">Send weather anomaly summaries and weekly agronomic reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.email_notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">SMS Agricultural Advisory Gateway</h4>
                    <p className="text-gray-500 text-[11px]">Push immediate high-severity frost and rainfall alerts via SMS to smallholders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sms_alerts_enabled}
                    onChange={(e) => setSettings({ ...settings, sms_alerts_enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* REGIONAL SETTINGS */}
          {activeTab === 'regional' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Regional & Localization Preferences</h2>
                <p className="text-xs text-gray-500">Time zone anchoring and multi-lingual extensions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Platform Timezone</label>
                  <input
                    type="text"
                    value={settings.time_zone}
                    onChange={(e) => setSettings({ ...settings, time_zone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Language Pack</label>
                  <input
                    type="text"
                    value={settings.default_language}
                    onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AGRICULTURAL CONFIGURATION */}
          {activeTab === 'agricultural' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Agricultural Intelligence & Telemetry Engine</h2>
                <p className="text-xs text-gray-500">Compute loops, background inference intervals, and telemetry cadence</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Auto-Recommendation Generation Interval (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.auto_recommendation_interval_hours}
                    onChange={(e) => setSettings({ ...settings, auto_recommendation_interval_hours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Frequency of running crop risk inference</span>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Telemetry Stream Sync Rate (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={settings.telemetry_sync_rate_seconds}
                    onChange={(e) => setSettings({ ...settings, telemetry_sync_rate_seconds: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Live ground station WebSocket refresh period</span>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Security & Authentication Policies</h2>
                <p className="text-xs text-gray-500">Session validity, brute-force mitigation, and token expiration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Maximum Failed Login Attempts (Lockout)
                  </label>
                  <input
                    type="number"
                    min="3"
                    value={settings.max_login_attempts}
                    onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Session Inactivity Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" variant="primary" disabled={isSaving} className="font-bold text-xs">
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

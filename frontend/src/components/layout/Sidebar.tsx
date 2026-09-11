"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface NavItem {
  href: string
  label: string
  icon: string
  description?: string
}

// System Administrator Navigation structure requested by user:
// Dashboard, Users, Farmers, Farms, Roles & Permissions, Crop Profiles, Weather Configuration, System Monitoring, Notifications, Reports, Audit Logs, Settings
const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Central administrative command' },
  { href: '/dashboard/admin/users', label: 'Users', icon: '👥', description: 'User lifecycle & role management' },
  { href: '/dashboard/farmers', label: 'Farmers', icon: '🧑‍🌾', description: 'Registered farmer directory' },
  { href: '/dashboard/farms', label: 'Farms', icon: '⬡', description: 'Registered agricultural estates' },
  { href: '/dashboard/admin/roles-permissions', label: 'Roles & Permissions', icon: '🛡️', description: 'Granular access control matrix' },
  { href: '/dashboard/admin/crops', label: 'Crop Profiles', icon: '🌱', description: 'Crop parameters & phenology' },
  { href: '/dashboard/admin/weather-config', label: 'Weather Configuration', icon: '☁️', description: 'Sources & threshold alarms' },
  { href: '/dashboard/admin/system-monitoring', label: 'System Monitoring', icon: '🖥️', description: 'Telemetry, health & microservices' },
  { href: '/dashboard/alerts', label: 'Notifications', icon: '⚠️', description: 'System alerts & dispatches' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Global audit dossiers & exports' },
  { href: '/dashboard/admin/audit-logs', label: 'Audit Logs', icon: '📜', description: 'Immutable action trail' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️', description: 'Platform & regional config' },
]

// Weather / Data Analyst Navigation structure requested by user:
// Dashboard, Weather Overview, Live Weather, Historical Data, Weather Trends, Data Quality, Weather Alerts, Analytics, Reports
const WEATHER_ANALYST_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Meteorological telemetry & status' },
  { href: '/dashboard/weather', label: 'Weather Overview', icon: '◌', description: 'Regional atmospheric summary' },
  { href: '/dashboard/live-weather', label: 'Live Weather', icon: '⚡', description: 'Real-time telemetry stream' },
  { href: '/dashboard/historical-weather', label: 'Historical Data', icon: '📊', description: 'Interactive multi-variable charts' },
  { href: '/dashboard/weather-trends', label: 'Weather Trends', icon: '📉', description: 'Rainfall, thermal & cyclical patterns' },
  { href: '/dashboard/data-quality', label: 'Data Quality', icon: '🛡️', description: 'Completeness & sensor health audit' },
  { href: '/dashboard/alerts', label: 'Weather Alerts', icon: '⚠️', description: 'Trigger conditions & crop hazards' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '🔬', description: 'Micro-climate & ET0 correlation' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Dossiers & CSV/PDF exports' },
]

// Field Officer Navigation structure requested by user:
// Dashboard, Assigned Farms, Fields, Inspections, Observations, Crop Cycles, Weather, Alerts, Tasks, Reports
const FIELD_OFFICER_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Field operations command' },
  { href: '/dashboard/farms', label: 'Assigned Farms', icon: '⬡', description: 'Assigned agricultural holdings' },
  { href: '/dashboard/fields', label: 'Fields', icon: '🔲', description: 'Field parcels & dimensions' },
  { href: '/dashboard/inspections', label: 'Inspections', icon: '🚗', description: '9-step structured field checks' },
  { href: '/dashboard/observations', label: 'Observations', icon: '🔍', description: 'Scouting, pathology & logs' },
  { href: '/dashboard/cycles', label: 'Crop Cycles', icon: '◎', description: 'Active growth stages' },
  { href: '/dashboard/weather', label: 'Weather', icon: '◌', description: 'Micro-climate & rain risk' },
  { href: '/dashboard/alerts', label: 'Alerts', icon: '⚠️', description: 'Atmospheric alerts & threats' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: '✅', description: 'Action items & field follow-ups' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Inspection & field audit reports' },
]

// Extension Officer Navigation structure requested by user:
// Dashboard, Farmers, Farms, Field Visits, Observations, Crop Cycles, Weather, Recommendations, Alerts, Reports (with Map View & Follow-ups)
const EXTENSION_OFFICER_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Area extension command center' },
  { href: '/dashboard/farmers', label: 'Farmers', icon: '👥', description: 'Assigned farmer directory' },
  { href: '/dashboard/farms', label: 'Farms', icon: '⬡', description: 'Monitored land holdings' },
  { href: '/dashboard/visits', label: 'Field Visits', icon: '🚗', description: 'Schedule & field itineraries' },
  { href: '/dashboard/observations', label: 'Observations', icon: '🔍', description: 'Clinical field scouting logs' },
  { href: '/dashboard/follow-up', label: 'Follow-Up Tasks', icon: '✅', description: 'Task & assistance tracking' },
  { href: '/dashboard/map', label: 'Map View', icon: '🗺️', description: 'Geographical farmer overview' },
  { href: '/dashboard/cycles', label: 'Crop Cycles', icon: '◎', description: 'Crop lifecycle monitoring' },
  { href: '/dashboard/weather', label: 'Weather', icon: '◌', description: 'Area micro-climate risks' },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: '◈', description: 'Advisory guidance' },
  { href: '/dashboard/alerts', label: 'Alerts', icon: '⚠️', description: 'Area risk notifications' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Regional extension audits' },
]

// Agronomist Navigation structure
const AGRONOMIST_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Agronomy Command Center' },
  { href: '/dashboard/farms', label: 'Farms', icon: '⬡', description: 'Monitored farm holdings' },
  { href: '/dashboard/crop-intelligence', label: 'Crop Intelligence', icon: '🌱', description: 'Crop catalogue & requirements' },
  { href: '/dashboard/crop-profiles', label: 'Crop Profiles', icon: '📖', description: 'Phenology & growth stages' },
  { href: '/dashboard/suitability', label: 'Crop Suitability', icon: '🎯', description: 'Agro-climatic suitability' },
  { href: '/dashboard/weather', label: 'Weather Intelligence', icon: '◌', description: 'Micro-climate & risk forecasts' },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: '◈', description: 'Advisory & intervention rules' },
  { href: '/dashboard/intelligence', label: 'Yield Intelligence', icon: '📈', description: 'Forecasts & farm comparisons' },
  { href: '/dashboard/observations', label: 'Field Observations', icon: '🔍', description: 'Scouting, pests & disease' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Technical agronomic dossiers' },
]

// Farm Manager Navigation structure
const FARM_MANAGER_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', description: 'Operations overview' },
  { href: '/dashboard/farms', label: 'Farms', icon: '⬡', description: 'Estate & parcel management' },
  { href: '/dashboard/fields', label: 'Fields', icon: '🔲', description: 'Boundaries & soil records' },
  { href: '/dashboard/cycles', label: 'Crop Cycles', icon: '◎', description: 'Lifecycle timeline' },
  { href: '/dashboard/weather', label: 'Weather', icon: '◌', description: 'Forecast & micro-climate' },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: '◈', description: 'Agronomic interventions' },
  { href: '/dashboard/intelligence', label: 'Yield Intelligence', icon: '📈', description: 'Yield models & forecasts' },
  { href: '/dashboard/operations', label: 'Field Operations', icon: '🚜', description: 'Tasks, inputs & scouting' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📋', description: 'Executive & farm audits' },
  { href: '/dashboard/alerts', label: 'Notifications', icon: '⚠️', description: 'Alerts & risk warnings' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤', description: 'Manager settings' },
]

function NavIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    '▦': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    '⬡': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      </svg>
    ),
    '🌱': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 19V6m0 0a7 7 0 017 7m-7-7a7 7 0 00-7 7m14 7H5" />
      </svg>
    ),
    '📖': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    '🎯': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
        <circle cx="12" cy="12" r="5" strokeWidth={1.8} />
        <circle cx="12" cy="12" r="1.5" strokeWidth={1.8} />
      </svg>
    ),
    '🔲': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    '◎': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
        <circle cx="12" cy="12" r="4" strokeWidth={1.8} />
      </svg>
    ),
    '◌': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    '◈': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    '📈': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    '🔍': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    '🚜': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    '📋': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    '⚠️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    '👥': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    '🚗': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M3 11h18v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    '✅': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    '🗺️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    '⚡': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    '📊': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    '📉': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    '🛡️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    '🔬': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    '👤': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    '🧑‍🌾': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    '☁️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    '🖥️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    '📜': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    '⚙️': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  }

  return iconMap[icon] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Support System Administrator, Weather/Data Analyst, Extension Officer, Agronomist, and Farm Manager
  const isAdminPath = pathname.startsWith('/dashboard/admin')
  const isAdmin = user?.role === 'admin' || isAdminPath

  const isAnalystPath = [
    '/dashboard/live-weather',
    '/dashboard/historical-weather',
    '/dashboard/weather-trends',
    '/dashboard/data-quality',
    '/dashboard/analytics',
  ].some(p => pathname.startsWith(p))

  const isWeatherAnalyst =
    !isAdmin &&
    (user?.role === 'weather_analyst' ||
    user?.role === 'data_analyst' ||
    isAnalystPath)

  const isFieldOfficer =
    !isAdmin &&
    !isWeatherAnalyst &&
    (user?.role === 'field_officer' || pathname.startsWith('/dashboard/inspections') || pathname.startsWith('/dashboard/tasks'))

  const isAgronomist = !isAdmin && !isWeatherAnalyst && !isFieldOfficer && user?.role === 'agronomist'
  const isFarmManager = !isAdmin && !isWeatherAnalyst && !isFieldOfficer && user?.role === 'farm_manager'
  const isExtensionOfficer = !isAdmin && !isWeatherAnalyst && !isFieldOfficer && !isAgronomist && !isFarmManager

  const navItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : isFieldOfficer
    ? FIELD_OFFICER_NAV_ITEMS
    : isWeatherAnalyst
    ? WEATHER_ANALYST_NAV_ITEMS
    : isAgronomist
    ? AGRONOMIST_NAV_ITEMS
    : isFarmManager
    ? FARM_MANAGER_NAV_ITEMS
    : EXTENSION_OFFICER_NAV_ITEMS

  const roleTitle = isAdmin
    ? 'System Administrator'
    : isFieldOfficer
    ? 'Field Officer'
    : isWeatherAnalyst
    ? 'Weather Data Analyst'
    : isAgronomist
    ? 'Agronomist Intel'
    : isFarmManager
    ? 'Farm Manager'
    : 'Extension Officer'

  const sectionTitle = isAdmin
    ? 'Platform Governance & Core'
    : isFieldOfficer
    ? 'Physical Field Monitoring'
    : isWeatherAnalyst
    ? 'Agro-Meteorology & Telemetry'
    : isAgronomist
    ? 'Agronomic Intelligence'
    : isFarmManager
    ? 'Operational Management'
    : 'Extension & Farmer Support'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="sidebar flex flex-col justify-between bg-white border-r border-gray-200 w-64 min-h-screen">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg font-bold shadow-xs">
            🌿
          </div>
          <div>
            <span className="font-extrabold text-gray-900 tracking-tight text-base block leading-none">
              AYIS Field
            </span>
            <span className="text-[10px] text-emerald-800 font-bold tracking-wide uppercase mt-1 block">
              {roleTitle}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {sectionTitle}
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/60 font-bold shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={active ? 'text-emerald-700' : 'text-gray-400'}>
                  <NavIcon icon={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Section at bottom */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
            {(user?.first_name?.[0] || user?.username?.[0] || 'E').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-800 truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Brian Omondi'}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold">
              {roleTitle}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-center text-[11px] text-gray-500 hover:text-rose-600 font-medium py-1 rounded transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}



import type { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfdfa] flex">
      {/* Role-aware Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Area with sticky Top Header Shell */}
      <div className="main-with-sidebar min-h-screen flex-1 flex flex-col">
        <Header />
        <main className="flex-1 px-6 sm:px-8 py-8 max-w-[1240px] w-full">
          {children}
        </main>
        <footer className="px-8 py-4 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-800">AYIS Platform</span>
            <span>·</span>
            <span>Agricultural Yield Intelligence & Productivity System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Django REST Ready</span>
            <span>Tauri Desktop Compatible</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

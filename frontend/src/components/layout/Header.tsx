"use client"
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-gray-800 text-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-xl font-bold">AYIS</Link>
          <nav className="hidden md:flex space-x-4">
            <Link href="/dashboard/farms" className="hover:text-gray-300">Farms</Link>
            <Link href="/dashboard/cycles" className="hover:text-gray-300">Crop Cycles</Link>
            <Link href="/dashboard/weather" className="hover:text-gray-300">Weather</Link>
            <Link href="/dashboard/intelligence" className="hover:text-gray-300">Intelligence</Link>
            <Link href="/dashboard/charts" className="hover:text-gray-300">Charts</Link>
            <Link href="/dashboard/reports" className="hover:text-gray-300">Reports</Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">{user.username}</span>
              <span className="badge bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {user.role}
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

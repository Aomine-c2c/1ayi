"use client"
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

function LoginForm() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(registered ? 'Account created. Please sign in.' : '')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 text-center mb-6">AYIS Login</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{' '}
          <a href="/register" className="text-green-600 hover:underline">Create one</a>
        </p>
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500 space-y-1">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>admin_tavo / admin123 (admin)</p>
          <p>farmer_simmons / Farmer123! (farmer)</p>
          <p>officer_kamau / Officer123! (officer)</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}

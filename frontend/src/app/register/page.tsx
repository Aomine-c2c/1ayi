"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form)
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 text-center mb-6">🌾 Create Account</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" name="username" className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.username} onChange={handleChange} required
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.email} onChange={handleChange} required
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.password} onChange={handleChange} required
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password" name="password_confirm" className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.password_confirm} onChange={handleChange} required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-green-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}

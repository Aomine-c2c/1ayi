"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 to-primary-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🌾</div>
          <span className="text-white font-bold text-xl">AYIS</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Join thousands of farmers using data-driven agriculture.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Get crop recommendations, monitor your farm's weather, and track yields — all in one intelligent platform designed for African agriculture.
          </p>
        </div>
        <p className="text-white/30 text-xs">AYIS v1.0.0</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-gray-900 text-lg">AYIS</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Start monitoring your farms with AYIS</p>

          {error && (
            <div className="alert-error mb-5">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username" type="text" name="username" className="input"
                value={form.username} onChange={handleChange} required
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email" type="email" name="email" className="input"
                value={form.email} onChange={handleChange} required
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password" type="password" name="password" className="input"
                value={form.password} onChange={handleChange} required
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="password_confirm" className="label">Confirm password</label>
              <input
                id="password_confirm" type="password" name="password_confirm" className="input"
                value={form.password_confirm} onChange={handleChange} required
                placeholder="Repeat your password"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Creating account...</>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

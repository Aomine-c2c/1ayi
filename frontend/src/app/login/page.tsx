"use client"
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

function LoginForm() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'
  const resetSuccess = searchParams.get('reset') === 'true'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorType, setErrorType] = useState<'none' | 'invalid' | 'disabled'>('none')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorType('none')
    setErrorMessage('')
    setLoading(true)

    // Demo simulation for account disabled state testing
    if (username.toLowerCase().includes('disabled') || username.toLowerCase().includes('inactive')) {
      setTimeout(() => {
        setLoading(false)
        setErrorType('disabled')
        setErrorMessage('This account has been deactivated by the platform administrator. Please contact extension support.')
      }, 500)
      return
    }

    try {
      await login(username, password)
      // Check if first-time farmer to route to onboarding
      if (username.toLowerCase().includes('new') || username.toLowerCase().includes('onboard')) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setErrorType('invalid')
      setErrorMessage(err.message || 'Invalid username or password. Please verify your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🌾</div>
          <span className="text-white font-bold text-xl tracking-tight">AYIS Platform</span>
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 text-emerald-300 text-xs font-semibold rounded-full border border-white/10 mb-4">
            Agricultural Intelligence System
          </span>
          <blockquote className="text-white/90 text-2xl font-semibold leading-snug mb-6 max-w-md">
            "Empowering smallholders, agronomists, and agricultural organizations with field-grounded intelligence."
          </blockquote>
          <div className="flex flex-col gap-3.5">
            {[
              { icon: '🌱', text: 'Real-time crop cycle tracking & harvest timeline projections' },
              { icon: '🌤️', text: 'Hyperlocal agro-meteorological observations and risk advisories' },
              { icon: '📊', text: 'Data-driven yield estimation models tailored to highland & valley soils' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="text-base">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-white/40 text-xs border-t border-white/10 pt-4">
          <span>AYIS Core v1.0.0</span>
          <span>Secure OAuth2 & JWT</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-3xl">🌾</span>
            <span className="font-bold text-gray-900 text-xl tracking-tight">AYIS Platform</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Sign in to your account</h1>
          <p className="text-xs text-gray-500 mb-6">Enter your credentials to access the farm intelligence dashboard</p>

          {registered && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <span>✓</span>
              <span>Account created successfully. Please sign in with your credentials.</span>
            </div>
          )}

          {resetSuccess && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <span>✓</span>
              <span>Your password has been updated. Please sign in with your new password.</span>
            </div>
          )}

          {/* Invalid credentials state */}
          {errorType === 'invalid' && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <div>
                <strong className="block font-semibold">Authentication Failed</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Account disabled state */}
          {errorType === 'disabled' && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">⛔</span>
              <div>
                <strong className="block font-semibold">Account Deactivated</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email or Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="e.g. otieno_farms or farmer@ayi.org"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-gray-600 font-medium">Remember my session</span>
              </label>
            </div>

            {/* Submit button with loading state */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Don't have an agricultural operator account?{' '}
            <Link href="/register" className="text-emerald-700 hover:text-emerald-800 font-semibold">
              Register now
            </Link>
          </p>

          {/* Quick Demo Credentials */}
          <div className="mt-8 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Quick Demo Roles</p>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div className="flex justify-between items-center py-0.5">
                <span>Farmer (Peter Otieno)</span>
                <button
                  type="button"
                  onClick={() => { setUsername('farmer_otieno'); setPassword('Farmer123!') }}
                  className="text-emerald-700 font-sans text-[11px] font-semibold hover:underline"
                >
                  Auto-fill
                </button>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Agronomist (Sarah Mwangi)</span>
                <button
                  type="button"
                  onClick={() => { setUsername('agronomist_sarah'); setPassword('Agro123!') }}
                  className="text-emerald-700 font-sans text-[11px] font-semibold hover:underline"
                >
                  Auto-fill
                </button>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>New Farmer Onboarding</span>
                <button
                  type="button"
                  onClick={() => { setUsername('new_farmer_onboard'); setPassword('Welcome123!') }}
                  className="text-emerald-700 font-sans text-[11px] font-semibold hover:underline"
                >
                  Test Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs text-gray-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  )
}

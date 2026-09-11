"use client"
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const strength = useMemo(() => {
    let score = 0
    if (newPassword.length >= 8) score += 25
    if (/[A-Z]/.test(newPassword)) score += 25
    if (/[0-9]/.test(newPassword)) score += 25
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 25
    return score
  }, [newPassword])

  const strengthLabel = useMemo(() => {
    if (strength === 0) return { text: 'Empty', color: 'bg-gray-200', textCol: 'text-gray-400' }
    if (strength <= 25) return { text: 'Weak', color: 'bg-rose-500', textCol: 'text-rose-600' }
    if (strength <= 50) return { text: 'Fair', color: 'bg-amber-500', textCol: 'text-amber-600' }
    if (strength <= 75) return { text: 'Good', color: 'bg-sky-500', textCol: 'text-sky-600' }
    return { text: 'Strong', color: 'bg-emerald-500', textCol: 'text-emerald-600' }
  }, [strength])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-3">
            🔐
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create New Password</h1>
          <p className="text-xs text-gray-500 mt-1">
            Choose a secure passphrase to protect your farm and yield intelligence data.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center text-xs text-emerald-900 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg mx-auto font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-900">Password Reset Complete</p>
              <p className="text-emerald-700 mt-1">
                Your credentials have been securely updated. You can now sign in with your new password.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login?reset=true"
                className="w-full inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow-xs"
              >
                Go to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Strength</span>
                    <span className={`font-semibold ${strengthLabel.textCol}`}>{strengthLabel.text}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthLabel.color}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-[11px] text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Security criteria:</p>
              <p className={newPassword.length >= 8 ? 'text-emerald-700' : ''}>• Minimum 8 characters</p>
              <p className={/[A-Z]/.test(newPassword) ? 'text-emerald-700' : ''}>• At least one uppercase letter</p>
              <p className={/[0-9]/.test(newPassword) ? 'text-emerald-700' : ''}>• At least one number or symbol</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Updating password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>

            <div className="text-center mt-4">
              <Link href="/login" className="text-xs text-gray-500 hover:text-gray-800 font-medium">
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

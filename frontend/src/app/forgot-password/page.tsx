"use client"
import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.')
      setLoading(false)
      return
    }

    // Simulate error state if testing invalid domain
    if (email.endsWith('@error.com')) {
      setTimeout(() => {
        setLoading(false)
        setError('The email dispatch service encountered an unexpected error. Please check the address or try again later.')
      }, 700)
      return
    }

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 700)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-3">
            🌾
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reset Your Password</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter your email to receive secure recovery instructions from the AYIS platform.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <span>⚠️</span>
            <div>
              <strong className="block font-semibold">Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center text-xs text-emerald-900 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg mx-auto font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-900">Check your inbox</p>
              <p className="text-emerald-700 mt-1">
                If an agricultural account exists for <span className="font-semibold">{email}</span>, a password reset link has been dispatched with an expiry of 30 minutes.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/reset-password?token=demo-token-123"
                className="inline-block font-semibold text-emerald-800 bg-white border border-emerald-300 py-1.5 px-3 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Proceed to Demo Reset Link →
              </Link>
              <Link
                href="/login"
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Submitting request...</span>
                </>
              ) : (
                'Send Reset Instructions'
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

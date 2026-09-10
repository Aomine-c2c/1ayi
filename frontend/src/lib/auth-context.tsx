"use client"
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { username: string; email: string; password: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('ayis_token')
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'}/users/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || body.error || 'Login failed')
      }
      const data = await res.json()
      localStorage.setItem('ayis_token', data.access)
      localStorage.setItem('ayis_refresh_token', data.refresh)
      setToken(data.access)
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'}/users/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      })
      if (meRes.ok) {
        const me = await meRes.json()
        setUser(me)
      }
    } catch (e: any) {
      setError(e.message || 'Login failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('ayis_refresh_token')
      if (refresh) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'}/users/auth/token/blacklist/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        })
      }
    } catch (_) { /* best effort */ }
    localStorage.removeItem('ayis_token')
    localStorage.removeItem('ayis_refresh_token')
    setToken(null)
    setUser(null)
  }, [])

  const register = useCallback(async (data: { username: string; email: string; password: string }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'}/users/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || body.error || 'Registration failed')
    }
    return res.json()
  }, [])

  // Restore session on mount
  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(me => { if (me) setUser(me) })
        .catch(() => {
          localStorage.removeItem('ayis_token')
          setToken(null)
        })
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

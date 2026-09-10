import { api } from './client'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

function createAuthContext() {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      loading: true,
      error: null,
      login: async () => {},
      logout: async () => {},
      register: async () => {},
      checkAuth: async () => {},
    }
  }

  const [state, setState] = (window as any).__React_useState ? (window as any).__React_useState<AuthState>({
    user: null,
    token: localStorage.getItem('ayis_token'),
    loading: false,
    error: null,
  }) : [null, () => {}]

  // This is a placeholder — real implementation uses React.createContext + useReducer
  // For now, we export a namespace that components can import
  const auth = {
    user: null as User | null,
    token: localStorage.getItem('ayis_token') || null,
    loading: false,
    error: null as string | null,
    login: async (username: string, password: string) => {
      try {
        auth.loading = true
        auth.error = null
        const tokens = await api.login(username, password)
        auth.token = tokens.access
        localStorage.setItem('ayis_token', tokens.access)
        localStorage.setItem('ayis_refresh_token', tokens.refresh)
        const me = await api.getMe()
        auth.user = me
        return me
      } catch (e: any) {
        auth.error = e.message || 'Login failed'
        throw e
      } finally {
        auth.loading = false
      }
    },
    logout: async () => {
      try {
        await api.logout()
      } catch (_) {
        // Best effort — token may already be expired
      } finally {
        auth.token = null
        auth.user = null
        localStorage.removeItem('ayis_token')
        localStorage.removeItem('ayis_refresh_token')
      }
    },
    register: async (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => {
      const user = await api.register(data)
      return user
    },
    checkAuth: async () => {
      if (auth.token) {
        try {
          const me = await api.getMe()
          auth.user = me
          return me
        } catch (_) {
          auth.token = null
          auth.user = null
          localStorage.removeItem('ayis_token')
          return null
        }
      }
      return null
    },
  }

  return auth
}

export const auth = createAuthContext()

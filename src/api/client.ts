import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { Router } from 'vue-router'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5274/api'

// Absolute URL for raw fetch() calls (path starts with '/', e.g. '/admin/users')
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRedirecting = false

// Set on a request once it has been sent again after a token refresh, so it is never retried twice
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// Shared by every request that fails at the same time: one refresh, not one per request
let refreshing: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = supabase.auth.refreshSession()
      .then(({ data, error }) => {
        const token = !error && data.session ? data.session.access_token : null
        if (token) localStorage.setItem('token', token)
        return token
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

// Add JWT token to all requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('[API Client] Request to', config.url, '- Token:', token ? `${token.substring(0, 20)}...` : 'MISSING')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('[API Client] NO TOKEN in localStorage!')
  }
  return config
})

// Session errors: a 401 (or the backend's "no authenticated user"). Other 4xx responses are not a sign-out:
// a 403 means the plan does not allow the action, or the envelope is not the user's.
export function setupAuthInterceptor(router: Router) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status
      const message = error.response?.data?.message
      const config = error.config as RetryableConfig | undefined

      console.log('[Auth Interceptor] Status:', status, 'Message:', message, 'Path:', router.currentRoute.value.path)

      const isSessionError = status === 401 || (status === 400 && message?.includes('No authenticated user'))
      if (!isSessionError || isRedirecting || router.currentRoute.value.path === '/login') {
        return Promise.reject(error)
      }

      // Usually just an access token that expired: refresh the Supabase session once and send the request again
      if (config && !config._retried) {
        config._retried = true
        const token = await refreshAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          return client(config)
        }
      }

      // The session is really gone: sign out and say why on the login page
      console.log('[Auth Interceptor] Session expired, redirecting to /login')
      isRedirecting = true
      localStorage.removeItem('token')
      localStorage.removeItem('householdId')
      router.push({ path: '/login', query: { reason: 'expired' } })
        .catch(err => console.error('[Auth Interceptor] Navigation error:', err))
      return Promise.reject(error)
    }
  )
}

export function resetRedirectFlag() {
  isRedirecting = false
}

export default client

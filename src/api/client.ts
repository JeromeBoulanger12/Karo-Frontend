import axios from 'axios'
import type { Router } from 'vue-router'

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

// Set up error handling for 401/403 responses
export function setupAuthInterceptor(router: Router) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const message = error.response?.data?.message

      console.log('[Auth Interceptor] Status:', status, 'Message:', message, 'Path:', router.currentRoute.value.path)

      // Handle 401, 403, or 400 with auth error message
      if ((status === 401 || status === 403 || (status === 400 && message?.includes('No authenticated user'))) && !isRedirecting) {
        const currentPath = router.currentRoute.value.path
        console.log('[Auth Interceptor] Auth error detected, redirecting to /login')
        if (currentPath !== '/login') {
          isRedirecting = true
          localStorage.removeItem('token')
          localStorage.removeItem('householdId')
          router.push('/login').catch(err => console.error('[Auth Interceptor] Navigation error:', err))
        }
      }
      return Promise.reject(error)
    }
  )
}

export function resetRedirectFlag() {
  isRedirecting = false
}

export default client

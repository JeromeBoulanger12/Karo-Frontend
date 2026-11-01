import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'
import client from '../api/client'
import { applyPendingProfile } from './pendingProfile'

const SUPABASE_URL = 'https://ikxnkhvvlsfqnwervleg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreG5raHZ2bHNmcW53ZXJ2bGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NjMwMTQsImV4cCI6MjEwNjAzOTAxNH0.EyDhkDC9ENeXrFeGKxDBVYnggYhTw5OyG-9W0TECTP8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface User {
  id: string
  email: string
}

const user = ref<User | null>(null)
const householdId = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const authChecked = ref(false)

export const useAuth = () => {
  const router = useRouter()

  const isAuthenticated = computed(() => !!user.value)

  const bootstrap = async (email: string) => {
    try {
      const token = localStorage.getItem('token')
      console.log('Bootstrap - Email:', email, 'Token present:', !!token)

      if (!token) {
        throw new Error('No token found in localStorage before bootstrap')
      }

      const response = await client.post('/auth/bootstrap', { email })
      console.log('Bootstrap response:', response.data)
      const hid = response.data.householdId
      if (!hid) {
        console.error('Bootstrap response missing householdId!', { response: response.data })
      }
      householdId.value = hid
      if (hid) {
        localStorage.setItem('householdId', hid)
      }
      console.log('Bootstrap successful - HouseholdId:', hid)
    } catch (err) {
      console.error('Bootstrap error:', err)
      throw err
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      if (data.user && data.session) {
        const accessToken = data.session.access_token
        console.log('Login successful - Token:', accessToken ? 'present' : 'MISSING')

        user.value = {
          id: data.user.id,
          email: data.user.email || ''
        }

        if (accessToken) {
          localStorage.setItem('token', accessToken)
          console.log('Token stored in localStorage')
        } else {
          console.error('No access token in session!')
        }

        // Bootstrap user in Karo backend
        await bootstrap(data.user.email || '')

        await router.push('/dashboard')
      } else {
        throw new Error('User or session not returned from Supabase')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      console.error('Login error:', err)
    } finally {
      loading.value = false
    }
  }

  const signup = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError

      if (data.user) {
        error.value = 'Check your email to confirm your account'
        setTimeout(() => {
          error.value = null
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed'
      console.error('Signup error:', err)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      user.value = null
      localStorage.removeItem('token')
      await router.push('/login')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      console.error('Logout error:', err)
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      console.log('[useAuth] checkAuth - session:', !!data.session, 'user:', data.session?.user?.email)

      if (data.session?.user) {
        // Verify user still exists in Supabase (handles deleted users)
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          // User was deleted or session is invalid
          console.warn('[useAuth] User not found or error:', userError)
          user.value = null
          householdId.value = null
          localStorage.removeItem('token')
          localStorage.removeItem('householdId')
          authChecked.value = true
          return
        }

        console.log('[useAuth] Setting token:', data.session.access_token ? 'present' : 'MISSING')
        localStorage.setItem('token', data.session.access_token)

        // Restore householdId from localStorage BEFORE setting user (important for watch timing)
        const storedHouseholdId = localStorage.getItem('householdId')
        if (storedHouseholdId) {
          householdId.value = storedHouseholdId
          console.log('[useAuth] Restored householdId from localStorage:', storedHouseholdId)
        } else if (data.session.user.email) {
          // Bootstrap user if they don't have a householdId yet (e.g., after email confirmation)
          try {
            console.log('[useAuth] No householdId in localStorage, bootstrapping...')
            await bootstrap(data.session.user.email)
          } catch (err) {
            console.warn('Bootstrap during checkAuth failed (this is often expected):', err)
          }
        }

        // Set user AFTER householdId is ready (so watch gets correct householdId)
        user.value = {
          id: data.session.user.id,
          email: data.session.user.email || ''
        }
      } else {
        user.value = null
        householdId.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('householdId')
      }
    } catch (err) {
      console.error('Check auth error:', err)
      user.value = null
      householdId.value = null
    } finally {
      authChecked.value = true
    }
  }

  const handleEmailConfirmation = async () => {
    try {
      if (!window.location.hash) {
        console.log('No email confirmation hash found')
        return
      }

      console.log('Processing email confirmation hash...')

      // Use listener approach for PKCE flow compatibility
      return new Promise<void>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, !!session)

          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in via email confirmation')
            user.value = {
              id: session.user.id,
              email: session.user.email || ''
            }
            localStorage.setItem('token', session.access_token)

            // Bootstrap after email confirmation
            if (session.user.email) {
              try {
                await bootstrap(session.user.email)
              } catch (bootstrapErr) {
                console.warn('Bootstrap after email confirmation failed:', bootstrapErr)
              }
            }

            // Update profile if pending data exists
            const pendingFirstName = localStorage.getItem('pendingFirstName')
            const pendingLastName = localStorage.getItem('pendingLastName')
            if (pendingFirstName || pendingLastName) {
              try {
                await client.put('/auth/profile', {
                  firstName: pendingFirstName || '',
                  lastName: pendingLastName || ''
                })
                localStorage.removeItem('pendingFirstName')
                localStorage.removeItem('pendingLastName')
              } catch (profileErr) {
                console.warn('Profile update after email confirmation failed:', profileErr)
              }
            }

            await applyPendingProfile()

            // Clean up URL hash
            window.history.replaceState({}, document.title, window.location.pathname)

            // Unsubscribe
            subscription?.unsubscribe()

            // Redirect to home
            await router.push('/dashboard')
            resolve()
          } else if (event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            // Check if we got a session from the hash
            const { data } = await supabase.auth.getSession()
            if (data.session) {
              console.log('Got session from hash')
              user.value = {
                id: data.session.user.id,
                email: data.session.user.email || ''
              }
              localStorage.setItem('token', data.session.access_token)

              if (data.session.user.email) {
                try {
                  await bootstrap(data.session.user.email)
                } catch (bootstrapErr) {
                  console.warn('Bootstrap after email confirmation failed:', bootstrapErr)
                }
              }

              // Update profile if pending data exists
              const pendingFirstName = localStorage.getItem('pendingFirstName')
              const pendingLastName = localStorage.getItem('pendingLastName')
              if (pendingFirstName || pendingLastName) {
                try {
                  await client.put('/auth/profile', {
                    firstName: pendingFirstName || '',
                    lastName: pendingLastName || ''
                  })
                  localStorage.removeItem('pendingFirstName')
                  localStorage.removeItem('pendingLastName')
                } catch (profileErr) {
                  console.warn('Profile update after email confirmation failed:', profileErr)
                }
              }

              await applyPendingProfile()

              window.history.replaceState({}, document.title, window.location.pathname)
              subscription?.unsubscribe()
              await router.push('/dashboard')
              resolve()
            }
          }
        })

        // Safety timeout after 5 seconds
        setTimeout(() => {
          console.log('Email confirmation timeout - no session found')
          resolve()
        }, 5000)
      })
    } catch (err) {
      console.log('Email confirmation handling:', err)
    }
  }

  // Clears the browser session without calling Supabase (used after the account was deleted server-side,
  // when a server-side sign-out would be rejected)
  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    user.value = null
    householdId.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('householdId')
    await router.push('/')
  }

  return {
    user,
    householdId,
    loading,
    error,
    isAuthenticated,
    authChecked,
    login,
    signup,
    logout,
    clearLocalSession,
    checkAuth,
    handleEmailConfirmation
  }
}

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import client from '../api/client'
import { supabase } from '../api/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { applyPendingProfile, hasPendingProfile, toSignupMetadata, type PendingPlan, type PendingProfile } from './pendingProfile'

interface User {
  id: string
  email: string
}

const user = ref<User | null>(null)
const householdId = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const authChecked = ref(false)

// A paid plan chosen at sign-up, to open once the confirmed user is signed in (read by the router guard)
const pendingPlan = ref<PendingPlan | null>(null)
let checking: Promise<void> | null = null

// Where a new user lands after the first sign-in: the payment page for the plan they chose, else the dashboard
export const paymentRoute = (plan: PendingPlan) => ({ path: '/paiement', query: { tier: plan.tier, interval: plan.interval } })

export const useAuth = () => {
  const router = useRouter()

  const isAuthenticated = computed(() => !!user.value)

  const bootstrap = async (email: string) => {
    try {
      const token = localStorage.getItem('token')
      console.log('Bootstrap - Token present:', !!token)

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

  // Creates the Karo user if needed and saves what the sign-up form collected. Returns the paid plan to resume.
  const completeSignIn = async (supabaseUser: SupabaseUser, accessToken: string): Promise<PendingPlan | null> => {
    localStorage.setItem('token', accessToken)
    await bootstrap(supabaseUser.email || '')
    const plan = await applyPendingProfile(supabaseUser)

    // Set last: watchers on the user load the household and features
    user.value = { id: supabaseUser.id, email: supabaseUser.email || '' }
    return plan
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
      if (!data.user || !data.session) throw new Error('User or session not returned from Supabase')

      // A user who confirmed their email elsewhere finishes the sign-up here
      const plan = await completeSignIn(data.user, data.session.access_token)
      await router.push(plan ? paymentRoute(plan) : '/dashboard')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      console.error('Login error:', err)
    } finally {
      loading.value = false
    }
  }

  // The sign-up data goes in the account metadata: with email confirmation on there is no session yet, and the user
  // may confirm on another device. Returns 'confirm' when the email must be confirmed first, 'signed_in' otherwise.
  // Also used by the checkout page, which handles errors and loading itself.
  const createAccount = async (email: string, password: string, profile: PendingProfile) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: toSignupMetadata(profile),
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
      }
    })

    if (signUpError) throw signUpError

    // Email confirmation on: the account waits for the link (also what Supabase answers for an address already used)
    if (!data.session || !data.user) return { status: 'confirm' as const, plan: null }

    const plan = await completeSignIn(data.user, data.session.access_token)
    return { status: 'signed_in' as const, plan }
  }

  const signup = async (email: string, password: string, profile: PendingProfile): Promise<'confirm' | 'signed_in' | null> => {
    loading.value = true
    error.value = null

    try {
      const result = await createAccount(email, password, profile)
      if (result.status === 'signed_in') {
        await router.push('/dashboard')
      }
      return result.status
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed'
      console.error('Signup error:', err)
      return null
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

  const runCheckAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      console.log('[useAuth] checkAuth - session:', !!data.session)

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
        if (storedHouseholdId && !hasPendingProfile(userData.user)) {
          householdId.value = storedHouseholdId
          console.log('[useAuth] Restored householdId from localStorage:', storedHouseholdId)
        } else if (data.session.user.email) {
          // First sign-in, e.g. back from the confirmation link (Supabase reads the session from the address):
          // create the Karo user and save the sign-up data
          try {
            console.log('[useAuth] Finishing the first sign-in...')
            await bootstrap(data.session.user.email)
            pendingPlan.value = await applyPendingProfile(userData.user)
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

  // The router guard and App.vue both check on start-up: they share one run, so a first sign-in is finished once
  const checkAuth = () => {
    checking ??= runCheckAuth().finally(() => {
      checking = null
    })
    return checking
  }

  // Sends the Supabase recovery email. Supabase answers the same way for an unknown address,
  // so the page never tells whether an account exists.
  const requestPasswordReset = async (email: string): Promise<string | null> => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`
    })
    return resetError ? (resetError.code ?? 'unknown') : null
  }

  // Sets a new password on the current session (the recovery link opens one), then keeps the API token in step
  const updatePassword = async (newPassword: string): Promise<string | null> => {
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) return updateError.code ?? 'unknown'

    const { data } = await supabase.auth.getSession()
    if (data.session) localStorage.setItem('token', data.session.access_token)
    return null
  }

  // From the profile: the current password is checked first, so an unattended open session cannot change it
  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    const email = user.value?.email
    if (!email) return 'no_session'

    const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (checkError) return 'invalid_current_password'

    return updatePassword(newPassword)
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
    requestPasswordReset,
    updatePassword,
    changePassword,
    checkAuth,
    pendingPlan,
    createAccount
  }
}

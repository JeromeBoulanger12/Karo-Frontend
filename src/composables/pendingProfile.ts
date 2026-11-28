import type { User } from '@supabase/supabase-js'
import { supabase } from '../api/supabase'
import { userSettingsApi } from '../api/userSettings'

// What the sign-up form collects before there is a session. It goes in the Supabase account metadata, so it is
// still there when the user confirms their email on another device, and is saved once the first sign-in has
// created the user in Karo. The language stays in the metadata: the Supabase email templates read it.
export interface PendingProfile {
  language: string
  firstName?: string
  lastName?: string
  timeZoneId?: string
  // The version of the policy and terms the user accepted by ticking the box (Loi 25 proof of consent)
  consentVersion?: string
  // A paid plan chosen on the checkout page, resumed after the email confirmation
  plan?: PendingPlan
}

export interface PendingPlan {
  tier: string
  interval: string
}

// The metadata keys cleared once saved; "language" is kept on purpose
const SETUP_KEYS = ['first_name', 'last_name', 'time_zone', 'consent_version', 'pending_plan'] as const

export function toSignupMetadata(profile: PendingProfile): Record<string, string> {
  const metadata: Record<string, string> = { language: profile.language }
  if (profile.firstName) metadata.first_name = profile.firstName
  if (profile.lastName) metadata.last_name = profile.lastName
  if (profile.timeZoneId) metadata.time_zone = profile.timeZoneId
  if (profile.consentVersion) metadata.consent_version = profile.consentVersion
  if (profile.plan) metadata.pending_plan = `${profile.plan.tier}|${profile.plan.interval}`
  return metadata
}

export function hasPendingProfile(user: User | null | undefined): boolean {
  const metadata = user?.user_metadata ?? {}
  return SETUP_KEYS.some(key => metadata[key])
}

// Saves the sign-up data in Karo and returns the paid plan to resume, if any. Needs the session and the Karo user
// (bootstrap) first. When a save fails the metadata is kept, so the next sign-in tries again.
export async function applyPendingProfile(user: User | null | undefined): Promise<PendingPlan | null> {
  if (!user || !hasPendingProfile(user)) return null

  const metadata = user.user_metadata
  try {
    if (metadata.first_name || metadata.last_name) {
      await userSettingsApi.updateName(metadata.first_name ?? '', metadata.last_name ?? '')
    }
    if (metadata.time_zone) {
      await userSettingsApi.updatePreferences(metadata.time_zone, true, metadata.language)
    }
    if (metadata.consent_version) {
      await userSettingsApi.recordConsent(metadata.consent_version)
    }

    await supabase.auth.updateUser({ data: Object.fromEntries(SETUP_KEYS.map(key => [key, null])) })
  } catch (err) {
    console.warn('Sign-up data could not be saved yet', err)
    return null
  }

  const [tier, interval] = typeof metadata.pending_plan === 'string' ? metadata.pending_plan.split('|') : []
  return tier && interval ? { tier, interval } : null
}

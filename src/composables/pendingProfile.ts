import { userSettingsApi, type PostalAddress } from '../api/userSettings'

// Filled in at sign-up, when there is no session yet, and saved once the first sign-in has created the user
const STORAGE_KEY = 'pendingProfile'

export interface PendingProfile {
  timeZoneId?: string
  address?: PostalAddress
  // Set when the user ticked the consent box at sign-up
  consentVersion?: string
}

export function savePendingProfile(profile: PendingProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

// Keeps the stored data when a save fails, so the next sign-in tries again
export async function applyPendingProfile() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  try {
    const profile = JSON.parse(raw) as PendingProfile
    if (profile.timeZoneId) {
      await userSettingsApi.updatePreferences(profile.timeZoneId, true)
    }
    if (profile.address) {
      await userSettingsApi.updateAddress(profile.address)
    }
    if (profile.consentVersion) {
      await userSettingsApi.recordConsent(profile.consentVersion)
    }
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Pending profile could not be saved yet', err)
  }
}

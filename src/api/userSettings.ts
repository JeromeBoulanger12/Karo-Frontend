import client from './client'

// Mirrors the backend UserProfileDto
export interface UserProfile {
  email: string
  firstName: string
  lastName: string
  timeZoneId: string
  notificationsEnabled: boolean
}

export const userSettingsApi = {
  getProfile() {
    return client.get<UserProfile>('/auth/profile')
  },
  updateName(firstName: string, lastName: string) {
    return client.put('/auth/profile', { firstName, lastName })
  },
  // The language is left out when not given, so the stored one is kept
  updatePreferences(timeZoneId: string, notificationsEnabled: boolean, language?: string) {
    return client.put('/auth/preferences', { timeZoneId, notificationsEnabled, language })
  },
  // Proof of consent: the version of the policy and terms the user accepted
  recordConsent(version: string) {
    return client.put('/auth/consent', { version })
  }
}

// Every time zone the browser knows, with a short fallback for older browsers
export function listTimeZones(): string[] {
  const supported = (Intl as any).supportedValuesOf
  if (typeof supported === 'function') return supported('timeZone')
  return ['America/Toronto', 'America/Montreal', 'America/Vancouver', 'America/Halifax', 'America/St_Johns', 'Europe/Paris', 'UTC']
}

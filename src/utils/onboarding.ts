// The setup wizard is shown until the user finishes or skips it. Kept per user on this device
const doneKey = (userId?: string | null) => `onboardingDone:${userId ?? 'anonymous'}`

export function isOnboardingDone(userId?: string | null): boolean {
  return localStorage.getItem(doneKey(userId)) === 'true'
}

export function markOnboardingDone(userId?: string | null): void {
  localStorage.setItem(doneKey(userId), 'true')
}

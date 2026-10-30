// Shape of an envelope as returned by GET /envelopes (EnvelopeSummaryDto)
export interface EnvelopeSummary {
  id: string
  name: string
  purpose: string
  homeAccountId: string
  balance?: { amount: number; currency: string }
  targetAmount?: { amount: number; currency: string } | null
  targetDate?: string | null
  billPaymentScheduleJson?: string | null
  billLastPaidDate?: string | null
  isAutomaticWithdrawal?: boolean
  withdrawalFrequency?: string | null
  linkedEnvelopeId?: string | null
  isShareable?: boolean
}

export const PURPOSE_LABELS: Record<string, string> = {
  GeneralReserve: 'Réserve',
  Bill: 'Facture',
  SavingsGoal: 'Objectif',
  DebtPayment: 'Dette',
  WeeklyExpenses: 'Dépenses',
  Mortgage: 'Hypothèque'
}

export const FREQUENCY_LABELS: Record<string, string> = {
  Weekly: 'chaque semaine',
  BiWeekly: 'aux 2 semaines',
  SemiMonthly: '2 fois par mois',
  Monthly: 'chaque mois',
  Annually: 'chaque année',
  OneTime: 'une fois',
  Irregular: 'irrégulier'
}

// The API sends dates as "YYYY-MM-DD" (or an ISO timestamp); read the calendar date in local time
export function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Next due date of a bill, from the schedule JSON written by the backend
export function nextPaymentDate(scheduleJson?: string | null, from: Date = startOfToday()): Date | null {
  if (!scheduleJson) return null
  let schedule: { scheduleType?: string; dayOfMonth?: number; paymentDates?: string[] }
  try {
    schedule = JSON.parse(scheduleJson)
  } catch {
    return null
  }

  if (schedule.scheduleType === 'Monthly' && schedule.dayOfMonth) {
    for (let offset = 0; offset < 2; offset++) {
      const year = from.getFullYear()
      const month = from.getMonth() + offset
      // Clamp to the month's last day (e.g. the 31st in February)
      const lastDay = new Date(year, month + 1, 0).getDate()
      const candidate = new Date(year, month, Math.min(schedule.dayOfMonth, lastDay))
      if (candidate >= from) return candidate
    }
    return null
  }

  if (schedule.scheduleType === 'AnnualScheduled' && schedule.paymentDates?.length) {
    const upcoming = schedule.paymentDates
      .map(parseDateOnly)
      .filter((d): d is Date => d !== null && d >= from)
      .sort((a, b) => a.getTime() - b.getTime())
    return upcoming[0] ?? null
  }

  return null
}

export function daysUntil(date: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((date.getTime() - startOfToday().getTime()) / msPerDay)
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
}

export function formatMoney(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(amount)
}

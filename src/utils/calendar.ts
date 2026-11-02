import { parseDateOnly } from './envelopes'

export interface CalendarEvent {
  date: Date
  kind: 'bill' | 'pay'
  label: string
  amount: number
}

export interface BillInput {
  name: string
  amount: number
  scheduleJson?: string | null
}

export interface JobInput {
  name: string
  amount: number
  // The real payday the schedule is counted from (YYYY-MM-DD)
  anchorDate?: string | null
  frequency?: string | null
  interval?: number | null
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

// Due dates of a bill inside [from, to]. Supports the two schedules the app creates: a fixed day of
// the month, and an explicit list of dates
export function billOccurrences(bill: BillInput, from: Date, to: Date): CalendarEvent[] {
  if (!bill.scheduleJson) return []
  let schedule: { scheduleType?: string; dayOfMonth?: number; paymentDates?: string[] }
  try {
    schedule = JSON.parse(bill.scheduleJson)
  } catch {
    return []
  }

  const make = (date: Date): CalendarEvent => ({ date, kind: 'bill', label: bill.name, amount: bill.amount })

  if (schedule.paymentDates?.length) {
    return schedule.paymentDates
      .map(parseDateOnly)
      .filter((d): d is Date => d !== null && d >= from && d <= to)
      .map(make)
  }

  if (schedule.scheduleType === 'Monthly' && schedule.dayOfMonth) {
    const events: CalendarEvent[] = []
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
    while (cursor <= to) {
      // Clamp to the month's last day (e.g. the 31st in February)
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(schedule.dayOfMonth, daysInMonth))
      if (date >= from && date <= to) events.push(make(date))
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return events
  }

  return []
}

// Paydays of a job inside [from, to], counted from its anchor date (a real payday chosen by the user)
// with its frequency and interval. Each payday is computed from the anchor, so month ends do not drift.
export function payOccurrences(job: JobInput, from: Date, to: Date): CalendarEvent[] {
  const anchor = job.anchorDate ? parseDateOnly(job.anchorDate) : null
  if (!anchor || !job.frequency) return []

  const step = Math.max(job.interval ?? 1, 1)
  const occurrenceAt = (index: number): Date => {
    const offset = index * step
    switch (job.frequency) {
      case 'Weekly': return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * offset)
      case 'BiWeekly': return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 14 * offset)
      case 'SemiMonthly': return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 15 * offset)
      case 'Monthly':
      case 'Annually': {
        const months = job.frequency === 'Annually' ? 12 * offset : offset
        const year = anchor.getFullYear()
        const month = anchor.getMonth() + months
        // Clamp to the month's last day (e.g. the 31st in a 30-day month)
        const daysInTarget = new Date(year, month + 1, 0).getDate()
        return new Date(year, month, Math.min(anchor.getDate(), daysInTarget))
      }
      default: return anchor
    }
  }

  const events: CalendarEvent[] = []
  // Irregular (« Aucune ») has no schedule: nothing to show on the calendar
  if (job.frequency === 'Irregular') return []

  if (job.frequency === 'OneTime') {
    return anchor >= from && anchor <= to
      ? [{ date: startOfDay(anchor), kind: 'pay', label: job.name, amount: job.amount }]
      : []
  }

  for (let index = 0; index < 10000; index++) {
    const date = occurrenceAt(index)
    if (date > to) break
    if (date >= from) {
      events.push({ date: startOfDay(date), kind: 'pay', label: job.name, amount: job.amount })
    }
  }
  return events
}

// All bills and paydays inside [from, to], in date order
export function calendarEvents(bills: BillInput[], jobs: JobInput[], from: Date, to: Date): CalendarEvent[] {
  return [
    ...bills.flatMap(bill => billOccurrences(bill, from, to)),
    ...jobs.flatMap(job => payOccurrences(job, from, to))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())
}

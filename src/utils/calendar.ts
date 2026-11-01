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
  lastPaidAt?: string | null
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

// Paydays of a job after its last recorded paycheck, inside [from, to]. Projected from the frequency,
// so they are estimates: the real date can move (holidays, schedule changes)
export function payOccurrences(job: JobInput, from: Date, to: Date): CalendarEvent[] {
  const last = job.lastPaidAt ? parseDateOnly(job.lastPaidAt) : null
  if (!last || !job.frequency) return []

  const step = Math.max(job.interval ?? 1, 1)
  const advance = (date: Date): Date | null => {
    const next = new Date(date)
    switch (job.frequency) {
      case 'Weekly': next.setDate(next.getDate() + 7 * step); return next
      case 'BiWeekly': next.setDate(next.getDate() + 14 * step); return next
      case 'SemiMonthly': next.setDate(next.getDate() + 15 * step); return next
      case 'Monthly': next.setMonth(next.getMonth() + step); return next
      case 'Annually': next.setFullYear(next.getFullYear() + step); return next
      default: return null
    }
  }

  const events: CalendarEvent[] = []
  let cursor: Date | null = last
  // Walk forward from the last paycheck; the loop is bounded by the end of the window
  while (cursor && cursor <= to) {
    if (cursor >= from) {
      events.push({ date: startOfDay(cursor), kind: 'pay', label: job.name, amount: job.amount })
    }
    cursor = advance(cursor)
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

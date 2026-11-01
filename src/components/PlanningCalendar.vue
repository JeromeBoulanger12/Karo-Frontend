<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { calendarEvents, type BillInput, type JobInput, type CalendarEvent } from '../utils/calendar'

const { t } = useI18n()

const props = defineProps<{
  bills: BillInput[]
  jobs: JobInput[]
}>()

// Collapsed by default: the calendar is a planning aid, not the first thing to read
const open = ref(false)

const now = new Date()
// First day of the first visible month; the arrows move it by one month
const startMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const MONTHS_VISIBLE = 3
const months = computed(() =>
  Array.from({ length: MONTHS_VISIBLE }, (_, i) =>
    new Date(startMonth.value.getFullYear(), startMonth.value.getMonth() + i, 1)
  )
)

const rangeStart = computed(() => months.value[0])
const rangeEnd = computed(() => {
  const last = months.value[MONTHS_VISIBLE - 1]
  return new Date(last.getFullYear(), last.getMonth() + 1, 0, 23, 59, 59)
})

const events = computed(() => calendarEvents(props.bills, props.jobs, rangeStart.value, rangeEnd.value))

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const eventsByDay = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events.value) {
    const key = dayKey(event.date)
    map.set(key, [...(map.get(key) ?? []), event])
  }
  return map
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)

// Monday-first weekday names, from a known Monday (1 Jan 2024)
const weekdays = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('fr-CA', { weekday: 'short' }).format(new Date(2024, 0, 1 + i))
)

const monthTitle = (month: Date) =>
  month.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })

const rangeLabel = computed(() => {
  const first = months.value[0].toLocaleDateString('fr-CA', { month: 'long' })
  const last = months.value[MONTHS_VISIBLE - 1].toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
  return `${first} – ${last}`
})

interface Cell {
  key: string
  day: number | null
  date: Date | null
  isToday: boolean
  events: CalendarEvent[]
}

const cellsFor = (month: Date): Cell[] => {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // Monday-first: Sunday (0) goes last
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7

  const blanks: Cell[] = Array.from({ length: leading }, (_, i) => ({
    key: `blank-${i}`, day: null, date: null, isToday: false, events: []
  }))

  const days: Cell[] = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, monthIndex, i + 1)
    const dayEvents = eventsByDay.value.get(dayKey(date)) ?? []
    return {
      key: `day-${i + 1}`,
      day: i + 1,
      date,
      isToday: dayKey(date) === dayKey(now),
      events: dayEvents
    }
  })

  return [...blanks, ...days]
}

const shift = (delta: number) => {
  startMonth.value = new Date(startMonth.value.getFullYear(), startMonth.value.getMonth() + delta, 1)
}
</script>

<template>
  <section class="planning-calendar">
    <button class="cal-toggle" :aria-expanded="open" @click="open = !open">
      <span class="cal-toggle-title">
        <i class="mdi mdi-calendar-month"></i>
        {{ t('dashboard.calendar.title') }}
      </span>
      <i class="mdi" :class="open ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
    </button>

    <template v-if="open">
      <div class="cal-nav">
        <button class="cal-arrow" :aria-label="t('dashboard.calendar.previous')" @click="shift(-1)">
          <i class="mdi mdi-chevron-left"></i>
        </button>
        <span class="cal-range">{{ rangeLabel }}</span>
        <button class="cal-arrow" :aria-label="t('dashboard.calendar.next')" @click="shift(1)">
          <i class="mdi mdi-chevron-right"></i>
        </button>
      </div>

      <div class="cal-months">
        <div v-for="month in months" :key="month.getTime()" class="cal-month">
          <h4>{{ monthTitle(month) }}</h4>
          <div class="cal-grid">
            <span v-for="wd in weekdays" :key="wd" class="cal-weekday">{{ wd }}</span>
            <div
              v-for="cell in cellsFor(month)"
              :key="cell.key"
              class="cal-day"
              :class="{ 'is-today': cell.isToday, 'is-empty': cell.day === null, 'has-events': cell.events.length > 0 }"
              :tabindex="cell.events.length ? 0 : -1"
            >
              <span v-if="cell.day !== null" class="cal-day-number">{{ cell.day }}</span>
              <span v-if="cell.events.length" class="cal-dots">
                <i v-if="cell.events.some(e => e.kind === 'bill')" class="dot bill"></i>
                <i v-if="cell.events.some(e => e.kind === 'pay')" class="dot pay"></i>
              </span>
              <!-- Hover or focus on a day with events: name and amount of each item -->
              <div v-if="cell.events.length" class="cal-tooltip" role="tooltip">
                <div v-for="(event, index) in cell.events" :key="index" class="cal-tip-row">
                  <span class="cal-tip-dot" :class="event.kind"></span>
                  <span class="cal-tip-label">{{ event.label }}</span>
                  <strong class="cal-tip-amount">{{ formatCurrency(event.amount) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cal-legend">
        <span><i class="dot bill"></i> {{ t('dashboard.calendar.bills') }}</span>
        <span><i class="dot pay"></i> {{ t('dashboard.calendar.pays') }}</span>
      </div>

      <p v-if="!events.length" class="cal-empty">{{ t('dashboard.calendar.empty') }}</p>

      <p class="cal-note">{{ t('dashboard.calendar.estimate') }}</p>
    </template>
  </section>
</template>

<style scoped>
.planning-calendar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: 1.5rem;
}

.cal-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  padding: 0.25rem 0;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
}

.cal-toggle-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cal-toggle-title i {
  color: var(--primary);
}

.cal-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;
}

.cal-range {
  font-weight: 600;
  text-transform: capitalize;
  min-width: 14rem;
  text-align: center;
}

.cal-arrow {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  color: var(--text-primary);
}

.cal-arrow:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.cal-months {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
}

.cal-month h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  text-transform: capitalize;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}

.cal-weekday {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  padding-bottom: 0.25rem;
}

.cal-day {
  position: relative;
  min-height: 2.25rem;
  border-radius: 6px;
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.cal-day.has-events {
  background: var(--bg);
  border: 1px solid var(--border);
}

.cal-day.is-today {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  font-weight: 700;
}

.cal-day.is-empty {
  background: transparent;
  border: none;
}

.cal-dots {
  display: flex;
  gap: 3px;
  height: 6px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.bill {
  background: var(--danger);
}

.dot.pay {
  background: var(--success);
}

.cal-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cal-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.cal-empty,
.cal-note {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.cal-day:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.cal-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  min-width: 12rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  text-align: left;
  white-space: nowrap;
}

.cal-day.has-events:hover .cal-tooltip,
.cal-day.has-events:focus-visible .cal-tooltip {
  display: block;
}

.cal-tip-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  color: var(--text-primary);
}

.cal-tip-row + .cal-tip-row {
  border-top: 1px solid var(--border);
}

.cal-tip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cal-tip-dot.bill {
  background: var(--danger);
}

.cal-tip-dot.pay {
  background: var(--success);
}

.cal-tip-amount {
  white-space: nowrap;
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { calendarEvents, type BillInput, type JobInput, type CalendarEvent } from '../utils/calendar'

const { t } = useI18n()

const props = defineProps<{
  bills: BillInput[]
  jobs: JobInput[]
}>()

const now = new Date()
// First day of the first visible month; the arrows move it by one month
const startMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const MONTHS_VISIBLE = 2
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
    <h3 class="cal-title">
      <i class="mdi mdi-calendar-month"></i>
      {{ t('dashboard.calendar.title') }}
    </h3>

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
              :class="{
                'is-today': cell.isToday,
                'is-empty': cell.day === null
              }"
            >
              <span v-if="cell.day !== null" class="cal-day-number">{{ cell.day }}</span>
              <!-- Each item of the day, written in the box: name and amount -->
              <div
                v-for="(event, index) in cell.events"
                :key="index"
                class="cal-event"
                :class="event.kind"
                :title="`${event.label} : ${formatCurrency(event.amount)}`"
              >
                <span class="cal-event-label">{{ event.label }}</span>
                <strong class="cal-event-amount">{{ formatCurrency(event.amount) }}</strong>
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

.cal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.25rem 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
}

.cal-title i {
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
  min-width: 0;
  min-height: 4rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.25rem;
  font-size: 0.8125rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  text-align: left;
}

.cal-day-number {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cal-day.is-today {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.cal-day.is-today .cal-day-number {
  color: var(--primary);
  font-weight: 700;
}

/* Each item in the box: red for a bill, green for a pay */
.cal-event {
  display: flex;
  flex-direction: column;
  padding: 1px 4px;
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 0.6875rem;
  line-height: 1.25;
}

.cal-event.bill {
  background: rgba(239, 68, 68, 0.12);
  border-left-color: var(--danger);
}

.cal-event.pay {
  background: rgba(16, 185, 129, 0.12);
  border-left-color: var(--success);
}

.cal-event-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.cal-event-amount {
  white-space: nowrap;
}

.cal-event.bill .cal-event-amount {
  color: var(--danger);
}

.cal-event.pay .cal-event-amount {
  color: var(--success);
}

/* Phones: boxes are too narrow for the name, the amount stays (the full text is in the title) */
@media (max-width: 600px) {
  .cal-event {
    padding: 1px 2px;
    font-size: 0.5625rem;
    overflow: hidden;
  }

  .cal-event-label {
    display: none;
  }
}

.cal-day.is-empty {
  background: transparent;
  border: none;
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
</style>

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
// First day of the month shown; the arrows move it by one month
const month = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const monthEnd = computed(() =>
  new Date(month.value.getFullYear(), month.value.getMonth() + 1, 0, 23, 59, 59)
)

const events = computed(() => calendarEvents(props.bills, props.jobs, month.value, monthEnd.value))

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

// Sunday-first weekday names, from a known Sunday (7 Jan 2024)
const weekdays = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('fr-CA', { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
)

const monthTitle = computed(() =>
  month.value.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
)

interface Cell {
  key: string
  day: number | null
  date: Date | null
  isToday: boolean
  events: CalendarEvent[]
}

const cells = computed((): Cell[] => {
  const year = month.value.getFullYear()
  const monthIndex = month.value.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // Sunday-first: getDay() is already the number of blanks before day 1
  const leading = new Date(year, monthIndex, 1).getDay()

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
})

const shift = (delta: number) => {
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
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
      <span class="cal-range">{{ monthTitle }}</span>
      <button class="cal-arrow" :aria-label="t('dashboard.calendar.next')" @click="shift(1)">
        <i class="mdi mdi-chevron-right"></i>
      </button>
    </div>

    <div class="cal-grid">
      <span v-for="wd in weekdays" :key="wd" class="cal-weekday">{{ wd }}</span>
      <div
        v-for="cell in cells"
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
  min-height: 5rem;
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

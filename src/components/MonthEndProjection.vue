<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MonthEndResult } from '../utils/monthEnd'

const { t } = useI18n()

const props = defineProps<{
  result: MonthEndResult
}>()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (value: Date) =>
  value.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })

// "octobre 2026": the month this projection is about, so the user knows which month it covers
const monthLabel = new Date().toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })

const isOk = computed(() => props.result.projection >= 0)
const daysLabel = computed(() =>
  props.result.daysLeft === 0
    ? t('dashboard.monthEnd.lastDay')
    : t('dashboard.monthEnd.daysLeft', { days: props.result.daysLeft })
)
</script>

<template>
  <section class="month-end" :class="isOk ? 'is-ok' : 'is-risk'">
    <div class="month-end-header">
      <div>
        <h3>{{ t('dashboard.monthEnd.title') }}</h3>
        <span class="month-end-month">{{ monthLabel }}</span>
      </div>
      <span class="month-end-days">{{ daysLabel }}</span>
    </div>

    <div class="month-end-main">
      <span class="month-end-badge">
        <i class="mdi" :class="isOk ? 'mdi-check-circle' : 'mdi-alert'"></i>
        {{ isOk ? t('dashboard.monthEnd.ok') : t('dashboard.monthEnd.risk') }}
      </span>
      <p class="month-end-value">{{ formatCurrency(result.projection) }}</p>
      <p class="month-end-caption">{{ t('dashboard.monthEnd.caption') }}</p>
    </div>

    <ul class="month-end-breakdown">
      <li>
        <span>{{ t('dashboard.monthEnd.surplus') }}</span>
        <strong>{{ formatCurrency(result.surplus) }}</strong>
      </li>
      <li>
        <span>{{ result.daysLeft === 0 ? t('dashboard.monthEnd.incomeNone') : t('dashboard.monthEnd.income', { days: result.daysLeft }) }}</span>
        <strong class="amount-up">+ {{ formatCurrency(result.remainingIncome) }}</strong>
      </li>
      <li>
        <span>{{ t('dashboard.monthEnd.unfunded') }}</span>
        <strong class="amount-down">− {{ formatCurrency(result.unfundedTotal) }}</strong>
      </li>
    </ul>

    <div v-if="result.unfundedBills.length" class="month-end-unfunded">
      <p class="unfunded-title">{{ t('dashboard.monthEnd.unfundedTitle') }}</p>
      <ul>
        <li v-for="bill in result.unfundedBills" :key="bill.name + bill.dueDate.getTime()">
          {{ t('dashboard.monthEnd.unfundedItem', { name: bill.name, amount: formatCurrency(bill.amount), date: formatDate(bill.dueDate) }) }}
        </li>
      </ul>
    </div>

    <p class="month-end-note">{{ t('dashboard.monthEnd.estimate') }}</p>
  </section>
</template>

<style scoped>
.month-end {
  border: 1px solid var(--border);
  border-left: 6px solid var(--success);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--surface) 60%);
  box-shadow: var(--shadow-md);
}

.month-end.is-risk {
  border-left-color: var(--danger);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--surface) 60%);
}

.month-end-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.month-end-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
}

.month-end-month {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.month-end-days {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  white-space: nowrap;
}

.month-end-main {
  margin: 1rem 0;
}

.month-end-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.is-ok .month-end-badge {
  background: var(--success);
}

.is-risk .month-end-badge {
  background: var(--danger);
}

.month-end-value {
  margin: 0.5rem 0 0;
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.is-ok .month-end-value {
  color: var(--success);
}

.is-risk .month-end-value {
  color: var(--danger);
}

.month-end-caption {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.month-end-breakdown {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--surface);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9375rem;
}

.month-end-breakdown li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 0.875rem;
}

.month-end-breakdown li + li {
  border-top: 1px solid var(--border);
}

.month-end-breakdown strong {
  font-size: 1rem;
  white-space: nowrap;
}

.amount-up {
  color: var(--success);
}

.amount-down {
  color: var(--danger);
}

.month-end-unfunded {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md, 8px);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  font-size: 0.875rem;
  color: var(--danger);
}

.unfunded-title {
  margin: 0 0 0.25rem;
  font-weight: 700;
}

.month-end-unfunded ul {
  margin: 0;
  padding-left: 1.125rem;
}

.month-end-note {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>

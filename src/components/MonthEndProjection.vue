<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MonthEndResult } from '../utils/monthEnd'

const { t } = useI18n()

defineProps<{
  result: MonthEndResult
}>()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (value: Date) =>
  value.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })
</script>

<template>
  <section class="month-end" :class="result.projection >= 0 ? 'is-ok' : 'is-risk'">
    <div class="month-end-header">
      <h3>{{ t('dashboard.monthEnd.title') }}</h3>
      <span class="month-end-days">{{ t('dashboard.monthEnd.daysLeft', { days: result.daysLeft }) }}</span>
    </div>

    <p class="month-end-value">{{ formatCurrency(result.projection) }}</p>
    <p class="month-end-verdict">
      {{ result.projection >= 0 ? t('dashboard.monthEnd.ok') : t('dashboard.monthEnd.risk') }}
    </p>

    <ul class="month-end-breakdown">
      <li>
        <span>{{ t('dashboard.monthEnd.surplus') }}</span>
        <span>{{ formatCurrency(result.surplus) }}</span>
      </li>
      <li>
        <span>{{ t('dashboard.monthEnd.income', { days: result.daysLeft }) }}</span>
        <span class="amount-up">+ {{ formatCurrency(result.remainingIncome) }}</span>
      </li>
      <li>
        <span>{{ t('dashboard.monthEnd.unfunded') }}</span>
        <span class="amount-down">− {{ formatCurrency(result.unfundedTotal) }}</span>
      </li>
    </ul>

    <ul v-if="result.unfundedBills.length" class="month-end-unfunded">
      <li v-for="bill in result.unfundedBills" :key="bill.name + bill.dueDate.getTime()">
        {{ t('dashboard.monthEnd.unfundedItem', { name: bill.name, amount: formatCurrency(bill.amount), date: formatDate(bill.dueDate) }) }}
      </li>
    </ul>

    <p class="month-end-note">{{ t('dashboard.monthEnd.estimate') }}</p>
  </section>
</template>

<style scoped>
.month-end {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--success);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: 1.5rem;
}

.month-end.is-risk {
  border-left-color: var(--danger);
}

.month-end-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.month-end-header h3 {
  margin: 0;
  font-size: 1rem;
}

.month-end-days {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.month-end-value {
  margin: 0.5rem 0 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.is-ok .month-end-value {
  color: var(--success);
}

.is-risk .month-end-value {
  color: var(--danger);
}

.month-end-verdict {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.month-end-breakdown {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
}

.month-end-breakdown li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
  border-top: 1px solid var(--border);
}

.amount-up {
  color: var(--success);
  white-space: nowrap;
}

.amount-down {
  color: var(--danger);
  white-space: nowrap;
}

.month-end-unfunded {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: var(--danger);
}

.month-end-note {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>

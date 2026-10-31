<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type EnvelopeSummary,
  parseDateOnly,
  nextPaymentDate,
  daysUntil,
  formatShortDate,
  formatMoney
} from '../utils/envelopes'

const props = defineProps<{
  envelope: EnvelopeSummary
}>()

const { t } = useI18n()

const emit = defineEmits<{
  select: [envelope: EnvelopeSummary]
  edit: [envelope: EnvelopeSummary]
}>()

const balance = computed(() => props.envelope.balance?.amount ?? 0)
const currency = computed(() => props.envelope.balance?.currency ?? 'CAD')
const target = computed(() => props.envelope.targetAmount?.amount ?? 0)
const percentage = computed(() => (target.value > 0 ? Math.min((balance.value / target.value) * 100, 100) : 0))

const isBill = computed(() => props.envelope.purpose === 'Bill')
const purposeLabel = computed(() => t(`enums.envelopePurposes.${props.envelope.purpose}`))

// Status line: next due date for bills, last payment, automatic withdrawal or target date
const statusLines = computed(() => {
  const lines: string[] = []
  const next = isBill.value ? nextPaymentDate(props.envelope.billPaymentScheduleJson) : null
  if (next) {
    const days = daysUntil(next)
    const when = days === 0 ? t('envelopes.row.today') : days === 1 ? t('envelopes.row.tomorrow') : t('envelopes.row.inDays', { days })
    lines.push(t('envelopes.row.dueDate', { date: formatShortDate(next), when }))
  }
  const lastPaid = parseDateOnly(props.envelope.billLastPaidDate)
  if (lastPaid) lines.push(t('envelopes.row.paidOn', { date: formatShortDate(lastPaid) }))
  if (props.envelope.isAutomaticWithdrawal && props.envelope.withdrawalFrequency) {
    const frequency = t(`enums.recurrenceFrequencies.${props.envelope.withdrawalFrequency}`)
    lines.push(t('envelopes.row.withdrawal', { frequency }))
  }
  const targetDate = parseDateOnly(props.envelope.targetDate)
  if (targetDate && !isBill.value) lines.push(t('envelopes.row.targetDate', { date: formatShortDate(targetDate) }))
  return lines
})
</script>

<template>
  <div class="envelope-row" @click="emit('select', envelope)">
    <div class="row-name">
      <div class="name">{{ envelope.name }}</div>
      <div class="purpose">
        {{ purposeLabel }}
        <span v-if="envelope.isShareable" class="tag tag-shared">{{ t('envelopes.row.shared') }}</span>
        <span v-if="envelope.linkedEnvelopeId" class="tag tag-linked">{{ t('envelopes.row.linked') }}</span>
      </div>
    </div>

    <div class="row-amount">
      <div class="amount">
        <strong>{{ formatMoney(balance, currency) }}</strong>
        <span v-if="target > 0" class="target"> / {{ formatMoney(target, currency) }}</span>
      </div>
      <div v-if="target > 0" class="progress">
        <div class="progress-fill" :style="{ width: percentage + '%' }" :class="{ full: percentage >= 100 }"></div>
      </div>
    </div>

    <div class="row-status">
      <div v-for="line in statusLines" :key="line" class="status-line">{{ line }}</div>
    </div>

    <button class="edit-button" :title="t('envelopes.row.edit')" :aria-label="t('envelopes.row.edit')" @click.stop="emit('edit', envelope)">
      <i class="mdi mdi-pencil"></i>
    </button>
  </div>
</template>

<style scoped>
.envelope-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.envelope-row:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.row-name,
.row-amount,
.row-status {
  min-width: 0;
}

.name {
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.purpose {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tag {
  padding: 0.0625rem 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.tag-shared {
  background: #fef3c7;
  color: #92400e;
}

.tag-linked {
  background: #e0e7ff;
  color: #3730a3;
}

.amount {
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount strong {
  color: var(--primary);
}

.target {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.progress {
  margin-top: 0.375rem;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.full {
  background: var(--success);
}

.status-line {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1.125rem;
}

.edit-button:hover {
  background: var(--surface);
  color: var(--primary);
}

@media (max-width: 800px) {
  .envelope-row {
    grid-template-columns: 1fr auto;
  }

  .row-amount,
  .row-status {
    grid-column: 1 / -1;
  }
}
</style>

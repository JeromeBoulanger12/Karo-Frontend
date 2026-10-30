<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  type EnvelopeSummary,
  PURPOSE_LABELS,
  FREQUENCY_LABELS,
  parseDateOnly,
  nextPaymentDate,
  daysUntil,
  formatShortDate,
  formatMoney
} from '../utils/envelopes'

const props = defineProps<{
  envelope: EnvelopeSummary
}>()

const emit = defineEmits<{
  edit: [envelope: EnvelopeSummary]
  pay: [envelope: EnvelopeSummary]
  transfer: [envelope: EnvelopeSummary]
  withdraw: [envelope: EnvelopeSummary]
}>()

const menuOpen = ref(false)

const balance = computed(() => props.envelope.balance?.amount ?? 0)
const currency = computed(() => props.envelope.balance?.currency ?? 'CAD')
const target = computed(() => props.envelope.targetAmount?.amount ?? 0)
const percentage = computed(() => (target.value > 0 ? Math.min((balance.value / target.value) * 100, 100) : 0))

const isBill = computed(() => props.envelope.purpose === 'Bill')
const isDebt = computed(() => props.envelope.purpose === 'DebtPayment')
const purposeLabel = computed(() => PURPOSE_LABELS[props.envelope.purpose] ?? props.envelope.purpose)

const canPay = computed(() => (isBill.value || isDebt.value) && balance.value > 0)
// Debt envelopes can't be withdrawn from: the backend refuses it
const canWithdraw = computed(() => balance.value > 0 && !isDebt.value)
const canTransfer = computed(() => balance.value > 0)
const hasActions = computed(() => canPay.value || canTransfer.value || canWithdraw.value)

// Status line: next due date for bills, last payment, automatic withdrawal or target date
const statusLines = computed(() => {
  const lines: string[] = []
  const next = isBill.value ? nextPaymentDate(props.envelope.billPaymentScheduleJson) : null
  if (next) {
    const days = daysUntil(next)
    const when = days === 0 ? "aujourd'hui" : days === 1 ? 'demain' : `dans ${days} j`
    lines.push(`Échéance ${formatShortDate(next)} (${when})`)
  }
  const lastPaid = parseDateOnly(props.envelope.billLastPaidDate)
  if (lastPaid) lines.push(`Payé le ${formatShortDate(lastPaid)}`)
  if (props.envelope.isAutomaticWithdrawal && props.envelope.withdrawalFrequency) {
    const frequency = FREQUENCY_LABELS[props.envelope.withdrawalFrequency] ?? props.envelope.withdrawalFrequency
    lines.push(`Prélèvement ${frequency}`)
  }
  const targetDate = parseDateOnly(props.envelope.targetDate)
  if (targetDate && !isBill.value) lines.push(`Cible au ${formatShortDate(targetDate)}`)
  return lines
})

const closeMenu = () => {
  menuOpen.value = false
}

const runPay = () => {
  closeMenu()
  emit('pay', props.envelope)
}

const runTransfer = () => {
  closeMenu()
  emit('transfer', props.envelope)
}

const runWithdraw = () => {
  closeMenu()
  emit('withdraw', props.envelope)
}
</script>

<template>
  <div class="envelope-row" @click="emit('edit', envelope)">
    <div class="row-name">
      <div class="name">{{ envelope.name }}</div>
      <div class="purpose">
        {{ purposeLabel }}
        <span v-if="envelope.isShareable" class="tag tag-shared">Partagé</span>
        <span v-if="envelope.linkedEnvelopeId" class="tag tag-linked">Liée</span>
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

    <div class="row-menu" @click.stop>
      <button
        v-if="hasActions"
        class="menu-button"
        :aria-expanded="menuOpen"
        aria-label="Actions"
        @click="menuOpen = !menuOpen"
      >
        <i class="mdi mdi-dots-vertical"></i>
      </button>

      <template v-if="menuOpen">
        <div class="menu-overlay" @click="closeMenu"></div>
        <div class="menu">
          <button v-if="canPay" class="menu-item" @click="runPay">
            <i class="mdi mdi-check"></i>
            {{ isDebt ? 'Payer la dette' : 'Payé' }}
          </button>
          <button v-if="canTransfer" class="menu-item" @click="runTransfer">
            <i class="mdi mdi-swap-horizontal"></i>
            Transférer
          </button>
          <button v-if="canWithdraw" class="menu-item danger" @click="runWithdraw">
            <i class="mdi mdi-cash-minus"></i>
            Retirer
          </button>
        </div>
      </template>
    </div>
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

.row-menu {
  position: relative;
}

.menu-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1.25rem;
}

.menu-button:hover {
  background: var(--surface);
  color: var(--primary);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 11;
  min-width: 160px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: var(--shadow-lg);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: left;
}

.menu-item:hover {
  background: var(--surface);
}

.menu-item.danger {
  color: var(--danger);
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

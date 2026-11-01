<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EnvelopeSummary } from '../utils/envelopes'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  isOpen: boolean
  envelope?: EnvelopeSummary | null
}>(), {
  isOpen: false,
  envelope: null
})

const emit = defineEmits<{
  close: []
  add: [payload: { amount: number; memo?: string }]
}>()

// Quick targets: reach this share of the envelope's target amount (e.g. 50% of the next bill)
const PERCENT_STEPS = [25, 50, 75, 100]

const amount = ref<number | null>(null)
const memo = ref('')
const error = ref('')

const balance = computed(() => props.envelope?.balance?.amount ?? 0)
const currency = computed(() => props.envelope?.balance?.currency ?? 'CAD')
const target = computed(() => props.envelope?.targetAmount?.amount ?? 0)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: currency.value }).format(value)

// Amount still needed to reach the given share of the target (never negative)
const amountToReach = (percent: number) => Math.max(0, Math.round((target.value * percent / 100 - balance.value) * 100) / 100)

const balanceAfterAdd = computed(() => {
  if (amount.value === null || Number.isNaN(amount.value)) return balance.value
  return balance.value + amount.value
})

const selectPercent = (percent: number) => {
  amount.value = amountToReach(percent)
  error.value = ''
}

watch(() => props.isOpen, (open) => {
  if (open) {
    amount.value = null
    memo.value = ''
    error.value = ''
  }
})

const handleSubmit = () => {
  error.value = ''
  if (amount.value === null || amount.value <= 0) {
    error.value = t('envelopes.addModal.errorPositive')
    return
  }
  emit('add', {
    amount: amount.value,
    memo: memo.value.trim() || undefined
  })
}
</script>

<template>
  <div v-if="isOpen && envelope" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('envelopes.addModal.title') }}</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="source-info">
          {{ t('envelopes.addModal.to', { name: envelope.name, amount: formatCurrency(balance) }) }}
        </p>

        <template v-if="target > 0">
          <p class="target-info">
            {{ t('envelopes.addModal.target', { amount: formatCurrency(target) }) }}
          </p>
          <div class="percent-choices">
            <button
              v-for="percent in PERCENT_STEPS"
              :key="percent"
              type="button"
              class="percent-choice"
              :disabled="amountToReach(percent) <= 0"
              @click="selectPercent(percent)"
            >
              {{ t('envelopes.addModal.percentOfTarget', { percent }) }}
            </button>
          </div>
        </template>

        <div class="form-group">
          <label>{{ t('envelopes.addModal.amount') }}</label>
          <input v-model.number="amount" type="number" step="0.01" min="0" />
        </div>

        <div class="form-group">
          <label>{{ t('envelopes.addModal.memo') }}</label>
          <input v-model="memo" type="text" maxlength="200" />
        </div>

        <p class="remaining">
          {{ t('envelopes.addModal.after', { amount: formatCurrency(balanceAfterAdd) }) }}
        </p>

        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="handleSubmit">{{ t('envelopes.addModal.submit') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.percent-choices {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.percent-choice {
  padding: 0.5rem 0.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.percent-choice:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.percent-choice:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.source-info,
.target-info,
.remaining {
  margin: 0;
  color: var(--text-muted);
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-secondary {
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}
</style>

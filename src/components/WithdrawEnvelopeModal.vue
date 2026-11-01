<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Money {
  amount: number
  currency: string
}

interface Envelope {
  id: string
  name: string
  balance?: Money
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  source?: Envelope | null
}>(), {
  isOpen: false,
  submitError: '',
  source: null
})

const emit = defineEmits<{
  close: []
  withdraw: [payload: { amount: number; payee?: string; memo?: string }]
}>()

const amount = ref<number | null>(null)
const payee = ref('')
const memo = ref('')
const error = ref('')

const balance = computed(() => props.source?.balance?.amount ?? 0)
const currency = computed(() => props.source?.balance?.currency ?? 'CAD')

const remainingAfterWithdrawal = computed(() => {
  if (amount.value === null || Number.isNaN(amount.value)) return balance.value
  return balance.value - amount.value
})

watch(() => props.isOpen, (open) => {
  if (open && !props.submitError) {
    amount.value = null
    payee.value = ''
    memo.value = ''
    error.value = ''
  }
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: currency.value }).format(value)

const handleSubmit = () => {
  error.value = ''
  if (amount.value === null || amount.value <= 0) {
    error.value = t('envelopes.withdrawModal.errorPositive')
    return
  }
  if (amount.value > balance.value) {
    error.value = t('envelopes.withdrawModal.errorInsufficient', { amount: formatCurrency(balance.value) })
    return
  }
  emit('withdraw', {
    amount: amount.value,
    payee: payee.value.trim() || undefined,
    memo: memo.value.trim() || undefined
  })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('envelopes.withdrawModal.title') }}</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="source-info">
          {{ t('envelopes.withdrawModal.from', { name: source?.name, amount: formatCurrency(balance) }) }}
        </p>
        <p class="hint">{{ t('envelopes.withdrawModal.hint') }}</p>

        <div class="form-group">
          <label>{{ t('envelopes.withdrawModal.amount') }}</label>
          <input v-model.number="amount" type="number" step="0.01" min="0" :max="balance" />
        </div>

        <div class="form-group">
          <label>{{ t('envelopes.withdrawModal.payee') }}</label>
          <input v-model="payee" type="text" maxlength="200" />
        </div>

        <div class="form-group">
          <label>{{ t('envelopes.withdrawModal.memo') }}</label>
          <input v-model="memo" type="text" maxlength="200" />
        </div>

        <p class="remaining">
          {{ t('envelopes.withdrawModal.remaining', { amount: formatCurrency(remainingAfterWithdrawal) }) }}
        </p>

        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="handleSubmit">{{ t('envelopes.withdrawModal.submit') }}</button>
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
.hint,
.remaining {
  margin: 0;
  color: var(--text-muted);
}

.hint {
  font-size: 0.875rem;
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

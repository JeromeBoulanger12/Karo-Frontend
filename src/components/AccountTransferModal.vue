<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { canTransferBetween } from '../utils/accounts'

interface Account {
  id: string
  name: string
  type: string
  currency?: string
  latestBalance?: { amount?: number }
  latestSnapshot?: { amount?: { amount?: number } }
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  // The account the money leaves
  account?: Account | null
  accounts?: Account[]
  // The source's balance minus its envelopes: only this part can be transferred
  surplus?: number | null
}>(), {
  isOpen: false,
  submitError: '',
  account: null,
  accounts: () => [],
  surplus: null
})

const emit = defineEmits<{
  close: []
  save: [payload: { toAccountId: string; amount: number; note?: string }]
}>()

const { t, locale } = useI18n()

const toAccountId = ref('')
const amount = ref<number | null>(null)
const note = ref('')
const validationError = ref('')

const balanceOf = (account?: Account | null) =>
  account?.latestBalance?.amount ?? account?.latestSnapshot?.amount?.amount ?? 0

// Only the other chequing, savings and investment accounts can receive the money
const destinations = computed(() =>
  props.accounts.filter(a => a.id !== props.account?.id && canTransferBetween(a.type))
)
const destination = computed(() => destinations.value.find(a => a.id === toAccountId.value) ?? null)

const sourceBalance = computed(() => balanceOf(props.account))
// The money in the envelopes is already planned: only the surplus can leave the account
const available = computed(() => Math.max(0, Math.min(props.surplus ?? 0, sourceBalance.value)))
const hasSurplus = computed(() => available.value > 0)
const canSubmit = computed(() => hasSurplus.value && destinations.value.length > 0)
const roundedAmount = computed(() => Math.round((amount.value || 0) * 100) / 100)

// Start each fresh transfer empty; keep what was typed when reopened after an error. With a single
// possible destination, it is chosen already.
watch(() => props.isOpen, (open) => {
  if (!open || props.submitError) return
  toAccountId.value = destinations.value.length === 1 ? destinations.value[0].id : ''
  amount.value = null
  note.value = ''
  validationError.value = ''
})

const handleSubmit = () => {
  validationError.value = ''
  if (!destination.value) {
    validationError.value = t('accountTransfer.errors.destinationRequired')
    return
  }
  if (!(roundedAmount.value > 0)) {
    validationError.value = t('accountTransfer.errors.amountPositive')
    return
  }
  if (roundedAmount.value > available.value) {
    validationError.value = t('accountTransfer.errors.insufficient', { amount: formatCurrency(available.value) })
    return
  }
  emit('save', { toAccountId: destination.value.id, amount: roundedAmount.value, note: note.value.trim() || undefined })
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: props.account?.currency || 'CAD'
  }).format(value)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('accountTransfer.title') }}</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="validationError" class="error-message">{{ validationError }}</div>

        <div class="account-info">
          <p class="account-name">{{ t('accountTransfer.from', { name: account?.name }) }}</p>
          <p class="account-current">
            {{ t('accountTransfer.balance') }} <strong>{{ formatCurrency(sourceBalance) }}</strong>
          </p>
          <p class="account-current">
            {{ t('accountTransfer.available') }} <strong>{{ formatCurrency(available) }}</strong>
          </p>
        </div>

        <p v-if="!hasSurplus" class="error-message">{{ t('accountTransfer.noSurplus') }}</p>
        <p v-else-if="destinations.length === 0" class="hint">{{ t('accountTransfer.noDestination') }}</p>

        <template v-else>
          <div class="form-group">
            <label>{{ t('accountTransfer.to') }}</label>
            <select v-model="toAccountId">
              <option value="" disabled>{{ t('accountTransfer.chooseDestination') }}</option>
              <option v-for="acc in destinations" :key="acc.id" :value="acc.id">
                {{ acc.name }} ({{ formatCurrency(balanceOf(acc)) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('accountTransfer.amount') }}</label>
            <input v-model.number="amount" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>

          <div v-if="destination && roundedAmount > 0" class="balance-preview">
            <div>
              <span class="preview-label">{{ account?.name }}</span>
              <span class="preview-value">{{ formatCurrency(sourceBalance - roundedAmount) }}</span>
            </div>
            <div>
              <span class="preview-label">{{ destination.name }}</span>
              <span class="preview-value">{{ formatCurrency(balanceOf(destination) + roundedAmount) }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('accountTransfer.note') }}</label>
            <input v-model="note" type="text" maxlength="300" :placeholder="t('accountTransfer.notePlaceholder')" />
          </div>

          <small class="hint">{{ t('accountTransfer.hint') }}</small>
        </template>
      </div>

      <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!canSubmit" @click="handleSubmit">
          {{ t('accountTransfer.submit') }}
        </button>
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
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-size-2xl);
  width: 40px;
  height: 40px;
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.account-info {
  background: var(--surface);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary);
}

.account-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.account-current {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

.account-current strong {
  color: var(--text-primary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-group label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select {
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  background: var(--surface);
  color: var(--text-primary);
}

.balance-preview {
  background: var(--surface);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.balance-preview > div {
  display: flex;
  justify-content: space-between;
}

.preview-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
}

.preview-value {
  font-weight: var(--font-weight-bold);
  color: var(--primary);
}

.hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.error-text {
  margin: 0 var(--space-lg);
  color: var(--danger);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .modal {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>

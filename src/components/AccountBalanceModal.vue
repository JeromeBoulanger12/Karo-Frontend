<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Account {
  id: string
  name: string
  balance?: number
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  account?: Account | null
}>(), {
  isOpen: false,
  submitError: '',
  account: null
})

const emit = defineEmits<{
  close: []
  save: [payload: { balance: number; note?: string }]
}>()

const { t, locale } = useI18n()

const formData = ref<{ balance: number }>({
  balance: props.account?.balance || 0
})
const note = ref('')

// 'set' types the new balance; 'adjust' adds or removes an amount from the current balance
const mode = ref<'set' | 'adjust'>('set')
const adjustment = ref<number>(0)

const currentBalance = computed(() => props.account?.balance || 0)
const newBalance = computed(() => {
  const value = mode.value === 'set' ? formData.value.balance : currentBalance.value + (adjustment.value || 0)
  return Math.round((value || 0) * 100) / 100
})

// Setting the balance to 0 is often a typing mistake: it must be confirmed once before saving
const needsZeroConfirmation = computed(() => newBalance.value === 0 && currentBalance.value !== 0)
const zeroConfirmed = ref(false)
watch(newBalance, () => { zeroConfirmed.value = false })

watch(() => props.account, (newAccount) => {
  if (newAccount) {
    formData.value.balance = newAccount.balance || 0
    adjustment.value = 0
  }
}, { deep: true, immediate: true })

// Start each fresh entry with an empty note; keep what was typed when reopened after an error
watch(() => props.isOpen, (open) => {
  if (open && !props.submitError) note.value = ''
})

const handleSubmit = () => {
  if (needsZeroConfirmation.value && !zeroConfirmed.value) {
    zeroConfirmed.value = true
    return
  }
  emit('save', { balance: newBalance.value, note: note.value.trim() || undefined })
}

const handleClose = () => {
  emit('close')
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'CAD'
  }).format(value)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('accountBalance.title') }}</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="account-info">
          <p class="account-name">{{ account?.name }}</p>
          <p class="account-current">
            {{ t('accountBalance.currentBalance') }} <strong>{{ formatCurrency(account?.balance || 0) }}</strong>
          </p>
        </div>

        <div class="mode-switch">
          <button type="button" :class="{ active: mode === 'set' }" @click="mode = 'set'">
            {{ t('accountBalance.modeSet') }}
          </button>
          <button type="button" :class="{ active: mode === 'adjust' }" @click="mode = 'adjust'">
            {{ t('accountBalance.modeAdjust') }}
          </button>
        </div>

        <div v-if="mode === 'set'" class="form-group">
          <label>{{ t('accountBalance.newBalanceLabel') }}</label>
          <input v-model.number="formData.balance" type="number" step="0.01" placeholder="0.00" />
        </div>

        <div v-else class="form-group">
          <label>{{ t('accountBalance.adjustLabel') }}</label>
          <input v-model.number="adjustment" type="number" step="0.01" placeholder="0.00" />
          <small class="form-hint">{{ t('accountBalance.adjustHint') }}</small>
        </div>

        <div class="balance-preview">
          <span class="preview-label">{{ t('accountBalance.previewLabel') }}</span>
          <span class="preview-value">{{ formatCurrency(newBalance) }}</span>
        </div>

        <p v-if="needsZeroConfirmation && zeroConfirmed" class="zero-warning">
          {{ t('accountBalance.zeroWarning') }}
        </p>

        <div class="form-group">
          <label>{{ t('accountBalance.noteLabel') }}</label>
          <input v-model="note" type="text" maxlength="500" :placeholder="t('accountBalance.notePlaceholder')" />
        </div>
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="handleSubmit">
          {{ needsZeroConfirmation && zeroConfirmed ? t('accountBalance.confirmZero') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--transition-fast);
}

.modal {
  background: var(--bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp var(--transition-base);
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
  padding: 0;
  transition: all var(--transition-fast);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-primary);
  background: var(--surface);
  border-radius: var(--radius-md);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.account-info {
  background: var(--surface);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary);
}

.account-name {
  font-size: var(--font-size-base);
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
  font-weight: var(--font-weight-semibold);
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

.form-group input[type="number"] {
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-group input[type="number"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.mode-switch {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.mode-switch button {
  flex: 1;
  padding: var(--space-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.mode-switch button.active {
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.zero-warning {
  color: var(--danger);
  font-size: var(--font-size-sm);
  margin: var(--space-sm) 0 0;
}

.balance-preview {
  background: var(--surface);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
}

.preview-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--primary);
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
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .modal {
    width: 95%;
    border-radius: var(--radius-md);
  }

  .modal-header {
    padding: var(--space-md);
  }

  .modal-body {
    padding: var(--space-md);
  }

  .modal-footer {
    flex-direction: column;
    padding: var(--space-md);
  }
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}
</style>

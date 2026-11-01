<script setup lang="ts">
import { computed } from 'vue'
import type { EnvelopeSummary } from '../utils/envelopes'
import { useI18n } from 'vue-i18n'
import { formatMoney } from '../utils/envelopes'

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
  add: [envelope: EnvelopeSummary]
  pay: [envelope: EnvelopeSummary]
  transfer: [envelope: EnvelopeSummary]
  withdraw: [envelope: EnvelopeSummary]
}>()

const balance = computed(() => props.envelope?.balance?.amount ?? 0)
const currency = computed(() => props.envelope?.balance?.currency ?? 'CAD')
const isBill = computed(() => props.envelope?.purpose === 'Bill')
const isDebt = computed(() => props.envelope?.purpose === 'DebtPayment')

// Same rules as the backend: only bills and debts can be paid, debts can't be withdrawn from
const canPay = computed(() => (isBill.value || isDebt.value) && balance.value > 0)
const canTransfer = computed(() => balance.value > 0)
const canWithdraw = computed(() => balance.value > 0 && !isDebt.value)

const handleClose = () => {
  emit('close')
}

const choose = (type: 'add' | 'pay' | 'transfer' | 'withdraw') => {
  if (!props.envelope) return
  emit(type, props.envelope)
}
</script>

<template>
  <div v-if="isOpen && envelope" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ envelope.name }}</h2>
        <button class="modal-close" :aria-label="t('envelopes.actionModal.close')" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="balance">
          {{ t('envelopes.actionModal.balance', { amount: formatMoney(balance, currency) }) }}
        </p>

        <div class="action-choices">
          <button class="action-choice" @click="choose('add')">
            <i class="mdi mdi-cash-plus"></i>
            <span>{{ t('envelopes.actionModal.add') }}</span>
          </button>
          <button v-if="canPay" class="action-choice" @click="choose('pay')">
            <i class="mdi mdi-check-circle-outline"></i>
            <span>{{ isDebt ? t('envelopes.actionModal.payDebt') : t('envelopes.actionModal.paid') }}</span>
          </button>
          <button v-if="canTransfer" class="action-choice" @click="choose('transfer')">
            <i class="mdi mdi-swap-horizontal"></i>
            <span>{{ t('envelopes.actionModal.transfer') }}</span>
          </button>
          <button v-if="canWithdraw" class="action-choice" @click="choose('withdraw')">
            <i class="mdi mdi-cash-minus"></i>
            <span>{{ t('envelopes.actionModal.withdraw') }}</span>
          </button>
        </div>
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
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 6px;
}

.modal-close:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.balance {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.balance strong {
  color: var(--text-primary);
}

.action-choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.action-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-choice i {
  font-size: 1.75rem;
  color: var(--primary);
}

.action-choice:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

</style>

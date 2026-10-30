<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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
  bill?: Envelope | null
}>(), {
  isOpen: false,
  bill: null
})

const emit = defineEmits<{
  close: []
  pay: [amount: number]
}>()

const amount = ref<number | null>(null)
const error = ref('')

const balance = computed(() => props.bill?.balance?.amount ?? 0)
const currency = computed(() => props.bill?.balance?.currency ?? 'CAD')

const remainingAfterPayment = computed(() => {
  if (amount.value === null || Number.isNaN(amount.value)) return balance.value
  return balance.value - amount.value
})

// Start with the full balance so a plain "Payé" still pays the whole bill
watch(() => props.isOpen, (open) => {
  if (open) {
    amount.value = balance.value
    error.value = ''
  }
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: currency.value }).format(value)

const handleSubmit = () => {
  error.value = ''
  if (amount.value === null || amount.value <= 0) {
    error.value = 'Le montant doit être supérieur à 0.'
    return
  }
  if (amount.value > balance.value) {
    error.value = `Le montant dépasse le solde de la facture (${formatCurrency(balance.value)}).`
    return
  }
  emit('pay', amount.value)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Payer la facture</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="bill-info">
          <strong>{{ bill?.name }}</strong> — solde de l'enveloppe : <strong>{{ formatCurrency(balance) }}</strong>
        </p>

        <div class="form-group">
          <label>Montant payé</label>
          <input v-model.number="amount" type="number" step="0.01" min="0" :max="balance" />
        </div>

        <p class="remaining">
          Reste dans l'enveloppe après paiement : <strong>{{ formatCurrency(remainingAfterPayment) }}</strong>
        </p>

        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">Annuler</button>
        <button class="btn-primary" @click="handleSubmit">Payer</button>
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

.bill-info,
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
  background: var(--success);
  color: white;
  border: none;
}

.btn-secondary {
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}
</style>

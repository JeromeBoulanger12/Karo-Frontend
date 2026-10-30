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
  source?: Envelope | null
  envelopes?: Envelope[]
}>(), {
  isOpen: false,
  source: null,
  envelopes: () => []
})

const emit = defineEmits<{
  close: []
  transfer: [payload: { toEnvelopeId: string; amount: number; memo?: string }]
}>()

const toEnvelopeId = ref('')
const amount = ref<number | null>(null)
const memo = ref('')
const error = ref('')

const sourceBalance = computed(() => props.source?.balance?.amount ?? 0)
const currency = computed(() => props.source?.balance?.currency ?? 'CAD')

// Only envelopes in the same currency can receive the money, and never the source itself
const destinations = computed(() =>
  props.envelopes.filter(e =>
    e.id !== props.source?.id && (e.balance?.currency ?? 'CAD') === currency.value
  )
)

watch(() => props.isOpen, (open) => {
  if (open) {
    toEnvelopeId.value = ''
    amount.value = null
    memo.value = ''
    error.value = ''
  }
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: currency.value }).format(value)

const handleSubmit = () => {
  error.value = ''
  if (!toEnvelopeId.value) {
    error.value = 'Choisissez une enveloppe de destination.'
    return
  }
  if (amount.value === null || amount.value <= 0) {
    error.value = 'Le montant doit être supérieur à 0.'
    return
  }
  if (amount.value > sourceBalance.value) {
    error.value = `Solde insuffisant : ${formatCurrency(sourceBalance.value)} disponibles.`
    return
  }
  emit('transfer', {
    toEnvelopeId: toEnvelopeId.value,
    amount: amount.value,
    memo: memo.value.trim() || undefined
  })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Transférer</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="source-info">
          De <strong>{{ source?.name }}</strong> — disponible : <strong>{{ formatCurrency(sourceBalance) }}</strong>
        </p>

        <div v-if="destinations.length === 0" class="empty-hint">
          Aucune autre enveloppe en {{ currency }} pour recevoir ce transfert.
        </div>

        <template v-else>
          <div class="form-group">
            <label>Vers l'enveloppe</label>
            <select v-model="toEnvelopeId">
              <option value="" disabled>Choisir…</option>
              <option v-for="env in destinations" :key="env.id" :value="env.id">
                {{ env.name }} ({{ formatCurrency(env.balance?.amount ?? 0) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Montant</label>
            <input v-model.number="amount" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>Note (optionnel)</label>
            <input v-model="memo" type="text" maxlength="200" />
          </div>

          <p v-if="error" class="error-text">{{ error }}</p>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">Annuler</button>
        <button class="btn-primary" :disabled="destinations.length === 0" @click="handleSubmit">Transférer</button>
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

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.source-info,
.empty-hint {
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}
</style>

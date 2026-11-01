<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Paycheck {
  id: string
  amount: { amount: number; currency: string }
  occurredAt: string
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  paycheck?: Paycheck | null
  submitError?: string
}>(), {
  isOpen: false,
  paycheck: null,
  submitError: ''
})

const emit = defineEmits<{
  close: []
  save: [actualAmount: number]
}>()

const actual = ref<number | null>(null)
const error = ref('')

const expected = computed(() => props.paycheck?.amount.amount ?? 0)
const currency = computed(() => props.paycheck?.amount.currency ?? 'CAD')
const difference = computed(() => (actual.value ?? expected.value) - expected.value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: currency.value }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })

// Start from the expected amount each time the modal opens; keep the typed value after an error
watch(() => props.isOpen, (open) => {
  if (open && !props.submitError) {
    actual.value = expected.value
    error.value = ''
  }
})

const handleSubmit = () => {
  error.value = ''
  if (actual.value === null || actual.value < 0) {
    error.value = 'Le montant reçu doit être 0 ou plus.'
    return
  }
  emit('save', actual.value)
}
</script>

<template>
  <div v-if="isOpen && paycheck" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Ajuster la dernière paie</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="info">
          Paie fixe prévue : <strong>{{ formatCurrency(expected) }}</strong>
          le {{ formatDate(paycheck.occurredAt) }}
        </p>

        <div class="form-group">
          <label>Montant réellement reçu</label>
          <input v-model.number="actual" type="number" step="0.01" min="0" />
        </div>

        <p v-if="difference !== 0" class="difference" :class="difference > 0 ? 'is-up' : 'is-down'">
          {{ difference > 0 ? 'Ajouté' : 'Retiré' }} aux enveloppes : {{ formatCurrency(Math.abs(difference)) }}
        </p>
        <p class="hint">
          La différence suit les mêmes règles de répartition que la paie : elle est ajoutée ou retirée des enveloppes concernées.
        </p>

        <p v-if="error || submitError" class="error-text">{{ error || submitError }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">Annuler</button>
        <button class="btn-primary" @click="handleSubmit">Enregistrer</button>
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
  max-width: 480px;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
}

.modal-header {
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
}

.modal-footer {
  justify-content: flex-end;
  gap: var(--space-sm);
  border-top: 1px solid var(--border);
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

.info,
.hint {
  margin: 0;
  color: var(--text-muted);
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

.difference {
  margin: 0;
  font-weight: 700;
}

.difference.is-up {
  color: var(--success);
}

.difference.is-down {
  color: var(--danger);
}

.hint {
  font-size: 0.75rem;
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

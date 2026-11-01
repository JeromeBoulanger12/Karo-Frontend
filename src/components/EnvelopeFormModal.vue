<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface FormData {
  name: string
  homeAccountId: string
  purpose: string
  targetAmount?: number
  targetDate?: string
  scheduleType?: string
  dayOfMonth?: number
  paymentDates?: string[]
  isAutomaticWithdrawal?: boolean
  withdrawalFrequency?: string
  linkedEnvelopeId?: string
  sharedPercentage?: number
  isShared?: boolean
  selectedPlanId?: string | null
  planAllocationType?: 'BillProrated' | 'Automatic' | 'FixedAmount' | 'Percentage'
  planFixedAmount?: number | null
  planPercentage?: number | null
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  envelope?: any | null
  accountId: string
  availableAccounts?: any[]
  availableEnvelopes?: any[]
  plans?: any[]
}>(), {
  isOpen: false,
  submitError: '',
  envelope: null,
  availableAccounts: () => [],
  availableEnvelopes: () => [],
  plans: () => []
})

const emit = defineEmits<{
  close: []
  save: [data: FormData]
  delete: [envelopeId: string]
}>()

const { t } = useI18n()

const formData = ref<FormData>({
  name: props.envelope?.name || '',
  homeAccountId: props.accountId,
  purpose: props.envelope?.purpose || 'SavingsGoal',
  targetAmount: props.envelope?.targetAmount?.amount,
  targetDate: props.envelope?.targetDate,
  scheduleType: props.envelope?.scheduleType,
  dayOfMonth: props.envelope?.dayOfMonth,
  paymentDates: props.envelope?.paymentDates || [],
  isAutomaticWithdrawal: props.envelope?.isAutomaticWithdrawal || false,
  withdrawalFrequency: props.envelope?.withdrawalFrequency,
  linkedEnvelopeId: props.envelope?.linkedEnvelopeId,
  sharedPercentage: props.envelope?.sharedPercentage,
  isShared: props.envelope?.isShared || false,
  selectedPlanId: null,
  planAllocationType: 'FixedAmount',
  planFixedAmount: null,
  planPercentage: null
})

const validationError = ref<string>('')
const showPaymentDateInput = ref(false)
const newPaymentDate = ref<string>('')

// Reload the form each time the modal opens: handleClose() resets formData, and reopening
// the same envelope object does not change the prop, so a watch on props.envelope would miss it
// The list endpoint only returns the bill schedule as JSON (billPaymentScheduleJson);
// the single-envelope fields (scheduleType, dayOfMonth, paymentDates) are only set on detail
const parseBillSchedule = (envelope: any) => {
  if (envelope?.scheduleType) return envelope
  if (!envelope?.billPaymentScheduleJson) return {}
  try {
    return JSON.parse(envelope.billPaymentScheduleJson)
  } catch {
    return {}
  }
}

const loadFormFromEnvelope = () => {
  const envelope = props.envelope
  const schedule = parseBillSchedule(envelope)
  formData.value = {
    name: envelope?.name || '',
    homeAccountId: envelope?.homeAccountId || props.accountId,
    purpose: envelope?.purpose || 'SavingsGoal',
    targetAmount: envelope?.targetAmount?.amount,
    targetDate: envelope?.targetDate,
    scheduleType: schedule.scheduleType,
    dayOfMonth: schedule.dayOfMonth,
    // Payment dates come back as ISO timestamps; the date inputs expect YYYY-MM-DD
    paymentDates: (schedule.paymentDates || []).map((d: string) => d.slice(0, 10)),
    isAutomaticWithdrawal: envelope?.isAutomaticWithdrawal || false,
    withdrawalFrequency: envelope?.withdrawalFrequency,
    linkedEnvelopeId: envelope?.linkedEnvelopeId,
    sharedPercentage: envelope?.sharedPercentage,
    isShared: envelope?.isShared || false,
    selectedPlanId: null,
    planAllocationType: 'FixedAmount',
    planFixedAmount: null,
    planPercentage: null
  }
}

watch(() => props.isOpen, (open) => {
  if (open && !props.submitError) loadFormFromEnvelope()
})

// Suggest the allocation type that fits the envelope once a plan is picked; the user can change it
watch(() => formData.value.selectedPlanId, (planId) => {
  if (!planId) return
  if (isBillPurpose.value) formData.value.planAllocationType = 'BillProrated'
  else if (formData.value.isAutomaticWithdrawal) formData.value.planAllocationType = 'Automatic'
  else formData.value.planAllocationType = 'FixedAmount'
})

const isEditing = computed(() => !!props.envelope?.id)
const isBillPurpose = computed(() => formData.value.purpose === 'Bill')
const isAnnualSchedule = computed(() => formData.value.scheduleType === 'AnnualScheduled')

const handleSubmit = () => {
  validationError.value = ''

  if (!formData.value.name || !formData.value.name.trim()) {
    validationError.value = 'Le nom est requis'
    return
  }

  if (isBillPurpose.value && !formData.value.scheduleType) {
    validationError.value = 'Le type de calendrier est requis pour une facture'
    return
  }

  if (isBillPurpose.value && isAnnualSchedule.value && formData.value.paymentDates?.length === 0) {
    validationError.value = 'Au moins une date de paiement est requise pour un calendrier annuel'
    return
  }

  if (formData.value.isAutomaticWithdrawal && !formData.value.withdrawalFrequency) {
    validationError.value = 'La fréquence de prélèvement est requise'
    return
  }

  if (formData.value.selectedPlanId) {
    const type = formData.value.planAllocationType
    if (type === 'BillProrated' && !isBillPurpose.value) {
      validationError.value = t('envelopes.form.errorBillOnly')
      return
    }
    if (type === 'Automatic' && !formData.value.isAutomaticWithdrawal) {
      validationError.value = t('envelopes.form.errorAutomaticNeedsOption')
      return
    }
    if (type === 'FixedAmount' && !(formData.value.planFixedAmount && formData.value.planFixedAmount > 0)) {
      validationError.value = t('envelopes.form.errorFixedPositive')
      return
    }
    if (type === 'Percentage' && !(formData.value.planPercentage && formData.value.planPercentage > 0 && formData.value.planPercentage <= 100)) {
      validationError.value = t('envelopes.form.errorPercentageRange')
      return
    }
  }

  emit('save', formData.value)
}

// Deleting also removes the envelope from any distribution plan rules (done by the backend)
const handleDelete = () => {
  if (!props.envelope?.id) return
  const confirmed = window.confirm(
    `Supprimer l'enveloppe « ${props.envelope.name} » ? Elle sera aussi retirée des règles de distribution.`
  )
  if (confirmed) emit('delete', props.envelope.id)
}

const handleClose = () => {
  emit('close')
  validationError.value = ''
  showPaymentDateInput.value = false
  newPaymentDate.value = ''
  formData.value = {
    name: '',
    homeAccountId: props.accountId,
    purpose: 'SavingsGoal',
    isAutomaticWithdrawal: false,
    isShared: false
  }
}

const addPaymentDate = () => {
  if (newPaymentDate.value) {
    if (!formData.value.paymentDates) {
      formData.value.paymentDates = []
    }
    formData.value.paymentDates.push(newPaymentDate.value)
    newPaymentDate.value = ''
  }
}

const removePaymentDate = (index: number) => {
  formData.value.paymentDates?.splice(index, 1)
}

const purposes = [
  { value: 'GeneralReserve', label: 'Réserve générale' },
  { value: 'SavingsGoal', label: 'Objectif d\'épargne' },
  { value: 'Bill', label: 'Facture' },
  { value: 'DebtPayment', label: 'Remboursement de dette' },
  { value: 'WeeklyExpenses', label: 'Dépenses hebdomadaires' },
  { value: 'Mortgage', label: 'Hypothèque/Loyer' }
]

const billScheduleTypes = [
  { value: 'Monthly', label: 'Mensuel' },
  { value: 'AnnualScheduled', label: 'Annuel (dates spécifiques)' }
]

const withdrawalFrequencies = [
  { value: 'Weekly', label: 'Hebdomadaire' },
  { value: 'BiWeekly', label: 'Tous les 2 semaines' },
  { value: 'Monthly', label: 'Mensuel' },
  { value: 'Quarterly', label: 'Trimestriel' },
  { value: 'SemiAnnual', label: 'Semestriel' },
  { value: 'Annual', label: 'Annuel' }
]
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Éditer' : 'Ajouter' }} Enveloppe</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>

        <!-- Basic Info -->
        <div class="form-group">
          <label>Nom de l'enveloppe *</label>
          <input v-model="formData.name" type="text" placeholder="Ex: Loyer, Épicerie..." />
        </div>

        <div class="form-group">
          <label>Objectif *</label>
          <select v-model="formData.purpose">
            <option v-for="p in purposes" :key="p.value" :value="p.value">
              {{ p.label }}
            </option>
          </select>
        </div>

        <!-- For Bills: Payment Schedule -->
        <div v-if="isBillPurpose" class="section-divider">
          <h3>Montant et calendrier de paiement</h3>

          <div class="form-group">
            <label>Montant de la facture</label>
            <input v-model.number="formData.targetAmount" type="number" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>Calendrier de paiement *</label>
            <select v-model="formData.scheduleType">
              <option value="">-- Sélectionner --</option>
              <option v-for="type in billScheduleTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div v-if="formData.scheduleType === 'Monthly'" class="form-group">
            <label>Jour du mois où la facture est due (1-31)</label>
            <input v-model.number="formData.dayOfMonth" type="number" min="1" max="31" placeholder="15" />
          </div>

          <div v-if="isAnnualSchedule" class="form-group">
            <label>Dates de paiement dans l'année</label>
            <div class="date-list">
              <div v-for="(date, idx) in formData.paymentDates" :key="idx" class="date-item">
                <span>{{ date }}</span>
                <button type="button" class="btn-remove" @click="removePaymentDate(idx)">×</button>
              </div>
            </div>
            <div class="date-input-group">
              <input v-model="newPaymentDate" type="date" placeholder="Sélectionner une date" />
              <button type="button" class="btn-add" @click="addPaymentDate">Ajouter</button>
            </div>
          </div>
        </div>

        <!-- For Non-Bills: Target Amount & Date -->
        <div v-if="!isBillPurpose" class="section-divider">
          <h3>Objectif</h3>

          <div class="form-group">
            <label>Montant cible</label>
            <input v-model.number="formData.targetAmount" type="number" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>Date cible (quand atteindre cet objectif)</label>
            <input v-model="formData.targetDate" type="date" />
          </div>
        </div>

        <!-- Automatic Withdrawal Section -->
        <div class="section-divider">
          <h3>Prélèvement automatique</h3>

          <div class="form-group">
            <label>
              <input v-model="formData.isAutomaticWithdrawal" type="checkbox" />
              Activer le prélèvement automatique
            </label>
          </div>

          <div v-if="formData.isAutomaticWithdrawal" class="form-group">
            <label>Fréquence de prélèvement *</label>
            <select v-model="formData.withdrawalFrequency">
              <option value="">-- Sélectionner --</option>
              <option v-for="freq in withdrawalFrequencies" :key="freq.value" :value="freq.value">
                {{ freq.label }}
              </option>
            </select>
          </div>

          <div v-if="formData.isAutomaticWithdrawal" class="form-group">
            <label>Enveloppe liée</label>
            <select v-model="formData.linkedEnvelopeId">
              <option value="">-- Aucune --</option>
              <option v-for="env in availableEnvelopes" :key="env.id" :value="env.id">
                {{ env.name }}
              </option>
            </select>
          </div>

          <!-- Adds a rule on the chosen distribution plan once the envelope is saved -->
          <div class="form-group">
            <label>Ajouter à un plan de distribution</label>
            <select v-model="formData.selectedPlanId">
              <option :value="null">-- Aucun --</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                {{ plan.name }}
              </option>
            </select>
          </div>

          <template v-if="formData.selectedPlanId">
            <div class="form-group">
              <label>{{ t('envelopes.form.allocationType') }}</label>
              <select v-model="formData.planAllocationType">
                <option value="BillProrated">{{ t('envelopes.form.billProrated') }}</option>
                <option value="Automatic">{{ t('envelopes.form.automatic') }}</option>
                <option value="FixedAmount">{{ t('envelopes.form.fixedAmount') }}</option>
                <option value="Percentage">{{ t('envelopes.form.percentage') }}</option>
              </select>
            </div>

            <div v-if="formData.planAllocationType === 'FixedAmount'" class="form-group">
              <label>{{ t('envelopes.form.fixedAmountLabel') }}</label>
              <input v-model.number="formData.planFixedAmount" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>

            <div v-if="formData.planAllocationType === 'Percentage'" class="form-group">
              <label>{{ t('envelopes.form.percentageLabel') }}</label>
              <input v-model.number="formData.planPercentage" type="number" step="0.01" min="0" max="100" placeholder="0" />
            </div>
          </template>
        </div>

        <!-- Sharing -->
        <div class="section-divider">
          <div class="form-group">
            <label>
              <input v-model="formData.isShared" type="checkbox" />
              Partager avec les membres du ménage
            </label>
          </div>

          <div v-if="formData.isShared" class="form-group">
            <label>Pourcentage partagé (0-100)</label>
            <input v-model.number="formData.sharedPercentage" type="number" min="0" max="100" placeholder="0" />
          </div>
        </div>
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div class="modal-footer">
        <button v-if="isEditing" class="btn-danger" @click="handleDelete">
          <i class="mdi mdi-trash-can-outline"></i>
          Supprimer
        </button>
        <button class="btn-secondary" @click="handleClose">{{ t('common.cancel') || 'Annuler' }}</button>
        <button class="btn-primary" @click="handleSubmit">{{ t('common.save') || 'Enregistrer' }}</button>
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
  max-width: 600px;
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

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
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
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select {
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
  font-family: inherit;
  background: var(--surface);
  color: var(--text-primary);
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group input[type="date"]:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input[type="checkbox"] {
  cursor: pointer;
}

.section-divider {
  padding-top: var(--space-md);
  border-top: 1px solid var(--border);
}

.section-divider h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  font-weight: var(--font-weight-semibold);
}

.date-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.date-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-size-lg);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-remove:hover {
  color: #c33;
  background: #fee;
  border-radius: var(--radius-sm);
}

.date-input-group {
  display: flex;
  gap: var(--space-sm);
}

.date-input-group input {
  flex: 1;
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  background: var(--surface);
  color: var(--text-primary);
}

.btn-add {
  padding: var(--space-md) var(--space-lg);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.btn-add:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.btn-danger {
  flex: 0 0 auto;
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs, 4px);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--danger, #dc2626);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  background: rgba(220, 38, 38, 0.08);
  border-color: var(--danger, #dc2626);
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

  .date-input-group {
    flex-direction: column;
  }
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from './HelpTip.vue'
import { isBillPurpose, type EnvelopeSummary } from '../utils/envelopes'
import type { DistributionRule } from '../utils/distributionRules'

type AllocationType = DistributionRule['allocationType']

const { t } = useI18n()

const props = withDefaults(defineProps<{
  isOpen: boolean
  submitError?: string
  // The job (distribution plan) the rule belongs to
  job?: any | null
  rule?: DistributionRule | null
  envelope?: EnvelopeSummary | null
  // Rules feeding the same envelope from other jobs: a bill share, goal share or automatic withdrawal can't sit beside them
  otherSourcesCount?: number
}>(), {
  isOpen: false,
  submitError: '',
  job: null,
  rule: null,
  envelope: null,
  otherSourcesCount: 0
})

const emit = defineEmits<{
  close: []
  save: [payload: { allocationType: AllocationType; fixedAmount: number | null; percentageValue: number | null }]
  remove: []
}>()

const allocationType = ref<AllocationType>('FixedAmount')
const fixedAmount = ref<number | null>(null)
const percentage = ref<number | null>(null)
const error = ref('')
const confirmingRemove = ref(false)

watch(() => props.isOpen, (open) => {
  if (!open || props.submitError || !props.rule) return
  allocationType.value = props.rule.allocationType
  fixedAmount.value = props.rule.fixedAmount?.amount ?? null
  percentage.value = props.rule.percentageValue ?? null
  error.value = ''
  confirmingRemove.value = false
})

const purpose = computed(() => props.envelope?.purpose)
const isDebt = computed(() => purpose.value === 'DebtPayment')

// Same choices as the envelope form: proration for bills and goals, automatic only with an automatic withdrawal
const allocationTypes = computed(() => [
  ...(isBillPurpose(purpose.value) ? [{ value: 'BillProrated', label: t('envelopes.form.billProrated') }] : []),
  ...(purpose.value === 'SavingsGoal' ? [{ value: 'GoalProrated', label: t('envelopes.form.goalProrated') }] : []),
  ...((props.envelope?.isAutomaticWithdrawal && !isDebt.value) || props.rule?.allocationType === 'Automatic'
    ? [{ value: 'Automatic', label: t('envelopes.form.automatic') }]
    : []),
  { value: 'FixedAmount', label: t('envelopes.form.fixedAmount') },
  { value: 'Percentage', label: t('envelopes.form.percentage') }
])

const isExclusive = (type: AllocationType) => type === 'BillProrated' || type === 'GoalProrated' || type === 'Automatic'

const handleSubmit = () => {
  error.value = ''
  const type = allocationType.value
  if (isExclusive(type) && props.otherSourcesCount > 0) {
    error.value = t('envelopeForm.errors.exclusivePlan')
    return
  }
  if (type === 'GoalProrated') {
    if (!(props.envelope?.targetAmount?.amount && props.envelope.targetAmount.amount > 0) || !props.envelope?.targetDate) {
      error.value = t('envelopes.form.errorGoalNeedsTarget')
      return
    }
    if (props.job?.recurrencePattern?.frequency === 'Irregular') {
      error.value = t('envelopes.form.errorGoalIrregular')
      return
    }
  }
  if (type === 'Automatic' && !props.envelope?.isAutomaticWithdrawal) {
    error.value = t('envelopes.form.errorAutomaticNeedsOption')
    return
  }
  if (type === 'FixedAmount' && !(fixedAmount.value && fixedAmount.value > 0)) {
    error.value = t('envelopes.form.errorFixedPositive')
    return
  }
  if (type === 'Percentage' && !(percentage.value && percentage.value > 0 && percentage.value <= 100)) {
    error.value = t('envelopes.form.errorPercentageRange')
    return
  }
  emit('save', {
    allocationType: type,
    fixedAmount: type === 'FixedAmount' ? fixedAmount.value : null,
    percentageValue: type === 'Percentage' ? percentage.value : null
  })
}
</script>

<template>
  <div v-if="isOpen && rule" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ rule.envelopeName }}</h2>
        <button class="modal-close" :aria-label="t('jobCard.ruleModal.close')" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="rule-info">{{ t('jobCard.ruleModal.subtitle', { job: job?.name ?? '' }) }}</p>

        <div class="form-group">
          <label>{{ t('envelopes.form.allocationType') }} <HelpTip topic="allocationType" faq="allocation" /></label>
          <select v-model="allocationType">
            <option v-for="type in allocationTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
          <small v-if="allocationType === 'GoalProrated'" class="form-hint">{{ t('envelopes.form.goalProratedHint') }}</small>
        </div>

        <div v-if="allocationType === 'FixedAmount'" class="form-group">
          <label>{{ t('envelopes.form.fixedAmountLabel') }}</label>
          <input v-model.number="fixedAmount" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>

        <div v-if="allocationType === 'Percentage'" class="form-group">
          <label>{{ t('envelopes.form.percentageLabel') }}</label>
          <input v-model.number="percentage" type="number" step="0.01" min="0" max="100" placeholder="0" />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-if="submitError" class="error-text">{{ submitError }}</p>
      </div>

      <div class="modal-footer">
        <template v-if="confirmingRemove">
          <span class="confirm-text">{{ t('jobCard.ruleModal.confirmRemove') }}</span>
          <button class="btn-secondary" @click="confirmingRemove = false">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="emit('remove')">{{ t('jobCard.ruleModal.remove') }}</button>
        </template>
        <template v-else>
          <button class="btn-link-danger" @click="confirmingRemove = true">
            <i class="mdi mdi-delete-outline"></i>
            {{ t('jobCard.ruleModal.remove') }}
          </button>
          <span class="spacer"></span>
          <button class="btn-secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="handleSubmit">{{ t('jobCard.ruleModal.save') }}</button>
        </template>
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
  max-width: 460px;
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
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.spacer {
  flex: 1;
}

.confirm-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.rule-info {
  margin: 0;
  color: var(--text-muted);
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

.form-hint {
  color: var(--text-muted);
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
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

.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
}

.btn-link-danger {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 0;
}
</style>

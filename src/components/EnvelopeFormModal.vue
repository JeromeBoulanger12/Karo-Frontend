<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { isCreditAccount } from '../utils/accounts'
import { isBillPurpose } from '../utils/envelopes'
import HelpTip from './HelpTip.vue'

// Colour and arrangement of envelopes are paid features: the palette is locked on the free plan
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowPlanning: false, allowMembers: false }))
const canCustomize = computed(() => !!subscriptionFeatures.value.allowPlanning)
// Sharing with household members needs the Family plan (members); without it the option is not offered
const canShareWithMembers = computed(() => !!subscriptionFeatures.value.allowMembers)
const colorChoices = ['#1F7A4D', '#2563EB', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0891B2', '#64748B']

type PlanAllocationType = 'BillProrated' | 'GoalProrated' | 'Automatic' | 'FixedAmount' | 'Percentage'

// A rule this envelope gets from a plan: each paycheck of that plan adds its share
interface PlanRuleLine {
  planId: string | null
  allocationType: PlanAllocationType
  fixedAmount: number | null
  percentage: number | null
}

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
  // Debt envelopes: the credit card they pay down
  targetAccountId?: string
  sharedPercentage?: number
  isShared?: boolean
  // One line per distribution plan that feeds this envelope
  planRules: PlanRuleLine[]
  // Bills: paid from the envelope on the due date when its balance covers the target
  billAutoPay?: boolean
  color?: string | null
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
  targetAccountId: props.envelope?.targetAccountId,
  sharedPercentage: props.envelope?.sharedPercentage,
  isShared: props.envelope?.isShared || false,
  planRules: [],
  billAutoPay: props.envelope?.billAutoPay || false,
  color: props.envelope?.color ?? null
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

// The rules this envelope already has, one per plan that feeds it
const ruleLinesFromPlans = (): PlanRuleLine[] => {
  const envelopeId = props.envelope?.id
  if (!envelopeId) return []
  return props.plans.flatMap((plan: any) =>
    (plan.rules ?? [])
      .filter((r: any) => r.envelopeId === envelopeId)
      .map((r: any) => ({
        planId: plan.id as string,
        allocationType: r.allocationType as PlanAllocationType,
        fixedAmount: r.fixedAmount?.amount ?? null,
        percentage: r.percentageValue ?? null
      }))
  )
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
    targetAccountId: envelope?.targetAccountId,
    sharedPercentage: envelope?.sharedPercentage,
    isShared: envelope?.isShared || false,
    billAutoPay: envelope?.billAutoPay || false,
    planRules: ruleLinesFromPlans()
  }
}

watch(() => props.isOpen, (open) => {
  if (open && !props.submitError) loadFormFromEnvelope()
})

// A new line starts as a fixed amount: it is the only allocation that can sit beside other plans' rules
const addPlanRule = () => {
  formData.value.planRules.push({ planId: null, allocationType: 'FixedAmount', fixedAmount: null, percentage: null })
}

const removePlanRule = (index: number) => {
  formData.value.planRules.splice(index, 1)
}

const isEditing = computed(() => !!props.envelope?.id)
const hasBillSchedule = computed(() => isBillPurpose(formData.value.purpose))
const isDebtPurpose = computed(() => formData.value.purpose === 'DebtPayment')
const isSavingsGoal = computed(() => formData.value.purpose === 'SavingsGoal')
// Irregular pay has no paydays to count before the goal's date
const isIrregularPlan = (planId: string | null) =>
  props.plans.find((plan: any) => plan.id === planId)?.recurrencePattern?.frequency === 'Irregular'
// Only credit cards other than the account the money comes from can be paid down
const debtAccounts = computed(() =>
  props.availableAccounts.filter(a => isCreditAccount(a.type) && a.id !== formData.value.homeAccountId)
)
const isAnnualSchedule = computed(() => formData.value.scheduleType === 'AnnualScheduled')
const isBiWeeklySchedule = computed(() => formData.value.scheduleType === 'BiWeekly')
// A bi-weekly bill has one first payment date; the others follow every 14 days
const firstPaymentDate = computed({
  get: () => formData.value.paymentDates?.[0] ?? '',
  set: (value: string) => { formData.value.paymentDates = value ? [value] : [] }
})

// Allocation types that fit this envelope: proration is for bills and savings goals, automatic only with an
// automatic withdrawal (never for a debt, which is paid by hand)
const allocationTypes = computed(() => {
  const hasAutomaticLine = formData.value.planRules.some(line => line.allocationType === 'Automatic')
  return [
    ...(hasBillSchedule.value ? [{ value: 'BillProrated', label: t('envelopes.form.billProrated') }] : []),
    ...(isSavingsGoal.value ? [{ value: 'GoalProrated', label: t('envelopes.form.goalProrated') }] : []),
    ...((formData.value.isAutomaticWithdrawal && !isDebtPurpose.value) || hasAutomaticLine
      ? [{ value: 'Automatic', label: t('envelopes.form.automatic') }]
      : []),
    { value: 'FixedAmount', label: t('envelopes.form.fixedAmount') },
    { value: 'Percentage', label: t('envelopes.form.percentage') }
  ]
})

// A debt envelope is paid with the pay button, so the options that move money on their own do not apply
watch(isDebtPurpose, (isDebt) => {
  if (!isDebt) return
  formData.value.isAutomaticWithdrawal = false
  formData.value.linkedEnvelopeId = undefined
  formData.value.planRules.forEach((line) => {
    if (line.allocationType === 'BillProrated' || line.allocationType === 'GoalProrated' || line.allocationType === 'Automatic') {
      line.allocationType = 'FixedAmount'
    }
  })
})

const handleSubmit = () => {
  validationError.value = ''

  if (!formData.value.name || !formData.value.name.trim()) {
    validationError.value = t('envelopeForm.errors.nameRequired')
    return
  }

  if (hasBillSchedule.value && !formData.value.scheduleType) {
    validationError.value = t('envelopeForm.errors.billScheduleRequired')
    return
  }

  if (hasBillSchedule.value && isBiWeeklySchedule.value && !firstPaymentDate.value) {
    validationError.value = t('envelopeForm.errors.biWeeklyDateRequired')
    return
  }

  if (hasBillSchedule.value && isAnnualSchedule.value && formData.value.paymentDates?.length === 0) {
    validationError.value = t('envelopeForm.errors.annualDatesRequired')
    return
  }

  if (isDebtPurpose.value && !formData.value.targetAccountId) {
    validationError.value = t('envelopeForm.errors.debtCardRequired')
    return
  }

  if (formData.value.isAutomaticWithdrawal && !formData.value.withdrawalFrequency) {
    validationError.value = t('envelopeForm.errors.withdrawalFrequencyRequired')
    return
  }

  const lines = formData.value.planRules
  if (lines.some(line => !line.planId)) {
    validationError.value = t('envelopeForm.errors.planRequired')
    return
  }
  if (new Set(lines.map(line => line.planId)).size !== lines.length) {
    validationError.value = t('envelopeForm.errors.duplicatePlan')
    return
  }
  // A bill share, goal share or automatic withdrawal is computed from the whole target: it cannot share the envelope
  const isExclusive = (line: PlanRuleLine) =>
    line.allocationType === 'BillProrated' || line.allocationType === 'GoalProrated' || line.allocationType === 'Automatic'
  if (lines.some(isExclusive) && lines.length > 1) {
    validationError.value = t('envelopeForm.errors.exclusivePlan')
    return
  }
  for (const line of lines) {
    if (line.allocationType === 'BillProrated' && !hasBillSchedule.value) {
      validationError.value = t('envelopes.form.errorBillOnly')
      return
    }
    if (line.allocationType === 'GoalProrated') {
      if (!isSavingsGoal.value) {
        validationError.value = t('envelopes.form.errorGoalOnly')
        return
      }
      if (!(formData.value.targetAmount && formData.value.targetAmount > 0) || !formData.value.targetDate) {
        validationError.value = t('envelopes.form.errorGoalNeedsTarget')
        return
      }
      if (isIrregularPlan(line.planId)) {
        validationError.value = t('envelopes.form.errorGoalIrregular')
        return
      }
    }
    if (line.allocationType === 'Automatic' && !formData.value.isAutomaticWithdrawal) {
      validationError.value = t('envelopes.form.errorAutomaticNeedsOption')
      return
    }
    if (line.allocationType === 'FixedAmount' && !(line.fixedAmount && line.fixedAmount > 0)) {
      validationError.value = t('envelopes.form.errorFixedPositive')
      return
    }
    if (line.allocationType === 'Percentage' && !(line.percentage && line.percentage > 0 && line.percentage <= 100)) {
      validationError.value = t('envelopes.form.errorPercentageRange')
      return
    }
  }

  // Only a debt envelope has a card; a card left over from an earlier debt purpose is not sent
  emit('save', { ...formData.value, targetAccountId: isDebtPurpose.value ? formData.value.targetAccountId : undefined })
}

// Deleting also removes the envelope from any distribution plan rules (done by the backend)
const handleDelete = () => {
  if (!props.envelope?.id) return
  const confirmed = window.confirm(
    t('envelopeForm.confirmDelete', { name: props.envelope.name })
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
    isShared: false,
    billAutoPay: false,
    planRules: []
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

// Labels are translation keys, resolved with t() in the template so they follow the locale
const purposes = [
  { value: 'GeneralReserve', label: 'envelopeForm.purposes.GeneralReserve' },
  { value: 'SavingsGoal', label: 'envelopeForm.purposes.SavingsGoal' },
  { value: 'Bill', label: 'envelopeForm.purposes.Bill' },
  { value: 'DebtPayment', label: 'envelopeForm.purposes.DebtPayment' },
  { value: 'WeeklyExpenses', label: 'envelopeForm.purposes.WeeklyExpenses' },
  { value: 'Mortgage', label: 'envelopeForm.purposes.Mortgage' }
]

const billScheduleTypes = [
  { value: 'Monthly', label: 'envelopeForm.scheduleTypes.Monthly' },
  { value: 'BiWeekly', label: 'envelopeForm.scheduleTypes.BiWeekly' },
  { value: 'AnnualScheduled', label: 'envelopeForm.scheduleTypes.AnnualScheduled' }
]

const withdrawalFrequencies = [
  { value: 'Weekly', label: 'envelopeForm.withdrawalFrequencies.Weekly' },
  { value: 'BiWeekly', label: 'envelopeForm.withdrawalFrequencies.BiWeekly' },
  { value: 'Monthly', label: 'envelopeForm.withdrawalFrequencies.Monthly' },
  { value: 'Quarterly', label: 'envelopeForm.withdrawalFrequencies.Quarterly' },
  { value: 'SemiAnnual', label: 'envelopeForm.withdrawalFrequencies.SemiAnnual' },
  { value: 'Annual', label: 'envelopeForm.withdrawalFrequencies.Annual' }
]
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? t('envelopeForm.title.edit') : t('envelopeForm.title.add') }}</h2>
        <button class="modal-close" @click="handleClose">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>

        <!-- 1. Identity: what the envelope is -->
        <div class="section-divider">
          <h3>{{ t('envelopeForm.groups.identity') }}</h3>

        <div class="form-group">
          <label>{{ t('envelopeForm.name.label') }}</label>
          <input v-model="formData.name" type="text" :placeholder="t('envelopeForm.name.placeholder')" />
        </div>

        <div class="form-group">
          <label>{{ t('envelopeForm.color.label') }}</label>
          <div v-if="canCustomize" class="color-choices">
            <button
              type="button"
              class="color-swatch color-none"
              :class="{ selected: !formData.color }"
              :title="t('envelopeForm.color.none')"
              @click="formData.color = null"
            >×</button>
            <button
              v-for="choice in colorChoices"
              :key="choice"
              type="button"
              class="color-swatch"
              :class="{ selected: formData.color === choice }"
              :style="{ background: choice }"
              :title="choice"
              @click="formData.color = choice"
            ></button>
          </div>
          <p v-else class="paid-hint">{{ t('envelopeForm.color.paidHint') }}</p>
        </div>

        <div class="form-group">
          <label>{{ t('envelopeForm.purposeLabel') }}</label>
          <select v-model="formData.purpose">
            <option v-for="p in purposes" :key="p.value" :value="p.value">
              {{ t(p.label) }}
            </option>
          </select>
        </div>

        </div>

        <!-- 2. Amount and schedule: how much, and when it is due -->
        <div class="section-divider">
          <h3>{{ t('envelopeForm.groups.schedule') }}</h3>

        <!-- Debt envelopes: paying one takes the money from this envelope and from the account it is funded from -->
        <div v-if="isDebtPurpose" class="form-group">
          <label>{{ t('envelopeForm.debtCard.label') }}</label>
          <select v-model="formData.targetAccountId">
            <option value="" disabled>{{ t('envelopeForm.debtCard.choose') }}</option>
            <option v-for="acc in debtAccounts" :key="acc.id" :value="acc.id">
              {{ acc.name }}
            </option>
          </select>
          <p v-if="debtAccounts.length === 0" class="hint">{{ t('envelopeForm.debtCard.none') }}</p>
        </div>

        <!-- For Bills: Payment Schedule -->
        <div v-if="hasBillSchedule">

          <div class="form-group">
            <label>{{ t('envelopeForm.bill.amount') }}</label>
            <input v-model.number="formData.targetAmount" type="number" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>{{ t('envelopeForm.bill.schedule') }}</label>
            <select v-model="formData.scheduleType">
              <option value="">{{ t('envelopeForm.selectPlaceholder') }}</option>
              <option v-for="type in billScheduleTypes" :key="type.value" :value="type.value">
                {{ t(type.label) }}
              </option>
            </select>
          </div>

          <div v-if="formData.scheduleType === 'Monthly'" class="form-group">
            <label>{{ t('envelopeForm.bill.dayOfMonth') }}</label>
            <input v-model.number="formData.dayOfMonth" type="number" min="1" max="31" placeholder="15" />
          </div>

          <div v-if="isBiWeeklySchedule" class="form-group">
            <label>{{ t('envelopeForm.bill.firstPaymentDate') }}</label>
            <input v-model="firstPaymentDate" type="date" />
          </div>

          <div v-if="isAnnualSchedule" class="form-group">
            <label>{{ t('envelopeForm.bill.paymentDates') }}</label>
            <div class="date-list">
              <div v-for="(date, idx) in formData.paymentDates" :key="idx" class="date-item">
                <span>{{ date }}</span>
                <button type="button" class="btn-remove" @click="removePaymentDate(idx)">×</button>
              </div>
            </div>
            <div class="date-input-group">
              <input v-model="newPaymentDate" type="date" :placeholder="t('envelopeForm.bill.paymentDatePlaceholder')" />
              <button type="button" class="btn-add" @click="addPaymentDate">{{ t('envelopeForm.bill.addPaymentDate') }}</button>
            </div>
          </div>

          <!-- Automatic payment of a bill on its due date: paid plans only, as the server checks too -->
          <div v-if="canCustomize" class="form-group">
            <label>
              <input v-model="formData.billAutoPay" type="checkbox" />
              {{ t('envelopeForm.autoPay.label') }}
              <HelpTip topic="autoPay" faq="autoPay" />
            </label>
            <small class="form-hint">{{ t('envelopeForm.autoPay.hint') }}</small>
          </div>
        </div>

        <!-- For Non-Bills: Target Amount & Date -->
        <div v-if="!hasBillSchedule">

          <div class="form-group">
            <label>{{ isDebtPurpose ? t('envelopeForm.debt.amount') : t('envelopeForm.goal.targetAmount') }}</label>
            <input v-model.number="formData.targetAmount" type="number" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>{{ isDebtPurpose ? t('envelopeForm.debt.dueDate') : t('envelopeForm.goal.targetDate') }}</label>
            <input v-model="formData.targetDate" type="date" />
          </div>
        </div>

        </div>

        <!-- 3. Funding: where the money comes from. A debt has no automatic withdrawal: it is paid by hand -->
        <div class="section-divider">
          <h3>{{ t('envelopeForm.groups.funding') }} <HelpTip topic="funding" faq="allocation" /></h3>

          <template v-if="!isDebtPurpose">
            <div class="form-group">
              <label>
                <input v-model="formData.isAutomaticWithdrawal" type="checkbox" />
                {{ t('envelopeForm.withdrawal.enable') }}
                <HelpTip topic="withdrawal" faq="withdrawal" />
              </label>
            </div>

            <div v-if="formData.isAutomaticWithdrawal" class="form-group">
              <label>{{ t('envelopeForm.withdrawal.frequency') }}</label>
              <select v-model="formData.withdrawalFrequency">
                <option value="">{{ t('envelopeForm.selectPlaceholder') }}</option>
                <option v-for="freq in withdrawalFrequencies" :key="freq.value" :value="freq.value">
                  {{ t(freq.label) }}
                </option>
              </select>
            </div>

            <div v-if="formData.isAutomaticWithdrawal" class="form-group">
              <label>{{ t('envelopeForm.withdrawal.linkedEnvelope') }}</label>
              <select v-model="formData.linkedEnvelopeId">
                <option value="">{{ t('envelopeForm.withdrawal.linkedNone') }}</option>
                <option v-for="env in availableEnvelopes" :key="env.id" :value="env.id">
                  {{ env.name }}
                </option>
              </select>
            </div>
          </template>

          <!-- Rules from distribution plans: each plan's paycheck adds its share to this envelope once saved -->
          <template v-for="(line, index) in formData.planRules" :key="index">
            <div class="form-group">
              <label>{{ t('envelopeForm.plan.add') }}</label>
              <select v-model="line.planId">
                <option :value="null">{{ t('envelopeForm.plan.none') }}</option>
                <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                  {{ plan.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('envelopes.form.allocationType') }} <HelpTip topic="allocationType" faq="allocation" /></label>
              <select v-model="line.allocationType">
                <option v-for="type in allocationTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
              <small v-if="line.allocationType === 'GoalProrated'" class="form-hint">{{ t('envelopes.form.goalProratedHint') }}</small>
            </div>

            <div v-if="line.allocationType === 'FixedAmount'" class="form-group">
              <label>{{ t('envelopes.form.fixedAmountLabel') }}</label>
              <input v-model.number="line.fixedAmount" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>

            <div v-if="line.allocationType === 'Percentage'" class="form-group">
              <label>{{ t('envelopes.form.percentageLabel') }}</label>
              <input v-model.number="line.percentage" type="number" step="0.01" min="0" max="100" placeholder="0" />
            </div>

            <button type="button" class="btn-secondary" @click="removePlanRule(index)">
              {{ t('envelopeForm.plan.remove') }}
            </button>
          </template>

          <button type="button" class="btn-secondary" @click="addPlanRule">
            {{ t('envelopeForm.plan.addSource') }}
          </button>
        </div>

        <!-- 4. Sharing: only with the Family plan -->
        <div v-if="canShareWithMembers" class="section-divider">
          <h3>{{ t('envelopeForm.groups.sharing') }}</h3>

          <div class="form-group">
            <label>
              <input v-model="formData.isShared" type="checkbox" />
              {{ t('envelopeForm.share.checkbox') }}
            </label>
          </div>

          <div v-if="formData.isShared" class="form-group">
            <label>{{ t('envelopeForm.share.percentage') }}</label>
            <input v-model.number="formData.sharedPercentage" type="number" min="0" max="100" placeholder="0" />
          </div>
        </div>
      </div>

        <p v-if="submitError" class="error-text">{{ submitError }}</p>

      <div class="modal-footer">
        <button v-if="isEditing" class="btn-danger" @click="handleDelete">
          <i class="mdi mdi-trash-can-outline"></i>
          {{ t('envelopeForm.delete') }}
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

.color-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-swatch {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-swatch.selected {
  border-color: #1e293b;
  box-shadow: 0 0 0 2px white inset;
}

.color-none {
  background: #f1f5f9;
  color: #64748b;
}

.paid-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
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

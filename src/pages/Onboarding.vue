<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { accountsApi } from '../api/accounts'
import { jobsApi } from '../api/jobs'
import { envelopesApi } from '../api/envelopes'
import { onboardingApi } from '../api/onboarding'
import { paychecksPerMonth } from '../utils/envelopes'

const { t, locale } = useI18n()
const router = useRouter()

const STEPS = ['howItWorks', 'account', 'job', 'envelope', 'summary'] as const
const FREQUENCIES = ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const
const ACCOUNT_TYPES = ['checking', 'savings'] as const
// How each kind of envelope is fed by the paycheck in the wizard
const PURPOSES = ['Bill', 'WeeklyExpenses', 'SavingsGoal', 'GeneralReserve'] as const
type Purpose = typeof PURPOSES[number]

// The backend frequency names, for the monthly estimate on the summary
const BACKEND_FREQUENCY: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'BiWeekly',
  semimonthly: 'SemiMonthly',
  monthly: 'Monthly'
}

const step = ref(0)
const saving = ref(false)
const error = ref('')

const todayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Accounts known to the household, used to pick the home account of the job
const accounts = ref<any[]>([])

// What the wizard created, shown on the summary step
const createdAccount = ref<any>(null)
const createdJob = ref<any>(null)
const createdEnvelopes = ref<{ name: string; perPaycheck: number | null; linked: boolean }[]>([])

// Step: account, with today's balance so the surplus means something from the start
const accountName = ref(t('onboarding.defaults.account'))
const accountType = ref<string>('checking')
const accountBalance = ref<number | null>(null)

// Step: job, with the next payday and the usual amount of a paycheck
const jobName = ref(t('onboarding.defaults.job'))
const jobFrequency = ref<string>('biweekly')
const jobNextPayday = ref(todayIso())
const jobAmount = ref<number | null>(null)
const jobHomeAccountId = ref('')
const jobIsMain = ref(true)

// Step: envelopes. Each line is fed by the paycheck: a bill gets its share, a goal its share until the
// date, the others a fixed amount per paycheck. A line left without an amount is not created.
interface EnvelopeLine {
  name: string
  purpose: Purpose
  amount: number | null
  dayOfMonth: number | null
  targetDate: string
}
const envelopeAccountId = ref('')
const envelopeLines = ref<EnvelopeLine[]>([
  { name: t('onboarding.defaults.bill'), purpose: 'Bill', amount: null, dayOfMonth: 1, targetDate: '' },
  { name: t('onboarding.defaults.groceries'), purpose: 'WeeklyExpenses', amount: null, dayOfMonth: null, targetDate: '' },
  { name: t('onboarding.defaults.savings'), purpose: 'SavingsGoal', amount: null, dayOfMonth: null, targetDate: '' }
])
const MAX_LINES = 6

onMounted(async () => {
  try {
    const { data } = await accountsApi.listAccounts()
    accounts.value = data || []
    if (accounts.value.length > 0) {
      jobHomeAccountId.value = accounts.value[0].id
      envelopeAccountId.value = accounts.value[0].id
    }
  } catch {
    accounts.value = []
  }
})

// Runs one step's request; shows the backend message on failure and keeps the user on the step
const run = async (action: () => Promise<void>) => {
  saving.value = true
  error.value = ''
  try {
    await action()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || t('onboarding.errors.generic')
  } finally {
    saving.value = false
  }
}

const submitAccount = () => run(async () => {
  if (!accountName.value.trim()) {
    error.value = t('onboarding.errors.nameRequired')
    return
  }
  const { data } = await accountsApi.createAccount({ name: accountName.value.trim(), type: accountType.value })
  // The balance is recorded separately, like the « Ajuster le solde » button does
  if (accountBalance.value !== null && !Number.isNaN(accountBalance.value)) {
    await accountsApi.updateAccount(data.id, { name: data.name, newBalance: accountBalance.value })
  }
  createdAccount.value = data
  accounts.value = [...accounts.value, data]
  jobHomeAccountId.value = data.id
  envelopeAccountId.value = data.id
  step.value = 2
})

const submitJob = () => run(async () => {
  if (!jobName.value.trim()) {
    error.value = t('onboarding.errors.nameRequired')
    return
  }
  if (!jobHomeAccountId.value) {
    error.value = t('onboarding.errors.accountRequired')
    return
  }
  if (!jobNextPayday.value) {
    error.value = t('onboarding.errors.paydayRequired')
    return
  }
  const { data } = await jobsApi.createPlan({
    name: jobName.value.trim(),
    homeAccountId: jobHomeAccountId.value,
    frequency: jobFrequency.value,
    anchorDate: jobNextPayday.value
  })
  if (jobIsMain.value) await jobsApi.setMainJob(data.id)
  createdJob.value = data
  step.value = 3
})

const addLine = () => {
  if (envelopeLines.value.length < MAX_LINES) {
    envelopeLines.value.push({ name: '', purpose: 'WeeklyExpenses', amount: null, dayOfMonth: null, targetDate: '' })
  }
}

const removeLine = (index: number) => envelopeLines.value.splice(index, 1)

// Lines the user filled in: a name and an amount
const filledLines = computed(() => envelopeLines.value.filter(line => line.name.trim() && line.amount && line.amount > 0))

// Per-paycheck estimate shown on the summary. The server recalculates bill and goal shares on each payday;
// this is the average over a month (bills) or until the date (goals).
const perPaycheck = computed(() => paychecksPerMonth({ frequency: BACKEND_FREQUENCY[jobFrequency.value] ?? 'BiWeekly' }))
const estimateFor = (line: EnvelopeLine): number => {
  const amount = line.amount ?? 0
  if (line.purpose === 'Bill') return perPaycheck.value > 0 ? amount / perPaycheck.value : amount
  if (line.purpose === 'SavingsGoal') {
    const days = (new Date(line.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    const paychecks = Math.max(1, Math.floor((days / 30.44) * perPaycheck.value))
    return amount / paychecks
  }
  return amount
}

const submitEnvelopes = () => run(async () => {
  const lines = filledLines.value
  if (lines.length > 0 && !envelopeAccountId.value) {
    error.value = t('onboarding.errors.accountRequired')
    return
  }
  for (const line of lines) {
    if (line.purpose === 'Bill' && !(line.dayOfMonth && line.dayOfMonth >= 1 && line.dayOfMonth <= 31)) {
      error.value = t('onboarding.errors.billDayRequired', { name: line.name })
      return
    }
    if (line.purpose === 'SavingsGoal' && !(line.targetDate && line.targetDate > todayIso())) {
      error.value = t('onboarding.errors.goalDateRequired', { name: line.name })
      return
    }
  }

  const created: typeof createdEnvelopes.value = []
  for (const line of lines) {
    const isBill = line.purpose === 'Bill'
    const isGoal = line.purpose === 'SavingsGoal'
    const { data } = await envelopesApi.createEnvelope({
      name: line.name.trim(),
      homeAccountId: envelopeAccountId.value,
      purpose: line.purpose,
      // A bill or a goal keeps its total as the target; the other envelopes take an amount per paycheck
      ...(isBill || isGoal ? { targetAmount: line.amount } : {}),
      ...(isBill ? { scheduleType: 'Monthly', dayOfMonth: line.dayOfMonth } : {}),
      ...(isGoal ? { targetDate: line.targetDate } : {})
    })

    // Linked to the paycheck created at the previous step, so each paycheck fills the envelope
    if (createdJob.value) {
      await jobsApi.addRule(createdJob.value.id, {
        envelopeId: data.id,
        allocationType: isBill ? 'BillProrated' : isGoal ? 'GoalProrated' : 'FixedAmount',
        fixedAmount: isBill || isGoal ? null : line.amount,
        percentageValue: null,
        priority: 'Medium'
      })
    }
    created.push({ name: line.name.trim(), perPaycheck: createdJob.value ? estimateFor(line) : null, linked: !!createdJob.value })
  }
  createdEnvelopes.value = created
  step.value = 4
})

// Summary: what the paycheck puts in the envelopes, and what is left over
const totalPerPaycheck = computed(() => createdEnvelopes.value.reduce((sum, e) => sum + (e.perPaycheck ?? 0), 0))
const surplusPerPaycheck = computed(() => (jobAmount.value ?? 0) - totalPerPaycheck.value)

// Skipping a single step moves on without creating anything
const skipStep = () => {
  error.value = ''
  if (step.value < STEPS.length - 1) step.value++
}

// Leaves the wizard for the dashboard; also used when the user skips the whole setup
const finish = async () => {
  // Record it on the server so the wizard is not shown again on any device; go on even if that fails
  await onboardingApi.complete().catch(err => console.error('Could not save onboarding status:', err))
  router.push('/dashboard')
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale.value, { day: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="onboarding">
    <div class="onboarding-card">
      <header class="onboarding-header">
        <h1>{{ t('onboarding.title') }}</h1>
        <p class="intro">{{ t('onboarding.intro') }}</p>
        <ol class="steps">
          <li
            v-for="(name, index) in STEPS"
            :key="name"
            :class="{ active: index === step, done: index < step }"
          >
            <span class="step-number">{{ index + 1 }}</span>
            {{ t(`onboarding.steps.${name}`) }}
          </li>
        </ol>
      </header>

      <p v-if="error" class="error-message">{{ error }}</p>

      <!-- Step 1: how the app works, before anything is asked -->
      <section v-if="step === 0" class="step-body">
        <h2>{{ t('onboarding.howItWorks.title') }}</h2>
        <ol class="how-list">
          <li>
            <i class="mdi mdi-bank"></i>
            <div><strong>{{ t('onboarding.howItWorks.accountTitle') }}</strong><p>{{ t('onboarding.howItWorks.account') }}</p></div>
          </li>
          <li>
            <i class="mdi mdi-cash-fast"></i>
            <div><strong>{{ t('onboarding.howItWorks.paycheckTitle') }}</strong><p>{{ t('onboarding.howItWorks.paycheck') }}</p></div>
          </li>
          <li>
            <i class="mdi mdi-email-outline"></i>
            <div><strong>{{ t('onboarding.howItWorks.envelopesTitle') }}</strong><p>{{ t('onboarding.howItWorks.envelopes') }}</p></div>
          </li>
          <li>
            <i class="mdi mdi-check-circle-outline"></i>
            <div><strong>{{ t('onboarding.howItWorks.surplusTitle') }}</strong><p>{{ t('onboarding.howItWorks.surplus') }}</p></div>
          </li>
        </ol>

        <div class="step-actions">
          <button class="btn-primary" @click="step = 1">{{ t('onboarding.start') }}</button>
        </div>
      </section>

      <!-- Step 2: account -->
      <section v-if="step === 1" class="step-body">
        <h2>{{ t('onboarding.account.title') }}</h2>
        <p class="hint">{{ t('onboarding.account.description') }}</p>

        <div class="form-group">
          <label>{{ t('onboarding.account.name') }}</label>
          <input v-model="accountName" type="text" maxlength="100" />
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.account.type') }}</label>
          <select v-model="accountType">
            <option v-for="type in ACCOUNT_TYPES" :key="type" :value="type">
              {{ t(`onboarding.account.types.${type}`) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.account.balance') }}</label>
          <input v-model.number="accountBalance" type="number" step="0.01" placeholder="0.00" />
          <small class="hint">{{ t('onboarding.account.balanceHint') }}</small>
        </div>

        <div class="step-actions">
          <button class="btn-secondary" :disabled="saving" @click="skipStep">{{ t('onboarding.skipStep') }}</button>
          <button class="btn-primary" :disabled="saving" @click="submitAccount">
            {{ saving ? t('onboarding.saving') : t('onboarding.next') }}
          </button>
        </div>
      </section>

      <!-- Step 3: job -->
      <section v-if="step === 2" class="step-body">
        <h2>{{ t('onboarding.job.title') }}</h2>
        <p class="hint">{{ t('onboarding.job.description') }}</p>

        <div class="form-group">
          <label>{{ t('onboarding.job.name') }}</label>
          <input v-model="jobName" type="text" maxlength="100" />
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.job.frequency') }}</label>
          <select v-model="jobFrequency">
            <option v-for="freq in FREQUENCIES" :key="freq" :value="freq">
              {{ t(`onboarding.frequencies.${freq}`) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.job.nextPayday') }}</label>
          <input v-model="jobNextPayday" type="date" />
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.job.amount') }}</label>
          <input v-model.number="jobAmount" type="number" step="0.01" min="0" placeholder="0.00" />
          <small class="hint">{{ t('onboarding.job.amountHint') }}</small>
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.job.homeAccount') }}</label>
          <select v-model="jobHomeAccountId">
            <option value="" disabled>{{ t('onboarding.job.chooseAccount') }}</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">
              {{ account.name }}
            </option>
          </select>
        </div>

        <label class="checkbox-line">
          <input v-model="jobIsMain" type="checkbox" />
          {{ t('onboarding.job.setMain') }}
        </label>

        <div class="step-actions">
          <button class="btn-secondary" :disabled="saving" @click="skipStep">{{ t('onboarding.skipStep') }}</button>
          <button class="btn-primary" :disabled="saving" @click="submitJob">
            {{ saving ? t('onboarding.saving') : t('onboarding.next') }}
          </button>
        </div>
      </section>

      <!-- Step 4: envelopes, each fed by the paycheck -->
      <section v-if="step === 3" class="step-body">
        <h2>{{ t('onboarding.envelope.title') }}</h2>
        <p class="hint">{{ t('onboarding.envelope.description') }}</p>
        <p v-if="!createdJob" class="hint warning">{{ t('onboarding.envelope.noJob') }}</p>

        <div v-if="accounts.length > 1" class="form-group">
          <label>{{ t('onboarding.envelope.account') }}</label>
          <select v-model="envelopeAccountId">
            <option value="" disabled>{{ t('onboarding.job.chooseAccount') }}</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">
              {{ account.name }}
            </option>
          </select>
        </div>

        <div v-for="(line, index) in envelopeLines" :key="index" class="envelope-line">
          <div class="line-header">
            <input v-model="line.name" type="text" maxlength="100" :placeholder="t('onboarding.envelope.name')" />
            <button type="button" class="btn-remove" :title="t('onboarding.envelope.remove')" @click="removeLine(index)">×</button>
          </div>

          <div class="line-fields">
            <div class="form-group">
              <label>{{ t('onboarding.envelope.purpose') }}</label>
              <select v-model="line.purpose">
                <option v-for="purpose in PURPOSES" :key="purpose" :value="purpose">
                  {{ t(`enums.envelopePurposes.${purpose}`) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t(`onboarding.envelope.amountLabels.${line.purpose}`) }}</label>
              <input v-model.number="line.amount" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>

            <div v-if="line.purpose === 'Bill'" class="form-group">
              <label>{{ t('onboarding.envelope.dayOfMonth') }}</label>
              <input v-model.number="line.dayOfMonth" type="number" min="1" max="31" />
            </div>

            <div v-if="line.purpose === 'SavingsGoal'" class="form-group">
              <label>{{ t('onboarding.envelope.targetDate') }}</label>
              <input v-model="line.targetDate" type="date" />
            </div>
          </div>

          <small class="hint">{{ t(`onboarding.envelope.explain.${line.purpose}`) }}</small>
        </div>

        <button v-if="envelopeLines.length < MAX_LINES" type="button" class="btn-link" @click="addLine">
          <i class="mdi mdi-plus"></i> {{ t('onboarding.envelope.addLine') }}
        </button>

        <div class="step-actions">
          <button class="btn-secondary" :disabled="saving" @click="skipStep">{{ t('onboarding.skipStep') }}</button>
          <button class="btn-primary" :disabled="saving" @click="submitEnvelopes">
            {{ saving ? t('onboarding.saving') : t('onboarding.next') }}
          </button>
        </div>
      </section>

      <!-- Step 5: summary, showing one paycheck going through the envelopes -->
      <section v-if="step === 4" class="step-body">
        <h2>{{ t('onboarding.summary.title') }}</h2>

        <ul class="summary-list">
          <li :class="{ created: createdAccount }">
            <i :class="createdAccount ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.account') }} : {{ createdAccount ? createdAccount.name : t('onboarding.summary.notCreated') }}
          </li>
          <li :class="{ created: createdJob }">
            <i :class="createdJob ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.job') }} : {{ createdJob ? createdJob.name : t('onboarding.summary.notCreated') }}
          </li>
          <li :class="{ created: createdEnvelopes.length }">
            <i :class="createdEnvelopes.length ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.envelope') }} :
            {{ createdEnvelopes.length ? createdEnvelopes.map(e => e.name).join(', ') : t('onboarding.summary.notCreated') }}
          </li>
        </ul>

        <!-- One paycheck, split: the core of the app -->
        <div v-if="createdJob && createdEnvelopes.some(e => e.linked)" class="split-preview">
          <h3>{{ t('onboarding.summary.splitTitle') }}</h3>
          <div v-if="jobAmount" class="split-row split-paycheck">
            <span>{{ t('onboarding.summary.paycheck') }}</span>
            <strong>{{ formatCurrency(jobAmount) }}</strong>
          </div>
          <div v-for="env in createdEnvelopes.filter(e => e.linked)" :key="env.name" class="split-row">
            <span>{{ env.name }}</span>
            <strong>{{ t('onboarding.summary.about', { amount: formatCurrency(env.perPaycheck ?? 0) }) }}</strong>
          </div>
          <div v-if="jobAmount" class="split-row split-surplus" :class="{ 'is-deficit': surplusPerPaycheck < 0 }">
            <span>{{ surplusPerPaycheck < 0 ? t('onboarding.summary.deficit') : t('onboarding.summary.surplus') }}</span>
            <strong>{{ formatCurrency(Math.abs(surplusPerPaycheck)) }}</strong>
          </div>
          <small class="hint">{{ t('onboarding.summary.estimateHint') }}</small>
        </div>

        <h3>{{ t('onboarding.summary.nextTitle') }}</h3>
        <ol class="next-list">
          <li v-if="createdJob">{{ t('onboarding.summary.nextDeposit', { date: formatDate(jobNextPayday) }) }}</li>
          <li>{{ t('onboarding.summary.nextBalance') }}</li>
          <li>{{ t('onboarding.summary.nextHelp') }}</li>
        </ol>

        <div class="step-actions">
          <button class="btn-primary" @click="finish">{{ t('onboarding.goToDashboard') }}</button>
        </div>
      </section>

      <footer v-if="step < 4" class="onboarding-footer">
        <button class="link-button" :disabled="saving" @click="finish">{{ t('onboarding.skipAll') }}</button>
        <router-link to="/faq" class="link-button">{{ t('faq.link') }}</router-link>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.onboarding {
  min-height: 100vh;
  background: var(--surface);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
}

.onboarding-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 620px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.onboarding-header h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.intro,
.hint {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.hint.warning {
  color: var(--warning, #b45309);
}

.steps {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.steps li {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.steps li.active {
  color: var(--primary);
  font-weight: 600;
}

.steps li.active .step-number {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}

.steps li.done .step-number {
  border-color: var(--success);
  color: var(--success);
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-body h2 {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0;
}

.step-body h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0;
}

.how-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.how-list li {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.how-list i {
  font-size: 1.5rem;
  color: var(--primary);
}

.how-list p {
  margin: 0.125rem 0 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.line-header input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.line-header input:focus {
  outline: none;
  border-color: var(--primary);
}

.envelope-line {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.line-header {
  display: flex;
  gap: 0.5rem;
}

.line-header input {
  flex: 1;
  font-weight: 600;
}

.line-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.625rem;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  width: 2rem;
}

.btn-link {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

.error-message {
  color: var(--danger);
  font-size: 0.875rem;
  margin: 0;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: white;
  color: var(--text-primary);
  border-color: var(--border);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-list,
.next-list {
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--text-muted);
}

.summary-list {
  list-style: none;
}

.next-list {
  padding-left: 1.25rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.summary-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-list li.created {
  color: var(--text-primary);
}

.summary-list li.created i {
  color: var(--success);
}

.split-preview {
  background: var(--surface);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.split-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9375rem;
}

.split-row strong {
  font-variant-numeric: tabular-nums;
}

.split-paycheck {
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--border);
}

.split-surplus {
  padding-top: 0.375rem;
  border-top: 1px dashed var(--border);
}

.split-surplus strong {
  color: var(--success);
}

.split-surplus.is-deficit strong {
  color: var(--danger);
}

.onboarding-footer {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
}
</style>

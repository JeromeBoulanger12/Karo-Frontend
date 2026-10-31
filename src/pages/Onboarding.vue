<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { accountsApi } from '../api/accounts'
import { jobsApi } from '../api/jobs'
import { envelopesApi } from '../api/envelopes'
import { markOnboardingDone } from '../utils/onboarding'

const { t } = useI18n()
const router = useRouter()
const { user } = useAuth()

const STEPS = ['account', 'job', 'envelope', 'summary'] as const
const FREQUENCIES = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'annual'] as const
const ACCOUNT_TYPES = ['checking', 'savings'] as const
const PURPOSES = ['SavingsGoal', 'Bill', 'WeeklyExpenses', 'GeneralReserve'] as const

const step = ref(0)
const saving = ref(false)
const error = ref('')

// Accounts known to the household, used to pick the home account of the job
const accounts = ref<any[]>([])

// What the wizard created, shown on the summary step
const createdAccount = ref<any>(null)
const createdJob = ref<any>(null)
const createdEnvelope = ref<any>(null)

// Step 1: account
const accountName = ref(t('onboarding.defaults.account'))
const accountType = ref<string>('checking')

// Step 2: job (paycheck plan)
const jobName = ref(t('onboarding.defaults.job'))
const jobFrequency = ref<string>('biweekly')
const jobHomeAccountId = ref('')
const jobIsMain = ref(true)

// Step 3: envelope
const envelopeName = ref(t('onboarding.defaults.envelope'))
const envelopePurpose = ref<string>('SavingsGoal')
const envelopeTarget = ref<number | null>(null)

onMounted(async () => {
  try {
    const { data } = await accountsApi.listAccounts()
    accounts.value = data || []
    if (accounts.value.length > 0) jobHomeAccountId.value = accounts.value[0].id
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
  createdAccount.value = data
  accounts.value = [...accounts.value, data]
  jobHomeAccountId.value = data.id
  step.value = 1
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
  const { data } = await jobsApi.createPlan({
    name: jobName.value.trim(),
    homeAccountId: jobHomeAccountId.value,
    frequency: jobFrequency.value
  })
  if (jobIsMain.value) await jobsApi.setMainJob(data.id)
  createdJob.value = data
  step.value = 2
})

const submitEnvelope = () => run(async () => {
  if (!envelopeName.value.trim()) {
    error.value = t('onboarding.errors.nameRequired')
    return
  }
  const { data } = await envelopesApi.createEnvelope({
    name: envelopeName.value.trim(),
    purpose: envelopePurpose.value,
    ...(envelopeTarget.value ? { targetAmount: envelopeTarget.value } : {})
  })
  createdEnvelope.value = data
  step.value = 3
})

// Skipping a single step moves on without creating anything
const skipStep = () => {
  error.value = ''
  if (step.value < STEPS.length - 1) step.value++
}

// Leaves the wizard for the dashboard; also used when the user skips the whole setup
const finish = () => {
  markOnboardingDone(user.value?.id)
  router.push('/dashboard')
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

      <!-- Step 1: account -->
      <section v-if="step === 0" class="step-body">
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

        <div class="step-actions">
          <button class="btn-secondary" :disabled="saving" @click="skipStep">{{ t('onboarding.skipStep') }}</button>
          <button class="btn-primary" :disabled="saving" @click="submitAccount">
            {{ saving ? t('onboarding.saving') : t('onboarding.next') }}
          </button>
        </div>
      </section>

      <!-- Step 2: job -->
      <section v-if="step === 1" class="step-body">
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

      <!-- Step 3: envelope -->
      <section v-if="step === 2" class="step-body">
        <h2>{{ t('onboarding.envelope.title') }}</h2>
        <p class="hint">{{ t('onboarding.envelope.description') }}</p>

        <div class="form-group">
          <label>{{ t('onboarding.envelope.name') }}</label>
          <input v-model="envelopeName" type="text" maxlength="100" />
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.envelope.purpose') }}</label>
          <select v-model="envelopePurpose">
            <option v-for="purpose in PURPOSES" :key="purpose" :value="purpose">
              {{ t(`enums.envelopePurposes.${purpose}`) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('onboarding.envelope.target') }}</label>
          <input v-model.number="envelopeTarget" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>

        <div class="step-actions">
          <button class="btn-secondary" :disabled="saving" @click="skipStep">{{ t('onboarding.skipStep') }}</button>
          <button class="btn-primary" :disabled="saving" @click="submitEnvelope">
            {{ saving ? t('onboarding.saving') : t('onboarding.next') }}
          </button>
        </div>
      </section>

      <!-- Step 4: summary -->
      <section v-if="step === 3" class="step-body">
        <h2>{{ t('onboarding.summary.title') }}</h2>
        <p class="hint">{{ t('onboarding.summary.description') }}</p>

        <ul class="summary-list">
          <li :class="{ created: createdAccount }">
            <i :class="createdAccount ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.account') }} : {{ createdAccount ? createdAccount.name : t('onboarding.summary.notCreated') }}
          </li>
          <li :class="{ created: createdJob }">
            <i :class="createdJob ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.job') }} : {{ createdJob ? createdJob.name : t('onboarding.summary.notCreated') }}
          </li>
          <li :class="{ created: createdEnvelope }">
            <i :class="createdEnvelope ? 'mdi mdi-check-circle' : 'mdi mdi-minus-circle-outline'"></i>
            {{ t('onboarding.steps.envelope') }} : {{ createdEnvelope ? createdEnvelope.name : t('onboarding.summary.notCreated') }}
          </li>
        </ul>

        <div class="step-actions">
          <button class="btn-primary" @click="finish">{{ t('onboarding.goToDashboard') }}</button>
        </div>
      </section>

      <footer v-if="step < 3" class="onboarding-footer">
        <button class="link-button" :disabled="saving" @click="finish">{{ t('onboarding.skipAll') }}</button>
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
  max-width: 560px;
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
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
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

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--text-muted);
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

.onboarding-footer {
  display: flex;
  justify-content: center;
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

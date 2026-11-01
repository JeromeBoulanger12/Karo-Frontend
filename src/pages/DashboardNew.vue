<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import DashboardStats from '../components/DashboardStats.vue'
import AccountCardContainer from '../components/AccountCardContainer.vue'
import JobCard from '../components/JobCard.vue'
import EnvelopeFormModal from '../components/EnvelopeFormModal.vue'
import AccountFormModal from '../components/AccountFormModal.vue'
import AccountBalanceModal from '../components/AccountBalanceModal.vue'
import AccountHistoryModal from '../components/AccountHistoryModal.vue'
import TransferEnvelopeModal from '../components/TransferEnvelopeModal.vue'
import EnvelopeActionModal from '../components/EnvelopeActionModal.vue'
import PayBillModal from '../components/PayBillModal.vue'
import WithdrawEnvelopeModal from '../components/WithdrawEnvelopeModal.vue'
import AddFundsModal from '../components/AddFundsModal.vue'
import JobFormModal from '../components/JobFormModal.vue'
import DepositPaycheckModal from '../components/DepositPaycheckModal.vue'
import { accountsApi } from '../api/accounts'
import { envelopesApi } from '../api/envelopes'
import { jobsApi } from '../api/jobs'
import { dashboardAPI } from '../api/dashboard'
import { paychecksPerMonth, nextPaymentDate } from '../utils/envelopes'
import { monthEndProjection, type BillCoverage } from '../utils/monthEnd'
import MonthEndProjection from '../components/MonthEndProjection.vue'
import PlanningCalendar from '../components/PlanningCalendar.vue'
import '../styles/dashboard.css'

// Helper function for formatting currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(value)
}

const { t } = useI18n()
const router = useRouter()

// Data refs
const accounts = ref<any[]>([])
const envelopes = ref<any[]>([])
const jobs = ref<any[]>([])
const dashboardStats = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Error from the last submit that failed. The modal that was just closed is reopened with it, and
// keeps the user's input (its form only resets when opened with no error)
const submitError = ref('')
const reopenWithError = (err: any, fallback: string, reopen: () => void) => {
  submitError.value = err?.response?.data?.message || err?.message || fallback
  reopen()
}

// Modal refs
const showAccountModal = ref(false)
const showAccountBalanceModal = ref(false)
const showAccountHistoryModal = ref(false)
const selectedHistoryAccount = ref<any>(null)
const showEnvelopeModal = ref(false)
const showTransferModal = ref(false)
const selectedTransferSource = ref<any>(null)
const showPayBillModal = ref(false)
const showEnvelopeActionModal = ref(false)
const selectedActionEnvelope = ref<any>(null)
const selectedBill = ref<any>(null)
const showWithdrawModal = ref(false)
const selectedWithdrawSource = ref<any>(null)
const showAddFundsModal = ref(false)
const selectedAddFundsEnvelope = ref<any>(null)
const showJobModal = ref(false)
const showDepositModal = ref(false)
const selectedAccount = ref<any>(null)
const selectedEnvelope = ref<any>(null)
const selectedJob = ref<any>(null)
const currentAccountIdForEnvelope = ref<string>('')
const currentAccountIdForJob = ref<string>('')
const selectedJobForDeposit = ref<any>(null)
const selectedAccountForBalance = ref<any>(null)
// Balance history per account id, from the dashboard overview
const accountHistory = ref<Record<string, { capturedAt: string; amount: { amount: number; currency: string } }[]>>({})

// Computed properties
const totalBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + (acc.latestBalance?.amount ?? acc.latestSnapshot?.amount?.amount ?? 0), 0)
})

// Monthly forecast: the last distributed paycheck of each plan, times how often that plan is paid
// Per account: its balance minus the total of its envelopes (negative means a deficit)
const accountSurpluses = computed(() => {
  return accounts.value.map(acc => {
    const balance = acc.latestBalance?.amount ?? acc.latestSnapshot?.amount?.amount ?? 0
    const envelopesTotal = getAccountEnvelopes(acc.id).reduce((sum, env) => sum + (env.balance?.amount ?? 0), 0)
    return { id: acc.id, name: acc.name, amount: balance - envelopesTotal }
  })
})

// Planning tools (month-end card and calendar) are a paid-tier feature, provided by App.vue
const subscriptionFeatures = inject('subscriptionFeatures', ref({ allowPlanning: false }))
const canPlan = computed(() => !!subscriptionFeatures.value.allowPlanning)

// Inputs for the calendar: bills with their schedule, and jobs with their last paycheck
const calendarBills = computed(() =>
  envelopes.value
    .filter(env => env.purpose === 'Bill' && env.billPaymentScheduleJson)
    .map(env => ({
      name: env.name,
      amount: env.targetAmount?.amount ?? 0,
      scheduleJson: env.billPaymentScheduleJson
    }))
)

const calendarJobs = computed(() =>
  jobs.value.map(job => ({
    name: job.name,
    amount: job.lastPaycheck?.amount?.amount ?? 0,
    anchorDate: job.recurrencePattern?.anchorDate ?? null,
    frequency: job.recurrencePattern?.frequency ?? null,
    interval: job.recurrencePattern?.interval ?? null
  }))
)

// Where the money stands at month end: surplus today, expected income still to come, and bills due
// before month end that their envelopes don't fully cover
const monthEnd = computed(() => {
  const bills = envelopes.value
    .filter(env => env.purpose === 'Bill' && env.billPaymentScheduleJson)
    .map(env => {
      const dueDate = nextPaymentDate(env.billPaymentScheduleJson)
      if (!dueDate) return null
      return {
        name: env.name,
        target: env.targetAmount?.amount ?? 0,
        balance: env.balance?.amount ?? 0,
        dueDate
      } as BillCoverage
    })
    .filter((bill): bill is BillCoverage => bill !== null)

  return monthEndProjection({
    surplus: accountSurpluses.value.reduce((sum, acc) => sum + acc.amount, 0),
    monthlyIncome: expectedIncome.value,
    today: new Date(),
    bills
  })
})

const expectedIncome = computed(() => {
  return jobs.value.reduce((sum, job) => {
    const lastAmount = job.lastPaycheck?.amount?.amount ?? 0
    return sum + lastAmount * paychecksPerMonth(job.recurrencePattern)
  }, 0)
})

const spendingThisMonth = computed(() => {
  return envelopes.value.reduce((sum, env) => {
    // Estimate spending from envelope targets
    const target = env.targetAmount?.amount ?? 0
    const balance = env.balance?.amount ?? 0
    return sum + Math.max(0, target - balance)
  }, 0)
})

const tierBadge = computed(() => {
  const tier = dashboardStats.value?.subscriptionTier || 'Free'
  const priceMap: Record<string, string> = {
    Free: '$0',
    Pro: '$9.99/mois',
    Family: '$19.99/mois'
  }
  return {
    tier: tier as 'Free' | 'Pro' | 'Family',
    price: priceMap[tier] || '$0'
  }
})

// Group envelopes by account
const getAccountEnvelopes = (accountId: string) => {
  return envelopes.value.filter(env => env.homeAccountId === accountId)
}

// Modal handlers - Account
const openAddAccountModal = () => {
  submitError.value = ''
  selectedAccount.value = null
  showAccountModal.value = true
}

const openEditAccountModal = (account: any) => {
  submitError.value = ''
  selectedAccount.value = account
  showAccountModal.value = true
}

const handleAccountSave = async (accountData: any) => {
  showAccountModal.value = false
  try {
    if (selectedAccount.value?.id) {
      // Edit existing - transform balance to NewBalance for API
      const updateData = {
        name: accountData.name,
        newBalance: accountData.balance
      }
      await accountsApi.updateAccount(selectedAccount.value.id, updateData)
    } else {
      // Create new
      await accountsApi.createAccount(accountData)
    }
    await loadDashboard()
  } catch (err) {
    console.error('Error saving account:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showAccountModal.value = true))
  }
}

// Modal handlers - Envelope
const openAddEnvelopeModal = (accountId: string) => {
  submitError.value = ''
  selectedEnvelope.value = null
  currentAccountIdForEnvelope.value = accountId
  showEnvelopeModal.value = true
}

const openEditEnvelopeModal = (envelope: any) => {
  submitError.value = ''
  selectedEnvelope.value = envelope
  currentAccountIdForEnvelope.value = envelope.homeAccountId
  showEnvelopeModal.value = true
}

const handleEnvelopeSave = async (envelopeData: any) => {
  const { selectedPlanId, planAllocationType, planFixedAmount, planPercentage, ...payload } = envelopeData
  showEnvelopeModal.value = false
  try {
    let envelopeId: string
    if (selectedEnvelope.value?.id) {
      // Edit existing
      envelopeId = selectedEnvelope.value.id
      await envelopesApi.updateEnvelope(envelopeId, payload)
    } else {
      // Create new
      const { data: created } = await envelopesApi.createEnvelope(payload)
      envelopeId = created.id
    }

    if (selectedPlanId) {
      // One rule per envelope per plan: skip if the plan already distributes to this envelope
      const plan = jobs.value.find(j => j.id === selectedPlanId)
      const alreadyInPlan = plan?.rules?.some((r: any) => r.envelopeId === envelopeId)
      if (alreadyInPlan) {
        console.warn('This envelope already has a rule in the selected plan; skipping.')
      } else {
        try {
          await jobsApi.addRule(selectedPlanId, {
            envelopeId,
            allocationType: planAllocationType,
            fixedAmount: planAllocationType === 'FixedAmount' ? planFixedAmount : null,
            percentageValue: planAllocationType === 'Percentage' ? planPercentage : null,
            priority: 'Medium'
          })
        } catch (ruleErr) {
          console.error('Envelope saved but adding its rule to the plan failed:', ruleErr)
        }
      }
    }

    await loadDashboard()
  } catch (err) {
    console.error('Error saving envelope:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showEnvelopeModal.value = true))
  }
}

const handleEnvelopeDelete = async (envelopeId: string) => {
  showEnvelopeModal.value = false
  try {
    await envelopesApi.deleteEnvelope(envelopeId)
    // Reload so the removed rule also disappears from the plans
    await loadDashboard()
  } catch (err) {
    console.error('Error deleting envelope:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showEnvelopeModal.value = true))
  }
}

// Clicking an envelope row opens the action chooser, which hands off to the matching modal
const openEnvelopeActionModal = (envelope: any) => {
  selectedActionEnvelope.value = envelope
  showEnvelopeActionModal.value = true
}

const handleEnvelopeAction = (type: 'add' | 'pay' | 'transfer' | 'withdraw', envelope: any) => {
  showEnvelopeActionModal.value = false
  if (type === 'add') openAddFundsModal(envelope)
  else if (type === 'pay') openPayBillModal(envelope)
  else if (type === 'transfer') openTransferModal(envelope)
  else openWithdrawModal(envelope)
}

// Add money to an envelope (e.g. reach 50% of a bill before its next payment). Only the envelope
// ledger changes: no account balance is touched
const openAddFundsModal = (envelope: any) => {
  submitError.value = ''
  selectedAddFundsEnvelope.value = envelope
  showAddFundsModal.value = true
}

const handleEnvelopeAddFunds = async (payload: { amount: number; memo?: string }) => {
  if (!selectedAddFundsEnvelope.value?.id) return
  showAddFundsModal.value = false
  try {
    await envelopesApi.allocate(selectedAddFundsEnvelope.value.id, payload)
    await loadDashboard()
  } catch (err) {
    console.error('Error adding funds to envelope:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showAddFundsModal.value = true))
  }
}

// Bill paid: the modal asks for the amount, then the backend withdraws it from the envelope
// and debits the home account in one transaction
const openPayBillModal = (envelope: any) => {
  submitError.value = ''
  if (!(envelope.balance?.amount > 0)) return
  selectedBill.value = envelope
  showPayBillModal.value = true
}

const isDebtPayment = computed(() => selectedBill.value?.purpose === 'DebtPayment')

// Debt envelopes pay the debt account; bill envelopes pay the bill
const handleBillPay = async (amount: number) => {
  if (!selectedBill.value?.id) return
  showPayBillModal.value = false
  try {
    if (isDebtPayment.value) {
      await envelopesApi.payDebt(selectedBill.value.id, amount)
    } else {
      await envelopesApi.pay(selectedBill.value.id, amount)
    }
    await loadDashboard()
  } catch (err) {
    console.error('Error recording payment:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showPayBillModal.value = true))
  }
}

// Transfer money from one envelope to another (no account balance change)
const openTransferModal = (envelope: any) => {
  submitError.value = ''
  selectedTransferSource.value = envelope
  showTransferModal.value = true
}

const handleEnvelopeTransfer = async (payload: { toEnvelopeId: string; amount: number; memo?: string }) => {
  if (!selectedTransferSource.value?.id) return
  showTransferModal.value = false
  try {
    await envelopesApi.transfer(selectedTransferSource.value.id, {
      targetEnvelopeId: payload.toEnvelopeId,
      amount: payload.amount,
      memo: payload.memo
    })
    await loadDashboard()
  } catch (err) {
    console.error('Error transferring between envelopes:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showTransferModal.value = true))
  }
}

// Withdraw money from an envelope: only the envelope balance changes, not the account balance
const openWithdrawModal = (envelope: any) => {
  submitError.value = ''
  selectedWithdrawSource.value = envelope
  showWithdrawModal.value = true
}

const handleEnvelopeWithdraw = async (payload: { amount: number; payee?: string; memo?: string }) => {
  if (!selectedWithdrawSource.value?.id) return
  showWithdrawModal.value = false
  try {
    await envelopesApi.withdraw(selectedWithdrawSource.value.id, payload)
    await loadDashboard()
  } catch (err) {
    console.error('Error withdrawing from envelope:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showWithdrawModal.value = true))
  }
}

// Modal handlers - Job
const openAddJobModal = (accountId: string = '') => {
  submitError.value = ''
  selectedJob.value = null
  console.log('openAddJobModal - accountId:', accountId, 'accounts.value.length:', accounts.value.length)
  // If no account provided, use the first available account
  if (!accountId && accounts.value.length > 0) {
    currentAccountIdForJob.value = accounts.value[0].id
    console.log('Selected account ID:', accounts.value[0].id)
  } else if (accountId) {
    currentAccountIdForJob.value = accountId
    console.log('Using provided account ID:', accountId)
  } else {
    console.warn('No account provided and no accounts available!')
    currentAccountIdForJob.value = ''
  }
  console.log('currentAccountIdForJob after setting:', currentAccountIdForJob.value)
  showJobModal.value = true
}

const openEditJobModal = (job: any) => {
  submitError.value = ''
  selectedJob.value = job
  currentAccountIdForJob.value = job.homeAccountId
  showJobModal.value = true
}

const handleJobSave = async (jobData: any) => {
  const jobId = selectedJob.value?.id
  showJobModal.value = false
  try {
    if (jobId) {
      // Edit: frequency and the payday the schedule is counted from
      await jobsApi.updateRecurrence(jobId, { frequency: jobData.frequency, anchorDate: jobData.anchorDate })
    } else {
      // Create new
      console.log('handleJobSave - Job data from form:', jobData)
      await jobsApi.createPlan(jobData)
    }
    await loadDashboard()
  } catch (err: any) {
    console.error('Error saving job:', err)
    console.error('Error response:', err.response?.data)
    reopenWithError(err, t('dashboard.errors.saveJob'), () => (showJobModal.value = true))
  }
}

// Load data
// `loading` starts true, so only the first load shows the full-page spinner; refreshes after a
// save happen in the background while the modal is already closed
const loadDashboard = async () => {
  error.value = ''
  try {
    // One request for the whole dashboard: accounts, envelopes, plans (with last paycheck), stats, history
    const overview = await dashboardAPI.getOverview()

    accounts.value = overview.accounts || []

    // No account yet: send the user through the setup wizard (unless they finished or skipped it)
    if (accounts.value.length === 0 && !overview.onboardingCompleted) {
      router.replace('/onboarding')
      return
    }

    envelopes.value = overview.envelopes || []
    dashboardStats.value = overview.stats || {}
    accountHistory.value = overview.accountHistory || {}

    // Enrich jobs with account names
    jobs.value = (overview.jobs || []).map((job: any) => ({
      ...job,
      accountName: accounts.value.find(a => a.id === job.homeAccountId)?.name || 'Account'
    }))
  } catch (err: any) {
    error.value = err?.message || t('dashboard.error_loading')
    console.error('Error loading dashboard:', err)
  } finally {
    loading.value = false
  }
}

// Handle job edit - now handled by modal
const handleJobEdit = (job: any) => {
  openEditJobModal(job)
}

// Modal handlers - Deposit Paycheck
const openDepositPaycheckModal = (job?: any) => {
  submitError.value = ''
  selectedJobForDeposit.value = job || null
  showDepositModal.value = true
}

const handleDepositPaycheck = async (depositData: any) => {
  showDepositModal.value = false
  try {
    if (selectedJobForDeposit.value?.id) {
      // Distribute paycheck to the selected job
      await jobsApi.distributePaycheck(selectedJobForDeposit.value.id, {
        amount: depositData.amount,
        receivedAt: new Date(depositData.date).toISOString(),
        accountBalance: depositData.accountBalance
      })
    }
    await loadDashboard()
  } catch (err) {
    console.error('Error depositing paycheck:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showDepositModal.value = true))
  }
}

// Set main job
const handleSetMainJob = async (job: any) => {
  try {
    if (job?.id) {
      await jobsApi.setMainJob(job.id)
      await loadDashboard()
    }
  } catch (err) {
    console.error('Error setting main job:', err)
  }
}

// Account balance modal handlers
// Read-only history of the account's balance snapshots, with the biggest movements flagged
const openAccountHistoryModal = (account: any) => {
  selectedHistoryAccount.value = account
  showAccountHistoryModal.value = true
}

const openAccountBalanceModal = (account: any) => {
  submitError.value = ''
  selectedAccountForBalance.value = account
  showAccountBalanceModal.value = true
}

const handleAccountBalanceSave = async (payload: { balance: number; note?: string }) => {
  showAccountBalanceModal.value = false
  try {
    if (selectedAccountForBalance.value?.id) {
      await accountsApi.updateAccount(selectedAccountForBalance.value.id, {
        name: selectedAccountForBalance.value.name,
        newBalance: payload.balance,
        note: payload.note
      })
    }
    await loadDashboard()
  } catch (err) {
    console.error('Error updating account balance:', err)
    reopenWithError(err, t('dashboard.errors.save'), () => (showAccountBalanceModal.value = true))
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('common.loading') || 'Chargement...' }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="mdi mdi-alert-circle"></i>
        {{ error }}
      </div>
      <button class="btn-retry" @click="loadDashboard">{{ t('common.retry') }}</button>
    </div>

    <!-- Main content -->
    <div v-else class="dashboard-content">
      <!-- Page Header -->
      <PageHeader
        :title="t('dashboard.title')"
        :tierBadge="tierBadge"
      >
        <template #actions>
          <router-link to="/faq" class="btn-faq">
            <i class="mdi mdi-help-circle-outline"></i>
            {{ t('faq.link') }}
          </router-link>
          <button class="btn-deposit-paycheck" @click="openDepositPaycheckModal">
            <i class="mdi mdi-plus-circle"></i>
            Déposer une paie
          </button>
        </template>
      </PageHeader>

      <template v-if="canPlan">
        <MonthEndProjection :result="monthEnd" />
        <PlanningCalendar :bills="calendarBills" :jobs="calendarJobs" />
      </template>

      <!-- Stats Row -->
      <DashboardStats
        :totalBalance="totalBalance"
        :envelopesCount="envelopes.length"
        :jobsCount="jobs.length"
        :spendingThisMonth="spendingThisMonth"
        :expectedIncome="expectedIncome"
      />

      <!-- Accounts Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="mdi mdi-bank"></i>
            Vos comptes et enveloppes
          </h2>
          <button class="btn-add-account" @click="openAddAccountModal">
            <i class="mdi mdi-plus"></i>
            Ajouter un compte
          </button>
        </div>

        <div v-if="accounts.length === 0" class="empty-state">
          <i class="mdi mdi-inbox-outline"></i>
          <p>{{ t('dashboard.noAccounts') }}</p>
          <button class="btn-create" @click="openAddAccountModal">
            <i class="mdi mdi-plus"></i>
            Créer un compte
          </button>
        </div>

        <div v-else class="accounts-list">
          <AccountCardContainer
            v-for="account in accounts"
            :key="account.id"
            :account="account"
            :envelopes="getAccountEnvelopes(account.id)"
            :history="accountHistory[account.id]"
            :surplus="accountSurpluses.find(s => s.id === account.id)?.amount ?? null"
            :balance-date="account.latestSnapshotDate"
            @add-envelope="openAddEnvelopeModal($event)"
            @select-envelope="openEnvelopeActionModal($event)"
            @edit-envelope="openEditEnvelopeModal($event)"
            @edit-account="openEditAccountModal($event)"
            @edit-balance="openAccountBalanceModal($event)"
            @view-history="openAccountHistoryModal($event)"
          />
        </div>
      </section>

      <!-- Jobs/Paie Section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="mdi mdi-calendar-multiple"></i>
            Paie et revenus
          </h2>
          <button class="btn-add-paycheck" @click="openDepositPaycheckModal">
            <i class="mdi mdi-plus-circle"></i>
            Déposer une paie
          </button>
        </div>

        <div v-if="jobs.length === 0" class="jobs-grid">
          <div class="add-job-card" @click="openAddJobModal('')">
            <i class="mdi mdi-plus"></i>
            <p>Ajouter une source de revenu</p>
            <button class="btn-create">Ajouter</button>
          </div>
        </div>

        <div v-else class="jobs-grid">
          <JobCard
            v-for="job in jobs"
            :key="job.id"
            :job="job"
            @edit="openEditJobModal($event)"
            @deposit="openDepositPaycheckModal($event)"
            @set-main-job="handleSetMainJob($event)"
          />
          <div class="add-job-card" @click="openAddJobModal('')">
            <i class="mdi mdi-plus"></i>
            <p>Ajouter une source de revenu</p>
            <button class="btn-create">Ajouter</button>
          </div>
        </div>
      </section>
    </div>

    <!-- Modals -->
    <AccountFormModal
      :isOpen="showAccountModal"
      :submitError="submitError"
      :account="selectedAccount"
      @close="showAccountModal = false"
      @save="handleAccountSave"
    />

    <AccountBalanceModal
      :isOpen="showAccountBalanceModal"
      :submitError="submitError"
      :account="selectedAccountForBalance"
      @close="showAccountBalanceModal = false"
      @save="handleAccountBalanceSave"
    />

    <AccountHistoryModal
      :isOpen="showAccountHistoryModal"
      :account="selectedHistoryAccount"
      @close="showAccountHistoryModal = false"
    />

    <EnvelopeActionModal
      :isOpen="showEnvelopeActionModal"
      :envelope="selectedActionEnvelope"
      @close="showEnvelopeActionModal = false"
      @add="handleEnvelopeAction('add', $event)"
      @pay="handleEnvelopeAction('pay', $event)"
      @transfer="handleEnvelopeAction('transfer', $event)"
      @withdraw="handleEnvelopeAction('withdraw', $event)"
    />

    <TransferEnvelopeModal
      :isOpen="showTransferModal"
      :submitError="submitError"
      :source="selectedTransferSource"
      :envelopes="envelopes"
      @close="showTransferModal = false"
      @transfer="handleEnvelopeTransfer"
    />

    <PayBillModal
      :isOpen="showPayBillModal"
      :submitError="submitError"
      :bill="selectedBill"
      :title="isDebtPayment ? t('envelopes.payModal.titleDebt') : t('envelopes.payModal.title')"
      @close="showPayBillModal = false"
      @pay="handleBillPay"
    />

    <WithdrawEnvelopeModal
      :isOpen="showWithdrawModal"
      :submitError="submitError"
      :source="selectedWithdrawSource"
      @close="showWithdrawModal = false"
      @withdraw="handleEnvelopeWithdraw"
    />

    <AddFundsModal
      :isOpen="showAddFundsModal"
      :submitError="submitError"
      :envelope="selectedAddFundsEnvelope"
      @close="showAddFundsModal = false"
      @add="handleEnvelopeAddFunds"
    />

    <EnvelopeFormModal
      :isOpen="showEnvelopeModal"
      :submitError="submitError"
      :envelope="selectedEnvelope"
      :accountId="currentAccountIdForEnvelope"
      :availableAccounts="accounts"
      :availableEnvelopes="envelopes"
      :plans="jobs"
      @close="showEnvelopeModal = false"
      @save="handleEnvelopeSave"
      @delete="handleEnvelopeDelete"
    />

    <JobFormModal
      :isOpen="showJobModal"
      :submitError="submitError"
      :job="selectedJob"
      :accountId="currentAccountIdForJob"
      @close="showJobModal = false"
      @save="handleJobSave"
    />

    <DepositPaycheckModal
      :isOpen="showDepositModal"
      :submitError="submitError"
      :job="selectedJobForDeposit"
      :jobs="jobs"
      @close="showDepositModal = false"
      @save="handleDepositPaycheck"
    />
  </div>
</template>

<style scoped>

.dashboard-container {
  background: var(--surface);
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  font-weight: 600;
}

.error-message i {
  font-size: 1.5rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Main Content */
.dashboard-content {
  width: 100%;
}

.section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.btn-add-account {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-add-account:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.section-title i {
  font-size: 1.75rem;
  color: var(--primary);
}

.btn-add-paycheck {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  white-space: nowrap;
}

.btn-add-paycheck:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}
.btn-faq {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--text-primary);
  font-weight: 600;
  text-decoration: none;
}

.btn-faq:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-deposit-paycheck {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

.btn-deposit-paycheck:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-deposit-paycheck:active {
  transform: translateY(0);
}

.btn-deposit-paycheck i {
  font-size: 1.25rem;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Jobs Grid */
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.add-job-card {
  background: white;
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.add-job-card:hover {
  border-color: var(--primary);
  background: var(--surface);
}

.add-job-card i {
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.add-job-card p {
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-create:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.empty-state i {
  font-size: 3rem;
  color: var(--border);
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .btn-deposit-paycheck {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 640px) {
  .dashboard-container {
    padding: 1rem;
  }

  .jobs-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .btn-deposit-paycheck {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
</style>

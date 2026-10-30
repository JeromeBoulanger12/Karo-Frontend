<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import DashboardStats from '../components/DashboardStats.vue'
import AccountCardContainer from '../components/AccountCardContainer.vue'
import JobCard from '../components/JobCard.vue'
import EnvelopeFormModal from '../components/EnvelopeFormModal.vue'
import AccountFormModal from '../components/AccountFormModal.vue'
import AccountBalanceModal from '../components/AccountBalanceModal.vue'
import TransferEnvelopeModal from '../components/TransferEnvelopeModal.vue'
import PayBillModal from '../components/PayBillModal.vue'
import JobFormModal from '../components/JobFormModal.vue'
import DepositPaycheckModal from '../components/DepositPaycheckModal.vue'
import { accountsApi } from '../api/accounts'
import { envelopesApi } from '../api/envelopes'
import { jobsApi } from '../api/jobs'
import { dashboardAPI } from '../api/dashboard'
import '../styles/dashboard.css'

// Helper function for formatting currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(value)
}

const { t } = useI18n()

// Data refs
const accounts = ref<any[]>([])
const envelopes = ref<any[]>([])
const jobs = ref<any[]>([])
const dashboardStats = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Modal refs
const showAccountModal = ref(false)
const showAccountBalanceModal = ref(false)
const showEnvelopeModal = ref(false)
const showTransferModal = ref(false)
const selectedTransferSource = ref<any>(null)
const showPayBillModal = ref(false)
const selectedBill = ref<any>(null)
const showJobModal = ref(false)
const showDepositModal = ref(false)
const selectedAccount = ref<any>(null)
const selectedEnvelope = ref<any>(null)
const selectedJob = ref<any>(null)
const currentAccountIdForEnvelope = ref<string>('')
const currentAccountIdForJob = ref<string>('')
const selectedJobForDeposit = ref<any>(null)
const selectedAccountForBalance = ref<any>(null)

// Computed properties
const totalBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + (acc.latestBalance?.amount ?? acc.latestSnapshot?.amount?.amount ?? 0), 0)
})

const expectedIncome = computed(() => {
  return jobs.value.reduce((sum, job) => sum + (job.amount?.amount ?? 0), 0)
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
  selectedAccount.value = null
  showAccountModal.value = true
}

const openEditAccountModal = (account: any) => {
  selectedAccount.value = account
  showAccountModal.value = true
}

const handleAccountSave = async (accountData: any) => {
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
    showAccountModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error saving account:', err)
  }
}

// Modal handlers - Envelope
const openAddEnvelopeModal = (accountId: string) => {
  selectedEnvelope.value = null
  currentAccountIdForEnvelope.value = accountId
  showEnvelopeModal.value = true
}

const openEditEnvelopeModal = (envelope: any) => {
  selectedEnvelope.value = envelope
  currentAccountIdForEnvelope.value = envelope.homeAccountId
  showEnvelopeModal.value = true
}

const handleEnvelopeSave = async (envelopeData: any) => {
  const { selectedPlanId, planAllocationType, planFixedAmount, planPercentage, ...payload } = envelopeData
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

    showEnvelopeModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error saving envelope:', err)
  }
}

const handleEnvelopeDelete = async (envelopeId: string) => {
  try {
    await envelopesApi.deleteEnvelope(envelopeId)
    showEnvelopeModal.value = false
    // Reload so the removed rule also disappears from the plans
    await loadDashboard()
  } catch (err) {
    console.error('Error deleting envelope:', err)
  }
}

// Bill paid: the modal asks for the amount, then the backend withdraws it from the envelope
// and debits the home account in one transaction
const openPayBillModal = (envelope: any) => {
  if (!(envelope.balance?.amount > 0)) return
  selectedBill.value = envelope
  showPayBillModal.value = true
}

const handleBillPay = async (amount: number) => {
  if (!selectedBill.value?.id) return
  try {
    await envelopesApi.pay(selectedBill.value.id, amount)
    showPayBillModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error marking bill as paid:', err)
  }
}

// Transfer money from one envelope to another (no account balance change)
const openTransferModal = (envelope: any) => {
  selectedTransferSource.value = envelope
  showTransferModal.value = true
}

const handleEnvelopeTransfer = async (payload: { toEnvelopeId: string; amount: number; memo?: string }) => {
  if (!selectedTransferSource.value?.id) return
  try {
    await envelopesApi.transfer(selectedTransferSource.value.id, {
      targetEnvelopeId: payload.toEnvelopeId,
      amount: payload.amount,
      memo: payload.memo
    })
    showTransferModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error transferring between envelopes:', err)
  }
}

// Modal handlers - Job
const openAddJobModal = (accountId: string = '') => {
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
  selectedJob.value = job
  currentAccountIdForJob.value = job.homeAccountId
  showJobModal.value = true
}

const handleJobSave = async (jobData: any) => {
  try {
    if (selectedJob.value?.id) {
      // Edit existing - Backend doesn't support yet
      console.warn('Job update not yet supported by backend. Only creation is available.')
      // TODO: Implement updatePlan when backend supports it
      return
    } else {
      // Create new
      console.log('handleJobSave - Job data from form:', jobData)
      await jobsApi.createPlan(jobData)
    }
    showJobModal.value = false
    await loadDashboard()
  } catch (err: any) {
    console.error('Error saving job:', err)
    console.error('Error response:', err.response?.data)
    error.value = err.response?.data?.message || err.message || 'Error saving job'
  }
}

// Load data
const loadDashboard = async () => {
  loading.value = true
  error.value = ''
  try {
    // Fetch all data in parallel
    const [accountsRes, envelopesRes, jobsRes, statsRes] = await Promise.all([
      accountsApi.listAccounts().catch(() => ({ data: [] })),
      envelopesApi.listEnvelopes().catch(() => ({ data: [] })),
      jobsApi.listJobs?.().catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
      dashboardAPI.getUserDashboard().catch(() => ({}))
    ])

    accounts.value = accountsRes.data || []
    envelopes.value = envelopesRes.data || []
    jobs.value = jobsRes.data || []
    dashboardStats.value = statsRes || {}

    // Enrich jobs with account names
    jobs.value = jobs.value.map(job => ({
      ...job,
      accountName: accounts.value.find(a => a.id === job.homeAccountId)?.name || 'Account'
    }))

    // The plan has no amount of its own: take the last distributed paycheck from its history
    // (events are returned oldest first)
    jobs.value = await Promise.all(jobs.value.map(async job => {
      const events = await jobsApi.listEvents(job.id).then(res => res.data || []).catch(() => [])
      const last = events[events.length - 1]
      return {
        ...job,
        lastPaycheck: last ? { amount: last.amount, date: last.occurredAt } : null
      }
    }))
  } catch (err: any) {
    error.value = err?.message || t('common.errorLoading') || 'Erreur lors du chargement'
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
  selectedJobForDeposit.value = job || null
  showDepositModal.value = true
}

const handleDepositPaycheck = async (depositData: any) => {
  try {
    if (selectedJobForDeposit.value?.id) {
      // Distribute paycheck to the selected job
      await jobsApi.distributePaycheck(selectedJobForDeposit.value.id, {
        amount: depositData.amount,
        receivedAt: new Date(depositData.date).toISOString(),
        accountBalance: depositData.accountBalance
      })
    }
    showDepositModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error depositing paycheck:', err)
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
const openAccountBalanceModal = (account: any) => {
  selectedAccountForBalance.value = account
  showAccountBalanceModal.value = true
}

const handleAccountBalanceSave = async (newBalance: number) => {
  try {
    if (selectedAccountForBalance.value?.id) {
      await accountsApi.updateAccount(selectedAccountForBalance.value.id, {
        name: selectedAccountForBalance.value.name,
        newBalance: newBalance
      })
    }
    showAccountBalanceModal.value = false
    await loadDashboard()
  } catch (err) {
    console.error('Error updating account balance:', err)
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
      <button class="btn-retry" @click="loadDashboard">{{ t('common.retry') || 'Réessayer' }}</button>
    </div>

    <!-- Main content -->
    <div v-else class="dashboard-content">
      <!-- Page Header -->
      <PageHeader
        :title="t('dashboard.title') || 'Tableau de bord'"
        :subtitle="`Solde total: ${formatCurrency(totalBalance)} • Enveloppes: ${envelopes.length} • Paie: ${jobs.length}`"
        :tierBadge="tierBadge"
      >
        <template #actions>
          <button class="btn-deposit-paycheck" @click="openDepositPaycheckModal">
            <i class="mdi mdi-plus-circle"></i>
            Déposer une paie
          </button>
        </template>
      </PageHeader>

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
          <p>{{ t('dashboard.noAccounts') || 'Aucun compte' }}</p>
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
            @add-envelope="openAddEnvelopeModal($event)"
            @edit-envelope="openEditEnvelopeModal($event)"
            @pay-envelope="openPayBillModal($event)"
            @transfer-envelope="openTransferModal($event)"
            @edit-account="openEditAccountModal($event)"
            @edit-balance="openAccountBalanceModal($event)"
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
      :account="selectedAccount"
      @close="showAccountModal = false"
      @save="handleAccountSave"
    />

    <AccountBalanceModal
      :isOpen="showAccountBalanceModal"
      :account="selectedAccountForBalance"
      @close="showAccountBalanceModal = false"
      @save="handleAccountBalanceSave"
    />

    <TransferEnvelopeModal
      :isOpen="showTransferModal"
      :source="selectedTransferSource"
      :envelopes="envelopes"
      @close="showTransferModal = false"
      @transfer="handleEnvelopeTransfer"
    />

    <PayBillModal
      :isOpen="showPayBillModal"
      :bill="selectedBill"
      @close="showPayBillModal = false"
      @pay="handleBillPay"
    />

    <EnvelopeFormModal
      :isOpen="showEnvelopeModal"
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
      :job="selectedJob"
      :accountId="currentAccountIdForJob"
      @close="showJobModal = false"
      @save="handleJobSave"
    />

    <DepositPaycheckModal
      :isOpen="showDepositModal"
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

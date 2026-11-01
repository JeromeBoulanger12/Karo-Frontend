<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { accountsApi } from '../api/accounts'

const { t } = useI18n()

interface Account {
  id: string
  name: string
}

interface Snapshot {
  id: string
  amount: { amount: number; currency: string }
  capturedAt: string
  note?: string | null
}

interface Row extends Snapshot {
  delta: number | null
  isPeak: boolean
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  account?: Account | null
}>(), {
  isOpen: false,
  account: null
})

const emit = defineEmits<{
  close: []
}>()

// How many of the biggest movements to flag as peaks
const PEAK_COUNT = 3
// Whole history: the endpoint returns the last N days
const HISTORY_DAYS = 365

const loading = ref(false)
const error = ref('')
const snapshots = ref<Snapshot[]>([])

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })

// Chronological rows with the change since the previous snapshot, then the biggest movements flagged
const rows = computed<Row[]>(() => {
  const sorted = [...snapshots.value].sort((a, b) =>
    new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  )
  const withDelta = sorted.map((snap, index) => ({
    ...snap,
    delta: index === 0 ? null : snap.amount.amount - sorted[index - 1].amount.amount,
    isPeak: false
  }))

  const biggest = withDelta
    .filter(row => row.delta !== null && row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, PEAK_COUNT)
  biggest.forEach(row => { row.isPeak = true })

  // Newest first for reading
  return withDelta.reverse()
})

const loadHistory = async () => {
  if (!props.account?.id) return
  loading.value = true
  error.value = ''
  try {
    const response = await accountsApi.getAccountBalanceHistory(props.account.id, HISTORY_DAYS)
    snapshots.value = response.data as Snapshot[]
  } catch (err) {
    console.error('Error loading balance history:', err)
    error.value = t('dashboard.balanceHistory.error')
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, (open) => {
  if (open) loadHistory()
})

const deltaClass = (delta: number | null) => {
  if (delta === null || delta === 0) return ''
  return delta > 0 ? 'delta-up' : 'delta-down'
}

const formatDelta = (delta: number | null) => {
  if (delta === null) return '—'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${formatCurrency(delta)}`
}
</script>

<template>
  <div v-if="isOpen && account" class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ t('dashboard.balanceHistory.title', { name: account.name }) }}</h2>
        <button class="modal-close" @click="emit('close')">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <div class="modal-body">
        <p v-if="loading" class="hint">{{ t('dashboard.balanceHistory.loading') }}</p>
        <p v-else-if="error" class="error-text">{{ error }}</p>
        <p v-else-if="rows.length === 0" class="hint">{{ t('dashboard.balanceHistory.empty') }}</p>

        <table v-else class="history-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.balanceHistory.date') }}</th>
              <th class="num">{{ t('dashboard.balanceHistory.balance') }}</th>
              <th class="num">{{ t('dashboard.balanceHistory.change') }}</th>
              <th>{{ t('dashboard.balanceHistory.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" :class="{ 'is-peak': row.isPeak }">
              <td>{{ formatDate(row.capturedAt) }}</td>
              <td class="num">{{ formatCurrency(row.amount.amount) }}</td>
              <td class="num" :class="deltaClass(row.delta)">
                {{ formatDelta(row.delta) }}
                <span v-if="row.isPeak" class="peak-badge">{{ t('dashboard.balanceHistory.peak') }}</span>
              </td>
              <td class="note">{{ row.note || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="emit('close')">{{ t('dashboard.balanceHistory.close') }}</button>
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
  max-width: 720px;
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
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.history-table th,
.history-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.history-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.num {
  text-align: right;
  white-space: nowrap;
}

.note {
  color: var(--text-muted);
}

.delta-up {
  color: var(--success);
}

.delta-down {
  color: var(--danger);
}

.is-peak {
  background: var(--surface);
}

.peak-badge {
  margin-left: 0.5rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: var(--warning);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.hint {
  margin: 0;
  color: var(--text-muted);
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  background: white;
  color: var(--primary);
  border: 1px solid var(--border);
}
</style>

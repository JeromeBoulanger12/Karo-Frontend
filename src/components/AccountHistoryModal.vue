<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
} from 'chart.js'
import { accountsApi } from '../api/accounts'
import { surplusStats, type SurplusPoint } from '../utils/surplus'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

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
// Surplus window: how far back the surplus chart and its summary look
const SURPLUS_DAYS = 90

const loading = ref(false)
const error = ref('')
const snapshots = ref<Snapshot[]>([])
const surplusPoints = ref<SurplusPoint[]>([])

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })

const stats = computed(() => surplusStats(surplusPoints.value))

// Step line: each surplus holds until the next observation or envelope movement. Red where in deficit
const surplusChart = computed(() => {
  const isDeficit = (value: number) => value < 0
  return {
    data: {
      labels: surplusPoints.value.map(p => formatShortDate(p.capturedAt)),
      datasets: [{
        label: t('dashboard.balanceHistory.surplusLabel'),
        data: surplusPoints.value.map(p => p.surplus),
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        stepped: 'after' as const,
        pointRadius: 2,
        segment: {
          borderColor: (ctx: { p0: { parsed: { y: number } }; p1: { parsed: { y: number } } }) =>
            isDeficit(ctx.p0.parsed.y) || isDeficit(ctx.p1.parsed.y) ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (context: { parsed: { y: number } }) => formatCurrency(context.parsed.y)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 10 }, color: '#9ca3af', callback: (value: number | string) => '$' + (Number(value) / 1000).toFixed(0) + 'k' }
        }
      }
    }
  }
})

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
    const [balanceRes, surplusRes] = await Promise.all([
      accountsApi.getAccountBalanceHistory(props.account.id, HISTORY_DAYS),
      accountsApi.getAccountSurplusHistory(props.account.id, SURPLUS_DAYS)
    ])
    snapshots.value = balanceRes.data as Snapshot[]
    surplusPoints.value = surplusRes.data as SurplusPoint[]
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

        <template v-else>
          <section class="surplus-section">
            <h3>{{ t('dashboard.balanceHistory.surplusTitle', { days: SURPLUS_DAYS }) }}</h3>
            <template v-if="stats">
              <p class="surplus-summary">
                <span class="summary-item">
                  {{ t('dashboard.balanceHistory.percentInSurplus', { percent: stats.percentInSurplus }) }}
                </span>
                <span class="summary-item" :class="stats.lowest.surplus < 0 ? 'delta-down' : ''">
                  {{ t('dashboard.balanceHistory.lowest', { amount: formatCurrency(stats.lowest.surplus), date: formatDate(stats.lowest.capturedAt) }) }}
                </span>
                <span class="summary-item" :class="stats.current.surplus < 0 ? 'delta-down' : 'delta-up'">
                  {{ t('dashboard.balanceHistory.current', { amount: formatCurrency(stats.current.surplus) }) }}
                </span>
              </p>
              <Line :data="surplusChart.data" :options="surplusChart.options" />
            </template>
            <p v-else class="hint">{{ t('dashboard.balanceHistory.surplusEmpty') }}</p>
          </section>

        <table class="history-table">
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
        </template>
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

.surplus-section {
  margin-bottom: 1.5rem;
}

.surplus-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.surplus-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
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

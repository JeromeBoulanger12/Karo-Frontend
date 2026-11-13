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
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableLineSegmentContext,
  type TooltipItem
} from 'chart.js'
import { accountsApi } from '../api/accounts'
import { averageSurplusAt, movingAverageSeries, surplusStats, type SurplusPoint } from '../utils/surplus'
import { showsSurplus } from '../utils/accounts'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip)

const { t, locale } = useI18n()

interface Account {
  id: string
  name: string
  type?: string
}

interface Snapshot {
  id: string
  amount: { amount: number; currency: string }
  capturedAt: string
  note?: string | null
  // 'Manual' balances can be corrected or deleted; the others are written by the app
  source?: string
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
  // A balance was corrected or deleted: the parent reloads the account's balance
  changed: []
}>()

// How many of the biggest movements to flag as peaks
const PEAK_COUNT = 3
// Whole history: the endpoint returns the last N days
const HISTORY_DAYS = 365
// Trend window choices for the chart and its summary
const TREND_PERIODS = [30, 90, 365]

const loading = ref(false)
const error = ref('')
const snapshots = ref<Snapshot[]>([])
const surplusPoints = ref<SurplusPoint[]>([])
const trendDays = ref(90)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CAD' }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })

const stats = computed(() => surplusStats(surplusPoints.value))

// Moving average of the surplus, time-weighted over the chosen window (7, 14 or 30 days)
const MA_WINDOWS = [7, 14, 30]
const maWindowDays = ref(14)
const DAY_MS = 24 * 60 * 60 * 1000

const movingAverage = computed(() =>
  movingAverageSeries(surplusPoints.value, maWindowDays.value * DAY_MS)
)

// Latest average against the average one window earlier: the direction the surplus is heading
const maSummary = computed(() => {
  const windowMs = maWindowDays.value * DAY_MS
  const now = Date.now()
  const latest = averageSurplusAt(surplusPoints.value, now, windowMs)
  const earlier = averageSurplusAt(surplusPoints.value, now - windowMs, windowMs)
  if (latest === null) return null
  const change = earlier === null ? null : latest - earlier
  return { latest, change }
})

// Step lines: each value holds until the next observation or envelope movement.
// The surplus line turns red wherever it is in deficit
const trendChart = computed((): { data: ChartData<'line', (number | null)[]>; options: ChartOptions<'line'> } => {
  const isDeficit = (value: number | null) => value !== null && value < 0
  const points = surplusPoints.value
  return {
    data: {
      labels: points.map(p => formatShortDate(p.capturedAt)),
      datasets: [
        {
          label: t('dashboard.balanceHistory.balanceLabel'),
          data: points.map(p => p.balance),
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          stepped: 'after' as const,
          pointRadius: 0
        },
        {
          label: t('dashboard.balanceHistory.envelopesLabel'),
          data: points.map(p => p.envelopesTotal),
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 2,
          stepped: 'after' as const,
          pointRadius: 0
        },
        {
          label: t('dashboard.balanceHistory.maLabel', { days: maWindowDays.value }),
          data: movingAverage.value,
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
          borderDash: [6, 4],
          stepped: false,
          pointRadius: 0,
          spanGaps: true
        },
        {
          label: t('dashboard.balanceHistory.surplusLabel'),
          data: points.map(p => p.surplus),
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2.5,
          stepped: 'after' as const,
          pointRadius: 0,
          segment: {
            borderColor: (ctx: ScriptableLineSegmentContext) =>
              isDeficit(ctx.p0.parsed.y) || isDeficit(ctx.p1.parsed.y) ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) =>
              `${context.dataset.label}: ${context.parsed.y === null ? '—' : formatCurrency(context.parsed.y)}`
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

const loadTrend = async () => {
  if (!props.account?.id) return
  try {
    const response = await accountsApi.getAccountSurplusHistory(props.account.id, trendDays.value)
    surplusPoints.value = response.data as SurplusPoint[]
  } catch (err) {
    console.error('Error loading surplus history:', err)
    error.value = t('dashboard.balanceHistory.error')
  }
}

const loadHistory = async () => {
  if (!props.account?.id) return
  loading.value = true
  error.value = ''
  try {
    const [balanceRes] = await Promise.all([
      accountsApi.getAccountBalanceHistory(props.account.id, HISTORY_DAYS),
      loadTrend()
    ])
    snapshots.value = balanceRes.data as Snapshot[]
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

// Changing the period only reloads the trend, not the balance list
watch(trendDays, () => {
  loadTrend()
})

// Correcting or deleting a balance entered by mistake
const editingId = ref<string | null>(null)
const editOriginal = ref<Snapshot | null>(null)
const editForm = ref({ date: '', amount: 0, note: '' })
const zeroConfirmed = ref(false)
const confirmDeleteId = ref<string | null>(null)
const saving = ref(false)
const actionError = ref('')

const isManual = (row: Row) => row.source === 'Manual'

const toDateInput = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Setting a balance to 0 is often a typing mistake: it must be confirmed once before saving
const needsZeroConfirmation = computed(() =>
  editForm.value.amount === 0 && (editOriginal.value?.amount.amount ?? 0) !== 0
)
watch(() => editForm.value.amount, () => { zeroConfirmed.value = false })

const startEdit = (row: Row) => {
  confirmDeleteId.value = null
  zeroConfirmed.value = false
  actionError.value = ''
  editOriginal.value = row
  editingId.value = row.id
  editForm.value = { date: toDateInput(row.capturedAt), amount: row.amount.amount, note: row.note ?? '' }
}

const cancelEdit = () => {
  editingId.value = null
  editOriginal.value = null
  zeroConfirmed.value = false
}

// Keeps the original time when the day is unchanged; a new day is saved at noon, local time
const capturedAtFor = (row: Snapshot, date: string) => {
  if (date === toDateInput(row.capturedAt)) return row.capturedAt
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12).toISOString()
}

const saveEdit = async (row: Row) => {
  if (needsZeroConfirmation.value && !zeroConfirmed.value) {
    zeroConfirmed.value = true
    return
  }
  if (!props.account?.id) return

  saving.value = true
  actionError.value = ''
  try {
    await accountsApi.correctBalanceSnapshot(props.account.id, row.id, {
      amount: editForm.value.amount,
      capturedAt: capturedAtFor(row, editForm.value.date),
      note: editForm.value.note.trim() || undefined
    })
    cancelEdit()
    await loadHistory()
    emit('changed')
  } catch (err) {
    console.error('Error correcting balance:', err)
    actionError.value = t('dashboard.balanceHistory.saveError')
  } finally {
    saving.value = false
  }
}

const deleteRow = async (row: Row) => {
  // First click asks for confirmation in the row, second click deletes
  if (confirmDeleteId.value !== row.id) {
    confirmDeleteId.value = row.id
    return
  }
  if (!props.account?.id) return

  saving.value = true
  actionError.value = ''
  try {
    await accountsApi.deleteBalanceSnapshot(props.account.id, row.id)
    confirmDeleteId.value = null
    await loadHistory()
    emit('changed')
  } catch (err) {
    console.error('Error deleting balance:', err)
    actionError.value = t('dashboard.balanceHistory.saveError')
  } finally {
    saving.value = false
  }
}

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
          <section v-if="showsSurplus(account.type)" class="surplus-section">
            <div class="trend-header">
              <h3>{{ t('dashboard.balanceHistory.trendTitle') }}</h3>
              <select v-model.number="trendDays" class="trend-period" :aria-label="t('dashboard.balanceHistory.period')">
                <option v-for="days in TREND_PERIODS" :key="days" :value="days">
                  {{ t('dashboard.balanceHistory.periodDays', { days }) }}
                </option>
              </select>
              <select v-model.number="maWindowDays" class="trend-period" :aria-label="t('dashboard.balanceHistory.maWindow')">
                <option v-for="days in MA_WINDOWS" :key="days" :value="days">
                  {{ t('dashboard.balanceHistory.maWindowDays', { days }) }}
                </option>
              </select>
            </div>
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
                <span v-if="maSummary" class="summary-item" :class="{ 'delta-up': (maSummary.change ?? 0) > 0, 'delta-down': (maSummary.change ?? 0) < 0 }">
                  {{ t('dashboard.balanceHistory.maValue', { days: maWindowDays, amount: formatCurrency(maSummary.latest) }) }}
                  <template v-if="maSummary.change !== null">
                    · {{ t(Math.abs(maSummary.change) < 1 ? 'dashboard.balanceHistory.maFlat' : (maSummary.change > 0 ? 'dashboard.balanceHistory.maUp' : 'dashboard.balanceHistory.maDown'), { amount: formatCurrency(Math.abs(maSummary.change)), days: maWindowDays }) }}
                  </template>
                </span>
              </p>
              <Line :data="trendChart.data" :options="trendChart.options" />
            </template>
            <p v-else class="hint">{{ t('dashboard.balanceHistory.surplusEmpty') }}</p>
          </section>

        <p v-if="actionError" class="error-text">{{ actionError }}</p>

        <table class="history-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.balanceHistory.date') }}</th>
              <th class="num">{{ t('dashboard.balanceHistory.balance') }}</th>
              <th class="num">{{ t('dashboard.balanceHistory.change') }}</th>
              <th>{{ t('dashboard.balanceHistory.note') }}</th>
              <th class="actions"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr v-if="editingId !== row.id" :class="{ 'is-peak': row.isPeak }">
                <td>{{ formatDate(row.capturedAt) }}</td>
                <td class="num">{{ formatCurrency(row.amount.amount) }}</td>
                <td class="num" :class="deltaClass(row.delta)">
                  {{ formatDelta(row.delta) }}
                  <span v-if="row.isPeak" class="peak-badge">{{ t('dashboard.balanceHistory.peak') }}</span>
                </td>
                <td class="note">{{ row.note || '' }}</td>
                <td class="actions">
                  <template v-if="isManual(row)">
                    <template v-if="confirmDeleteId === row.id">
                      <button type="button" class="row-action danger" :disabled="saving" @click="deleteRow(row)">
                        {{ t('dashboard.balanceHistory.yes') }}
                      </button>
                      <button type="button" class="row-action" @click="confirmDeleteId = null">
                        {{ t('dashboard.balanceHistory.no') }}
                      </button>
                    </template>
                    <template v-else>
                      <button type="button" class="row-action" :title="t('dashboard.balanceHistory.edit')" @click="startEdit(row)">
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                      <button type="button" class="row-action danger" :title="t('dashboard.balanceHistory.delete')" @click="deleteRow(row)">
                        <i class="mdi mdi-trash-can-outline"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>

              <tr v-else class="edit-row">
                <td colspan="5">
                  <div class="edit-fields">
                    <input v-model="editForm.date" type="date" :aria-label="t('dashboard.balanceHistory.date')" />
                    <input v-model.number="editForm.amount" type="number" step="0.01" :aria-label="t('dashboard.balanceHistory.balance')" />
                    <input v-model="editForm.note" type="text" maxlength="500" :placeholder="t('accountBalance.notePlaceholder')" />
                  </div>
                  <p v-if="needsZeroConfirmation && zeroConfirmed" class="zero-warning">
                    {{ t('accountBalance.zeroWarning') }}
                  </p>
                  <div class="edit-actions">
                    <button type="button" class="btn-secondary" @click="cancelEdit">{{ t('common.cancel') }}</button>
                    <button type="button" class="btn-primary" :disabled="saving" @click="saveEdit(row)">
                      {{ needsZeroConfirmation && zeroConfirmed ? t('accountBalance.confirmZero') : t('common.save') }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>
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
  margin: 0;
  font-size: 1rem;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.trend-period {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
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

.history-table .actions {
  width: 1%;
  white-space: nowrap;
}

.row-action {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  font-size: 1rem;
}

.row-action:hover {
  color: var(--text-primary);
}

.row-action.danger:hover {
  color: var(--danger);
}

.edit-row td {
  background: var(--surface);
}

.edit-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.edit-fields input {
  flex: 1;
  min-width: 120px;
  padding: 0.4rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  color: var(--text-primary);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.zero-warning {
  color: var(--danger);
  font-size: 0.875rem;
  margin: var(--space-sm) 0 0;
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

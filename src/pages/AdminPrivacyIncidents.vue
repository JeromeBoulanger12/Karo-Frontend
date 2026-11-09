<template>
  <div class="incidents-container">
    <div class="page-header">
      <div>
        <h1>{{ t('privacyIncidents.header.title') }}</h1>
        <p class="subtitle">
          {{ t('privacyIncidents.header.subtitle') }}
        </p>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <i class="mdi mdi-plus"></i>
        {{ t('privacyIncidents.header.record') }}
      </button>
    </div>

    <p v-if="message" class="message" :class="messageKind">{{ message }}</p>

    <div v-if="loading" class="loading">{{ t('privacyIncidents.header.loading') }}</div>

    <div v-else-if="incidents.length === 0" class="card empty">
      {{ t('privacyIncidents.header.empty') }}
    </div>

    <div v-else class="card table-card">
      <table>
        <thead>
          <tr>
            <th>{{ t('privacyIncidents.table.detectedAt') }}</th>
            <th>{{ t('privacyIncidents.table.description') }}</th>
            <th>{{ t('privacyIncidents.table.seriousRisk') }}</th>
            <th>{{ t('privacyIncidents.table.cai') }}</th>
            <th>{{ t('privacyIncidents.table.people') }}</th>
            <th>{{ t('privacyIncidents.table.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="incident in incidents"
            :key="incident.id"
            :class="{ selected: incident.id === selectedId }"
            @click="selectedId = incident.id"
          >
            <td>{{ formatDate(incident.detectedAt) }}</td>
            <td class="description-cell">{{ incident.description }}</td>
            <td>
              <span class="badge" :class="riskClass(incident)">{{ riskLabel(incident) }}</span>
            </td>
            <td>{{ incident.caiNotifiedAt ? formatDate(incident.caiNotifiedAt) : '—' }}</td>
            <td>{{ incident.affectedPeopleNotifiedAt ? formatDate(incident.affectedPeopleNotifiedAt) : '—' }}</td>
            <td>
              <span class="badge" :class="incident.closedAt ? 'closed' : 'open'">
                {{ incident.closedAt ? t('privacyIncidents.status.closed') : t('privacyIncidents.status.open') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail of the selected incident -->
    <div v-if="selected" class="card detail">
      <div class="detail-header">
        <h2>{{ t('privacyIncidents.detail.title', { date: formatDate(selected.detectedAt) }) }}</h2>
        <button v-if="!selected.closedAt" class="btn btn-secondary" @click="openEdit(selected)">
          <i class="mdi mdi-pencil"></i>
          {{ t('privacyIncidents.detail.edit') }}
        </button>
      </div>

      <dl class="facts">
        <dt>{{ t('privacyIncidents.facts.description') }}</dt>
        <dd>{{ selected.description }}</dd>
        <dt>{{ t('privacyIncidents.facts.personalInformation') }}</dt>
        <dd>{{ selected.personalInformation }}</dd>
        <dt>{{ t('privacyIncidents.facts.occurredAt') }}</dt>
        <dd>{{ selected.occurredAt ? formatDate(selected.occurredAt) : t('privacyIncidents.facts.unknownDate') }}</dd>
        <dt>{{ t('privacyIncidents.facts.affectedCount') }}</dt>
        <dd>{{ selected.affectedPeopleCount ?? t('privacyIncidents.facts.unknownCount') }}</dd>
        <dt>{{ t('privacyIncidents.facts.containment') }}</dt>
        <dd>{{ selected.containmentMeasures || '—' }}</dd>
      </dl>

      <!-- Risk assessment -->
      <section class="step">
        <h3>{{ t('privacyIncidents.assessment.title') }}</h3>
        <template v-if="selected.riskOfSeriousInjury !== null">
          <p>
            <span class="badge" :class="riskClass(selected)">{{ riskLabel(selected) }}</span>
          </p>
          <p v-if="selected.assessmentNotes" class="notes">{{ selected.assessmentNotes }}</p>
        </template>
        <template v-else-if="!selected.closedAt">
          <div class="radio-row">
            <label><input v-model="assessRisk" type="radio" value="yes" /> {{ t('privacyIncidents.assessment.yes') }}</label>
            <label><input v-model="assessRisk" type="radio" value="no" /> {{ t('privacyIncidents.assessment.no') }}</label>
          </div>
          <textarea v-model="assessNotes" rows="3" maxlength="2000" :placeholder="t('privacyIncidents.assessment.notesPlaceholder')"></textarea>
          <button class="btn btn-secondary" :disabled="!assessRisk" @click="assess">{{ t('privacyIncidents.assessment.save') }}</button>
        </template>
        <p v-else class="muted">{{ t('privacyIncidents.assessment.notAssessed') }}</p>
      </section>

      <!-- Notifications -->
      <section class="step">
        <h3>{{ t('privacyIncidents.notices.title') }}</h3>
        <div class="notify-row">
          <span>{{ t('privacyIncidents.notices.cai') }}</span>
          <strong v-if="selected.caiNotifiedAt">{{ t('privacyIncidents.notices.sentOn', { date: formatDate(selected.caiNotifiedAt) }) }}</strong>
          <button
            v-else-if="!selected.closedAt"
            class="btn btn-secondary"
            @click="runAction(() => adminPrivacyIncidentsApi.notifyCai(selected!.id), t('privacyIncidents.message.caiNotified'))"
          >
            {{ t('privacyIncidents.notices.markSent') }}
          </button>
          <span v-else class="muted">{{ t('privacyIncidents.notices.notSent') }}</span>
        </div>
        <div class="notify-row">
          <span>{{ t('privacyIncidents.notices.affectedPeople') }}</span>
          <strong v-if="selected.affectedPeopleNotifiedAt">{{ t('privacyIncidents.notices.sentOn', { date: formatDate(selected.affectedPeopleNotifiedAt) }) }}</strong>
          <button
            v-else-if="!selected.closedAt"
            class="btn btn-secondary"
            @click="runAction(() => adminPrivacyIncidentsApi.notifyAffectedPeople(selected!.id), t('privacyIncidents.message.peopleNotified'))"
          >
            {{ t('privacyIncidents.notices.markSent') }}
          </button>
          <span v-else class="muted">{{ t('privacyIncidents.notices.notSent') }}</span>
        </div>
        <p class="hint">{{ t('privacyIncidents.notices.hint') }}</p>
      </section>

      <!-- Closing -->
      <section class="step">
        <h3>{{ t('privacyIncidents.closing.title') }}</h3>
        <template v-if="!selected.closedAt">
          <p v-if="selected.riskOfSeriousInjury === null" class="hint">{{ t('privacyIncidents.closing.assessFirst') }}</p>
          <p v-else-if="selected.riskOfSeriousInjury && (!selected.caiNotifiedAt || !selected.affectedPeopleNotifiedAt)" class="hint">
            {{ t('privacyIncidents.closing.noticesRequired') }}
          </p>
          <button
            class="btn btn-primary"
            :disabled="selected.riskOfSeriousInjury === null"
            @click="closeIncident"
          >
            {{ t('privacyIncidents.closing.close') }}
          </button>
        </template>
        <p v-else>{{ t('privacyIncidents.closing.closedOn', { date: formatDate(selected.closedAt) }) }}</p>
      </section>
    </div>

    <!-- Record or edit the facts -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <form class="card modal" @submit.prevent="submitFacts">
        <h2>{{ editing ? t('privacyIncidents.detail.edit') : t('privacyIncidents.header.record') }}</h2>

        <label>{{ t('privacyIncidents.form.description') }}
          <textarea v-model="form.description" rows="3" maxlength="2000" required></textarea>
        </label>
        <label>{{ t('privacyIncidents.facts.personalInformation') }}
          <input v-model="form.personalInformation" type="text" maxlength="1000" required :placeholder="t('privacyIncidents.form.personalPlaceholder')" />
        </label>
        <label>{{ t('privacyIncidents.form.occurredAt') }}
          <input v-model="form.occurredAt" type="datetime-local" />
        </label>
        <label>{{ t('privacyIncidents.form.affectedCount') }}
          <input v-model="form.affectedPeopleCount" type="number" min="0" />
        </label>
        <label>{{ t('privacyIncidents.facts.containment') }}
          <textarea v-model="form.containmentMeasures" rows="2" maxlength="2000"></textarea>
        </label>

        <p v-if="formError" class="message error">{{ formError }}</p>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click="showForm = false">{{ t('privacyIncidents.form.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('privacyIncidents.form.saving') : t('privacyIncidents.form.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  adminPrivacyIncidentsApi,
  type IncidentFacts,
  type PrivacyIncident
} from '../api/adminPrivacyIncidents'

interface FactsForm {
  description: string
  personalInformation: string
  occurredAt: string
  affectedPeopleCount: string
  containmentMeasures: string
}

const { t, locale } = useI18n()

const incidents = ref<PrivacyIncident[]>([])
const loading = ref(true)
const selectedId = ref<string | null>(null)
const selected = computed(() => incidents.value.find(i => i.id === selectedId.value) ?? null)

const message = ref('')
const messageKind = ref<'ok' | 'error'>('ok')

const showForm = ref(false)
const editing = ref<PrivacyIncident | null>(null)
const form = ref<FactsForm>(emptyForm())
const formError = ref('')
const saving = ref(false)

const assessRisk = ref<'yes' | 'no' | ''>('')
const assessNotes = ref('')

function emptyForm(): FactsForm {
  return { description: '', personalInformation: '', occurredAt: '', affectedPeopleCount: '', containmentMeasures: '' }
}

// Values for the inputs, from a stored incident. datetime-local expects local time without a zone
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
}

function riskLabel(incident: PrivacyIncident): string {
  if (incident.riskOfSeriousInjury === null) return t('privacyIncidents.risk.notAssessed')
  return incident.riskOfSeriousInjury ? t('privacyIncidents.risk.yes') : t('privacyIncidents.risk.no')
}

function riskClass(incident: PrivacyIncident): string {
  if (incident.riskOfSeriousInjury === null) return 'neutral'
  return incident.riskOfSeriousInjury ? 'danger' : 'ok'
}

function showMessage(text: string, kind: 'ok' | 'error' = 'ok') {
  message.value = text
  messageKind.value = kind
}

function errorText(error: any): string {
  return error?.response?.data?.message ?? t('privacyIncidents.error.generic')
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminPrivacyIncidentsApi.list()
    incidents.value = data
    if (selectedId.value && !data.some(i => i.id === selectedId.value)) selectedId.value = null
  } catch (error) {
    showMessage(errorText(error), 'error')
  } finally {
    loading.value = false
  }
}

function openNew() {
  editing.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(incident: PrivacyIncident) {
  editing.value = incident
  form.value = {
    description: incident.description,
    personalInformation: incident.personalInformation,
    occurredAt: toLocalInput(incident.occurredAt),
    affectedPeopleCount: incident.affectedPeopleCount?.toString() ?? '',
    containmentMeasures: incident.containmentMeasures ?? ''
  }
  formError.value = ''
  showForm.value = true
}

async function submitFacts() {
  formError.value = ''
  saving.value = true

  const facts: IncidentFacts = {
    occurredAt: form.value.occurredAt ? new Date(form.value.occurredAt).toISOString() : null,
    description: form.value.description.trim(),
    personalInformation: form.value.personalInformation.trim(),
    affectedPeopleCount: form.value.affectedPeopleCount === '' ? null : Number(form.value.affectedPeopleCount),
    containmentMeasures: form.value.containmentMeasures.trim() || null
  }

  try {
    const { data } = editing.value
      ? await adminPrivacyIncidentsApi.update(editing.value.id, facts)
      : await adminPrivacyIncidentsApi.record(facts)
    showForm.value = false
    await load()
    selectedId.value = data.id
    showMessage(editing.value ? t('privacyIncidents.message.factsEdited') : t('privacyIncidents.message.incidentRecorded'))
  } catch (error) {
    formError.value = errorText(error)
  } finally {
    saving.value = false
  }
}

// Runs one change to the selected incident, then shows the result and reloads the register
async function runAction(action: () => Promise<{ data: PrivacyIncident }>, okText: string) {
  try {
    await action()
    await load()
    showMessage(okText)
  } catch (error) {
    showMessage(errorText(error), 'error')
  }
}

async function assess() {
  if (!selected.value || !assessRisk.value) return
  const incidentId = selected.value.id
  const risk = assessRisk.value === 'yes'
  const notes = assessNotes.value.trim() || null
  await runAction(() => adminPrivacyIncidentsApi.assess(incidentId, risk, notes), t('privacyIncidents.message.assessed'))
  assessRisk.value = ''
  assessNotes.value = ''
}

async function closeIncident() {
  if (!selected.value) return
  if (!window.confirm(t('privacyIncidents.confirm.close'))) return
  const incidentId = selected.value.id
  await runAction(() => adminPrivacyIncidentsApi.close(incidentId), t('privacyIncidents.message.closed'))
}

onMounted(load)
</script>

<style scoped>
.incidents-container {
  max-width: 1100px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.empty,
.loading {
  color: #64748b;
}

.table-card {
  padding: 0;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover,
tbody tr.selected {
  background: #f1f5f9;
}

.description-cell {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e2e8f0;
  color: #334155;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.badge.ok {
  background: #dcfce7;
  color: #166534;
}

.badge.open {
  background: #fef9c3;
  color: #854d0e;
}

.badge.closed {
  background: #e2e8f0;
  color: #334155;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail h2 {
  margin: 0;
  font-size: 1.25rem;
}

.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.5rem;
}

.facts dt {
  font-weight: 600;
  color: #475569;
}

.facts dd {
  margin: 0;
  white-space: pre-line;
}

.step {
  border-top: 1px solid #e2e8f0;
  margin-top: 1.5rem;
  padding-top: 1rem;
}

.step h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.notes {
  white-space: pre-line;
  color: #475569;
}

.radio-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.notify-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.hint,
.muted {
  color: #64748b;
  font-size: 0.85rem;
}

textarea,
input[type='text'],
input[type='number'],
input[type='datetime-local'] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

textarea {
  display: block;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-secondary {
  background: white;
  border-color: #cbd5e1;
  color: #1e293b;
}

.message {
  padding: 0.6rem 0.9rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.message.ok {
  background: #dcfce7;
  color: #166534;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0;
}

.modal label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

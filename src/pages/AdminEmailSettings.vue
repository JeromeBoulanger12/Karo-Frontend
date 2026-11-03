<template>
  <div class="admin-email-container">
    <div class="page-header">
      <h1>{{ t('adminEmail.settingsTitle') }}</h1>
      <p class="subtitle">{{ t('adminEmail.settingsSubtitle') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <div v-else class="card">
      <div class="status-row">
        <span class="label">{{ t('adminEmail.apiKeyStatus') }}</span>
        <span class="status-badge" :class="form.apiKeyConfigured ? 'ok' : 'missing'">
          {{ form.apiKeyConfigured ? t('adminEmail.apiKeyConfigured') : t('adminEmail.apiKeyMissing') }}
        </span>
      </div>
      <p class="hint">{{ t('adminEmail.apiKeyHint') }}</p>

      <div v-if="usesTestDomain" class="notice">
        {{ t('adminEmail.testDomainNotice') }}
      </div>

      <form @submit.prevent="save">
        <div class="field">
          <label for="fromAddress">{{ t('adminEmail.fromAddress') }}</label>
          <input id="fromAddress" v-model="form.fromAddress" type="email" required />
        </div>

        <div class="field">
          <label for="fromName">{{ t('adminEmail.fromName') }}</label>
          <input id="fromName" v-model="form.fromName" type="text" maxlength="100" required />
        </div>

        <div class="field checkbox">
          <label>
            <input v-model="form.testMode" type="checkbox" />
            {{ t('adminEmail.testMode') }}
          </label>
          <p class="hint">{{ t('adminEmail.testModeHint') }}</p>
        </div>

        <div class="field">
          <label for="testRecipient">{{ t('adminEmail.testRecipient') }}</label>
          <input id="testRecipient" v-model="form.testRecipient" type="email" :required="form.testMode" />
        </div>

        <ul v-if="errors.length" class="errors">
          <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
        </ul>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('adminEmail.saving') : t('common.save') }}
          </button>
          <button type="button" class="btn btn-secondary" :disabled="sendingTest || !form.testRecipient" @click="sendTest">
            <i class="mdi mdi-send"></i>
            {{ sendingTest ? t('common.loading') : t('adminEmail.sendTest') }}
          </button>
        </div>

        <p v-if="message" class="message" :class="messageKind">{{ message }}</p>
      </form>

      <p class="updated">
        {{ t('adminEmail.lastUpdated') }} : {{ new Date(form.updatedAt).toLocaleString('fr-CA') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminEmailApi, errorMessages, type EmailSettings } from '../api/adminEmail'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const sendingTest = ref(false)
const errors = ref<string[]>([])
const message = ref('')
const messageKind = ref<'success' | 'error'>('success')

const form = ref<EmailSettings>({
  fromAddress: '',
  fromName: '',
  testMode: true,
  testRecipient: null,
  apiKeyConfigured: false,
  updatedAt: new Date().toISOString()
})

// The default sender of Resend is only allowed to deliver to the account owner until a domain is verified
const usesTestDomain = computed(() => form.value.fromAddress.endsWith('@resend.dev'))

const showMessage = (text: string, kind: 'success' | 'error') => {
  message.value = text
  messageKind.value = kind
}

const load = async () => {
  loading.value = true
  try {
    const { data } = await adminEmailApi.getSettings()
    form.value = { ...data, testRecipient: data.testRecipient ?? null }
  } catch (error) {
    showMessage(errorMessages(error).join(' '), 'error')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  errors.value = []
  message.value = ''
  try {
    const { data } = await adminEmailApi.updateSettings({
      fromAddress: form.value.fromAddress,
      fromName: form.value.fromName,
      testMode: form.value.testMode,
      testRecipient: form.value.testRecipient || null
    })
    form.value = { ...data, testRecipient: data.testRecipient ?? null }
    showMessage(t('adminEmail.saved'), 'success')
  } catch (error) {
    errors.value = errorMessages(error)
  } finally {
    saving.value = false
  }
}

const sendTest = async () => {
  sendingTest.value = true
  message.value = ''
  try {
    await adminEmailApi.sendTestEmail()
    showMessage(t('adminEmail.testSent'), 'success')
  } catch (error) {
    showMessage(errorMessages(error).join(' '), 'error')
  } finally {
    sendingTest.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-email-container {
  max-width: 720px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0.25rem 0 1.5rem;
  color: #64748b;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.status-badge.ok {
  background: #dcfce7;
  color: #166534;
}

.status-badge.missing {
  background: #fee2e2;
  color: #991b1b;
}

.hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 1rem;
}

.notice {
  background: #fef9c3;
  color: #854d0e;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.field input[type='text'],
.field input[type='email'] {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
}

.errors {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  padding: 0.75rem 1rem 0.75rem 2rem;
  margin: 0 0 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2d6a4f;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #1e293b;
}

.message {
  margin-top: 1rem;
  font-weight: 600;
}

.message.success {
  color: #166534;
}

.message.error {
  color: #991b1b;
}

.updated {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>

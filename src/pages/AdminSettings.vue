<template>
  <div class="admin-settings-container">
    <div class="settings-header">
      <h1>{{ t('admin.settings') }}</h1>
      <p class="subtitle">{{ t('admin.settings_subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <div v-else class="settings-grid">
      <!-- Payment Provider Section -->
      <div class="settings-card">
        <div class="card-header">
          <h2>
            <i class="mdi mdi-credit-card"></i>
            {{ t('admin.payment_provider') }}
          </h2>
          <p class="card-subtitle">{{ t('admin.payment_provider_subtitle') }}</p>
        </div>

        <div class="card-content">
          <div class="form-group">
            <label>{{ t('admin.current_provider') }}</label>
            <div class="provider-display">
              <span class="provider-badge" :class="currentProvider.toLowerCase()">
                {{ currentProvider }}
              </span>
              <span class="provider-status">{{ t('admin.provider_active') }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('admin.select_provider') }}</label>
            <div class="provider-options">
              <div
                v-for="provider in paymentProviders"
                :key="provider.id"
                class="provider-option"
                :class="{ selected: provider.id === currentProvider }"
                @click="selectProvider(provider)"
              >
                <div class="provider-icon">
                  <i :class="provider.icon"></i>
                </div>
                <div class="provider-info">
                  <div class="provider-name">{{ provider.name }}</div>
                  <div class="provider-desc">{{ provider.description }}</div>
                </div>
                <div v-if="provider.id === currentProvider" class="checkmark">
                  <i class="mdi mdi-check-circle"></i>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedProvider" class="form-group">
            <label>{{ t('admin.api_configuration') }}</label>
            <div class="api-config">
              <div class="config-item">
                <span class="config-label">{{ t('admin.api_key') }}</span>
                <input
                  v-model="providerConfig.apiKey"
                  type="password"
                  class="config-input"
                  :placeholder="`${t('admin.enter')} ${selectedProvider.name} API Key`"
                />
              </div>

              <div class="config-item">
                <span class="config-label">{{ t('admin.webhook_secret') }}</span>
                <input
                  v-model="providerConfig.webhookSecret"
                  type="password"
                  class="config-input"
                  :placeholder="`${t('admin.enter')} ${selectedProvider.name} Webhook Secret`"
                />
              </div>

              <div class="config-item">
                <span class="config-label">{{ t('admin.environment') }}</span>
                <select v-model="providerConfig.environment" class="config-input">
                  <option value="sandbox">{{ t('admin.sandbox') }}</option>
                  <option value="production">{{ t('admin.production') }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button
              @click="saveProviderSettings"
              :disabled="!hasChanges || saving"
              class="btn btn-primary"
            >
              <i class="mdi mdi-check"></i>
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
            <button @click="testConnection" class="btn btn-secondary">
              <i class="mdi mdi-network-check"></i>
              {{ t('admin.test_connection') }}
            </button>
          </div>

          <div v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            <i :class="testResult.success ? 'mdi mdi-check-circle' : 'mdi mdi-alert-circle'"></i>
            {{ testResult.message }}
          </div>
        </div>
      </div>

      <!-- Application Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>
            <i class="mdi mdi-cog"></i>
            {{ t('admin.app_settings') }}
          </h2>
          <p class="card-subtitle">{{ t('admin.app_settings_subtitle') }}</p>
        </div>

        <div class="card-content">
          <div class="form-group">
            <label>{{ t('admin.subscription_enabled') }}</label>
            <div class="toggle-group">
              <label class="toggle">
                <input v-model="appSettings.subscriptionEnabled" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">
                {{ appSettings.subscriptionEnabled ? t('admin.enabled') : t('admin.disabled') }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('admin.auto_billing') }}</label>
            <div class="toggle-group">
              <label class="toggle">
                <input v-model="appSettings.autoBillingEnabled" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">
                {{ appSettings.autoBillingEnabled ? t('admin.enabled') : t('admin.disabled') }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('admin.email_notifications') }}</label>
            <div class="toggle-group">
              <label class="toggle">
                <input v-model="appSettings.emailNotifications" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">
                {{ appSettings.emailNotifications ? t('admin.enabled') : t('admin.disabled') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)

const paymentProviders = [
  {
    id: 'Mock',
    name: 'Mock Provider (Testing)',
    description: 'Test environment without real payments',
    icon: 'mdi mdi-test-tube'
  },
  {
    id: 'LemonSqueezy',
    name: 'Lemon Squeezy',
    description: 'Merchant of Record - handles payments & taxes globally',
    icon: 'mdi mdi-lemon'
  },
  {
    id: 'Stripe',
    name: 'Stripe',
    description: 'Industry-leading payment processing',
    icon: 'mdi mdi-credit-card'
  },
  {
    id: 'Paddle',
    name: 'Paddle',
    description: 'Global payments platform',
    icon: 'mdi mdi-wallet'
  }
]

const currentProvider = ref('Mock')
const selectedProvider = ref<any>(null)
const providerConfig = ref({
  apiKey: '',
  webhookSecret: '',
  environment: 'sandbox'
})

const appSettings = ref({
  subscriptionEnabled: true,
  autoBillingEnabled: true,
  emailNotifications: true
})

const testResult = ref<any>(null)

const hasChanges = computed(() => {
  return selectedProvider.value && selectedProvider.value.id !== currentProvider.value
})

const selectProvider = (provider: any) => {
  selectedProvider.value = provider
  providerConfig.value = {
    apiKey: '',
    webhookSecret: '',
    environment: 'sandbox'
  }
}

const saveProviderSettings = async () => {
  saving.value = true
  try {
    // TODO: Call backend API to save settings
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentProvider.value = selectedProvider.value.id
    console.log('Settings saved:', {
      provider: selectedProvider.value.id,
      config: providerConfig.value
    })
    testResult.value = {
      success: true,
      message: t('admin.settings_saved')
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: t('admin.settings_save_error')
    }
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  if (!selectedProvider.value || !providerConfig.value.apiKey) {
    testResult.value = {
      success: false,
      message: t('admin.api_key_required')
    }
    return
  }

  saving.value = true
  try {
    // TODO: Call backend API to test connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    testResult.value = {
      success: true,
      message: `${t('admin.connection_successful')} - ${selectedProvider.value.name}`
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `${t('admin.connection_failed')} - ${error}`
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1e293b;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
}

.settings-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.card-subtitle {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.card-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
}

/* Provider Display */
.provider-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f1f5f9;
  border-radius: 4px;
}

.provider-badge {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
}

.provider-badge.mock {
  background-color: #fef3c7;
  color: #92400e;
}

.provider-badge.stripe {
  background-color: #dbeafe;
  color: #1e40af;
}

.provider-badge.paddle {
  background-color: #d1fae5;
  color: #065f46;
}

.provider-status {
  font-size: 0.85rem;
  color: #64748b;
}

/* Provider Options */
.provider-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.provider-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.provider-option:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.provider-option.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.provider-icon {
  font-size: 2rem;
  color: #3b82f6;
  width: 50px;
  text-align: center;
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-weight: 600;
  color: #1e293b;
}

.provider-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.checkmark {
  color: #10b981;
  font-size: 1.5rem;
}

/* API Configuration */
.api-config {
  background-color: #f8fafc;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.config-item {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-input {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: monospace;
}

.config-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Toggle Group */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle {
  position: relative;
  width: 50px;
  height: 28px;
  cursor: pointer;
}

.toggle input {
  display: none;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  border-radius: 14px;
  transition: background-color 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle input:checked + .toggle-slider {
  background-color: #10b981;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 0.95rem;
  color: #475569;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

/* Test Result */
.test-result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.test-result.success {
  background-color: #dcfce7;
  color: #166534;
  border-left: 4px solid #10b981;
}

.test-result.error {
  background-color: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.test-result i {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }
}
</style>

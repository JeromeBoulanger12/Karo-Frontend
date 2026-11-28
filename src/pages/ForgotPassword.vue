<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import '../styles/auth-card.css'

const { t } = useI18n()
const route = useRoute()
const { requestPasswordReset } = useAuth()

// The login page passes the address already typed
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const sending = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  sending.value = true
  error.value = null

  const code = await requestPasswordReset(email.value.trim())
  if (code === 'over_email_send_rate_limit') {
    error.value = t('passwordReset.tooManyRequests')
  } else if (code) {
    error.value = t('passwordReset.sendError')
  } else {
    sent.value = true
  }

  sending.value = false
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">{{ t('passwordReset.forgotTitle') }}</h1>
      <p class="auth-subtitle">{{ t('passwordReset.forgotSubtitle') }}</p>

      <div v-if="sent" class="auth-notice auth-notice--success" role="status">
        <i class="mdi mdi-email-check-outline"></i>
        <span>{{ t('passwordReset.sent', { email }) }}</span>
      </div>

      <div v-if="error" class="auth-notice auth-notice--error" role="alert">
        <i class="mdi mdi-alert-circle-outline"></i>
        <span>{{ error }}</span>
      </div>

      <form v-if="!sent" class="auth-form" @submit.prevent="handleSubmit">
        <label class="auth-field">
          <span class="auth-field-label">{{ t('auth.email') }}</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            required
            :disabled="sending"
            placeholder="nom@exemple.com"
          />
        </label>

        <button type="submit" class="auth-submit" :disabled="sending">
          <i v-if="sending" class="mdi mdi-loading mdi-spin"></i>
          <span>{{ t('passwordReset.sendLink') }}</span>
        </button>
      </form>

      <p class="auth-footer">
        <router-link to="/login">{{ t('passwordReset.backToLogin') }}</router-link>
      </p>
    </div>
  </div>
</template>

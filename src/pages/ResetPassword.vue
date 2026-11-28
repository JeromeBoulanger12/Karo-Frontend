<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase, openedFromRecoveryLink, recoveryLinkFailed } from '../api/supabase'
import { useAuth } from '../composables/useAuth'
import '../styles/auth-card.css'

const { t } = useI18n()
const router = useRouter()
const { updatePassword } = useAuth()

const checking = ref(true)
const hasSession = ref(false)
const password = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const done = ref(false)
const error = ref<string | null>(null)

const mismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value)

onMounted(async () => {
  // Waits for Supabase to read the recovery link, which opens a session. Without the link (page reloaded,
  // or opened by hand while signed in) the form stays hidden: the profile asks for the current password instead.
  const { data } = await supabase.auth.getSession()
  hasSession.value = openedFromRecoveryLink && !recoveryLinkFailed && !!data.session
  checking.value = false
})

const handleSubmit = async () => {
  if (mismatch.value) return
  saving.value = true
  error.value = null

  const code = await updatePassword(password.value)
  if (code === 'same_password') {
    error.value = t('passwordReset.samePassword')
  } else if (code === 'weak_password') {
    error.value = t('passwordReset.weakPassword')
  } else if (code) {
    error.value = t('passwordReset.updateError')
  } else {
    done.value = true
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  saving.value = false
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">{{ t('passwordReset.resetTitle') }}</h1>

      <p v-if="checking" class="auth-subtitle">
        <i class="mdi mdi-loading mdi-spin"></i> {{ t('common.loading') }}
      </p>

      <template v-else-if="!hasSession">
        <div class="auth-notice auth-notice--error" role="alert">
          <i class="mdi mdi-link-variant-off"></i>
          <span>{{ t('passwordReset.linkExpired') }}</span>
        </div>
        <p class="auth-footer">
          <router-link to="/forgot-password">{{ t('passwordReset.requestNewLink') }}</router-link>
        </p>
      </template>

      <template v-else>
        <p class="auth-subtitle">{{ t('passwordReset.resetSubtitle') }}</p>

        <div v-if="done" class="auth-notice auth-notice--success" role="status">
          <i class="mdi mdi-check-circle-outline"></i>
          <span>{{ t('passwordReset.updated') }}</span>
        </div>

        <div v-if="error" class="auth-notice auth-notice--error" role="alert">
          <i class="mdi mdi-alert-circle-outline"></i>
          <span>{{ error }}</span>
        </div>

        <form v-if="!done" class="auth-form" @submit.prevent="handleSubmit">
          <label class="auth-field">
            <span class="auth-field-label">{{ t('passwordReset.newPassword') }}</span>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              :disabled="saving"
            />
          </label>

          <label class="auth-field">
            <span class="auth-field-label">{{ t('auth.confirmPassword') }}</span>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              :disabled="saving"
            />
            <span v-if="mismatch" class="auth-field-error">{{ t('auth.passwordsMustMatch') }}</span>
          </label>

          <button type="submit" class="auth-submit" :disabled="saving || mismatch">
            <i v-if="saving" class="mdi mdi-loading mdi-spin"></i>
            <span>{{ t('passwordReset.save') }}</span>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

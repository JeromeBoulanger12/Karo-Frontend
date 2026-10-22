<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { resetRedirectFlag } from '../api/client'

const { t } = useI18n()
const router = useRouter()
const { signup, loading, error } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')

const passwordsMatch = () => password.value === confirmPassword.value

const handleSignup = async () => {
  if (!passwordsMatch()) {
    return
  }

  // Store profile info for later (after email confirmation)
  localStorage.setItem('pendingFirstName', firstName.value)
  localStorage.setItem('pendingLastName', lastName.value)

  await signup(email.value, password.value)
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  resetRedirectFlag()
})
</script>

<template>
  <div class="auth-container">
    <div class="auth-box">
      <div class="auth-header">
        <h1>Karo</h1>
        <p>{{ t('auth.signup') }}</p>
      </div>

      <v-alert v-if="error" :type="error.includes('Check your email') ? 'success' : 'error'" class="mb-4">
        {{ error }}
      </v-alert>

      <v-form @submit.prevent="handleSignup">
        <v-text-field
          v-model="email"
          :label="t('auth.email')"
          type="email"
          outlined
          class="mb-3"
          required
        ></v-text-field>

        <v-text-field
          v-model="firstName"
          :label="t('common.firstName')"
          outlined
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-model="lastName"
          :label="t('common.lastName')"
          outlined
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-model="password"
          :label="t('auth.password')"
          type="password"
          outlined
          class="mb-3"
          required
        ></v-text-field>

        <v-text-field
          v-model="confirmPassword"
          :label="t('auth.confirmPassword')"
          type="password"
          outlined
          class="mb-4"
          required
          :error="!passwordsMatch() && confirmPassword.length > 0"
          :error-messages="!passwordsMatch() && confirmPassword.length > 0 ? [t('auth.passwordsMustMatch')] : []"
          @keyup.enter="handleSignup"
        ></v-text-field>

        <v-btn
          type="submit"
          color="primary"
          block
          :loading="loading"
          :disabled="!passwordsMatch() || !email || !password"
          class="mb-3"
        >
          {{ t('auth.signup') }}
        </v-btn>
      </v-form>

      <div class="auth-footer">
        <p>{{ t('auth.alreadyHave') }}</p>
        <v-btn
          text
          color="primary"
          @click="goToLogin"
        >
          {{ t('auth.login') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
}

.auth-box {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e5e5;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1b6ec2;
  margin: 0;
}

.auth-header p {
  font-size: 0.95rem;
  color: #666666;
  margin-top: 0.5rem;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e5e5;
}

.auth-footer p {
  font-size: 0.9rem;
  color: #666666;
  margin: 0;
}
</style>

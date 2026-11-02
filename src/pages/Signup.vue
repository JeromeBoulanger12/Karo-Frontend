<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { resetRedirectFlag } from '../api/client'
import { savePendingProfile } from '../composables/pendingProfile'
import { LEGAL_VERSION } from '../legal/version'

const { t } = useI18n()
const router = useRouter()
const { signup, loading, error } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const acceptedPolicy = ref(false)
const street = ref('')
const city = ref('')
const province = ref('')
const postalCode = ref('')
const country = ref('')

const passwordsMatch = () => password.value === confirmPassword.value

const handleSignup = async () => {
  if (!passwordsMatch() || !acceptedPolicy.value) {
    return
  }

  // Store profile info for later (after email confirmation)
  localStorage.setItem('pendingFirstName', firstName.value)
  localStorage.setItem('pendingLastName', lastName.value)
  savePendingProfile({
    // The browser's zone is a good first guess; the profile page can change it
    timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    consentVersion: LEGAL_VERSION,
    address: {
      street: street.value,
      city: city.value,
      province: province.value,
      postalCode: postalCode.value,
      country: country.value
    }
  })

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
          v-model="street"
          :label="t('profile.street')"
          outlined
          class="mb-3"
          autocomplete="street-address"
        ></v-text-field>

        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="city" :label="t('profile.city')" outlined class="mb-3" autocomplete="address-level2"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="postalCode" :label="t('profile.postalCode')" outlined class="mb-3" autocomplete="postal-code"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="province" :label="t('profile.province')" outlined class="mb-3" autocomplete="address-level1"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="country" :label="t('profile.country')" outlined class="mb-3" autocomplete="country-name"></v-text-field>
          </v-col>
        </v-row>

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

        <!-- Consent: recorded with the version of the policy and terms the user saw -->
        <v-checkbox v-model="acceptedPolicy" density="comfortable" class="mb-2" hide-details>
          <template #label>
            <span>
              {{ t('legal.acceptPrefix') }}
              <a href="/confidentialite" target="_blank" rel="noopener" @click.stop>{{ t('legal.privacy') }}</a>
              {{ t('legal.and') }}
              <a href="/conditions" target="_blank" rel="noopener" @click.stop>{{ t('legal.terms') }}</a>
            </span>
          </template>
        </v-checkbox>
        <p v-if="!acceptedPolicy && (email || password)" class="legal-required">{{ t('legal.acceptRequired') }}</p>

        <v-btn
          type="submit"
          color="primary"
          block
          :loading="loading"
          :disabled="!passwordsMatch() || !email || !password || !acceptedPolicy"
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

.legal-required {
  font-size: 0.85rem;
  color: #b00020;
  margin: 0 0 0.75rem;
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

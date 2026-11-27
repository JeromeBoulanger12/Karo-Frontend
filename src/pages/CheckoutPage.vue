<template>
  <div class="checkout-container">
    <div class="checkout-header">
      <router-link to="/" class="logo-link">
        <i class="mdi mdi-home"></i> Karo
      </router-link>
    </div>

    <div class="checkout-wrapper">
      <!-- Order Summary / Cart -->
      <div class="checkout-summary">
        <h2>{{ t('checkout.order_summary') }}</h2>

        <div class="plan-card">
          <div class="plan-header">
            <h3>{{ selectedPlan?.name }}</h3>
            <p class="plan-desc">{{ selectedPlan?.description }}</p>
          </div>

          <div v-if="isPaidPlan && yearlyAvailable" class="interval-toggle" role="group" :aria-label="t('billing.interval')">
            <button type="button" :class="{ active: interval === 'month' }" @click="interval = 'month'">{{ t('billing.monthly') }}</button>
            <button type="button" :class="{ active: interval === 'year' }" @click="interval = 'year'">{{ t('billing.yearly') }}</button>
          </div>

          <div class="plan-price">
            <span class="price">${{ planPrice.toFixed(2) }}</span>
            <span class="period">/{{ interval === 'year' ? t('billing.perYear') : t('landing.month') }}</span>
          </div>

          <div class="plan-features">
            <div v-for="feature in selectedPlan?.features" :key="feature" class="feature-item">
              <i class="mdi mdi-check-circle-outline"></i>
              <span>{{ feature }}</span>
            </div>
          </div>

          <div class="plan-terms">
            <p>{{ t('checkout.cancel_anytime') }}</p>
          </div>
        </div>

        <div class="order-total">
          <div class="total-row">
            <span>{{ t('checkout.subtotal') }}</span>
            <span>${{ planPrice.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>{{ t('checkout.tax') }}</span>
            <span>{{ t('checkout.calculated_checkout') }}</span>
          </div>
          <div class="total-row grand-total">
            <span>{{ t('checkout.total') }}</span>
            <span>${{ planPrice.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Signup Form -->
      <div class="checkout-form">
        <h2>{{ t('checkout.create_account') }}</h2>

        <form @submit.prevent="handleCheckout">
          <!-- Email -->
          <div class="form-group">
            <label for="email">{{ t('auth.email') }}</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :disabled="loading"
              class="form-control"
              placeholder="your@email.com"
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">{{ t('auth.password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :disabled="loading"
              class="form-control"
              placeholder="••••••••"
              minlength="8"
            />
            <small>{{ t('checkout.min_8_chars') }}</small>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword">{{ t('auth.confirmPassword') }}</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              :disabled="loading"
              class="form-control"
              placeholder="••••••••"
              minlength="8"
            />
          </div>

          <!-- First Name -->
          <div class="form-group">
            <label for="firstName">{{ t('common.firstName') }}</label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              :disabled="loading"
              class="form-control"
              placeholder="John"
            />
          </div>

          <!-- Last Name -->
          <div class="form-group">
            <label for="lastName">{{ t('common.lastName') }}</label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              :disabled="loading"
              class="form-control"
              placeholder="Doe"
            />
          </div>

          <!-- Mailing address (kept for the payment) -->
          <div class="form-group">
            <label for="street">{{ t('profile.street') }}</label>
            <input id="street" v-model="form.street" type="text" :disabled="loading" class="form-control" autocomplete="street-address" />
          </div>

          <div class="form-group">
            <label for="city">{{ t('profile.city') }}</label>
            <input id="city" v-model="form.city" type="text" :disabled="loading" class="form-control" autocomplete="address-level2" />
          </div>

          <div class="form-group">
            <label for="province">{{ t('profile.province') }}</label>
            <input id="province" v-model="form.province" type="text" :disabled="loading" class="form-control" autocomplete="address-level1" />
          </div>

          <div class="form-group">
            <label for="postalCode">{{ t('profile.postalCode') }}</label>
            <input id="postalCode" v-model="form.postalCode" type="text" :disabled="loading" class="form-control" autocomplete="postal-code" />
          </div>

          <div class="form-group">
            <label for="country">{{ t('profile.country') }}</label>
            <input id="country" v-model="form.country" type="text" :disabled="loading" class="form-control" autocomplete="country-name" />
          </div>

          <!-- Terms -->
          <div class="form-group checkbox">
            <input
              id="terms"
              v-model="form.agreeToTerms"
              type="checkbox"
              required
              :disabled="loading"
            />
            <label for="terms">
              {{ t('checkout.agree_to_terms') }}
              <a href="#" target="_blank">{{ t('landing.terms') }}</a>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !form.agreeToTerms"
            class="btn btn-primary btn-large"
          >
            <i v-if="loading" class="mdi mdi-loading mdi-spin"></i>
            {{ loading ? t('checkout.processing') : t('checkout.create_and_pay') }}
          </button>

          <!-- Login Link -->
          <p class="login-link">
            {{ t('checkout.already_have_account') }}
            <router-link to="/login">{{ t('auth.login') }}</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import client from '../api/client'
import { supabase } from '../api/supabase'
import { useAuth } from '../composables/useAuth'
import { billingApi, type BillingInterval, type PaidTier, type PlanPrice } from '../api/billing'
import { userSettingsApi } from '../api/userSettings'
import { LEGAL_VERSION } from '../legal/version'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { checkAuth } = useAuth()


const loading = ref(false)
const error = ref('')

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  agreeToTerms: false
})

// Map plan names to their details
const plansMap = {
  free: {
    name: 'Free',
    price: 0,
    description: t('landing.free_desc'),
    features: [
      t('landing.feature_1_account'),
      t('landing.feature_basic_envelope'),
      t('landing.feature_household'),
      t('landing.feature_basic_analytics')
    ]
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    description: t('landing.pro_desc'),
    features: [
      t('landing.feature_unlimited_accounts'),
      t('landing.feature_advanced_envelope'),
      t('landing.feature_household'),
      t('landing.feature_advanced_analytics'),
      t('landing.feature_priority_support')
    ]
  },
  family: {
    name: 'Family',
    price: 19.99,
    description: t('landing.family_desc'),
    features: [
      t('landing.feature_multiple_households'),
      t('landing.feature_team_collab'),
      t('landing.feature_api_access'),
      t('landing.feature_premium_analytics'),
      t('landing.feature_24_7_support'),
      t('landing.feature_custom_reports')
    ]
  }
}

const planKey = computed(() => {
  const planParam = (route.query.plan as string)?.toLowerCase() || 'free'
  return (planParam in plansMap ? planParam : 'free') as keyof typeof plansMap
})
const selectedPlan = computed(() => plansMap[planKey.value])
const paidTier = computed<PaidTier | null>(() => (planKey.value === 'pro' ? 'Pro' : planKey.value === 'family' ? 'Family' : null))
const isPaidPlan = computed(() => paidTier.value !== null)

// Prices come from the tier configuration once it loads; the figures above are the fallback
const interval = ref<BillingInterval>(route.query.interval === 'year' ? 'year' : 'month')
const plans = ref<PlanPrice[]>([])
const tierPlan = computed(() => plans.value.find(p => p.tier === paidTier.value))
const yearlyAvailable = computed(() => !!tierPlan.value?.stripeAnnualPriceId)
const planPrice = computed(() => {
  if (!tierPlan.value) return selectedPlan.value.price
  return interval.value === 'year' ? tierPlan.value.annualPrice : tierPlan.value.monthlyPrice
})

const handleCheckout = async () => {
  // Validation
  if (form.value.password !== form.value.confirmPassword) {
    error.value = t('auth.passwordsMustMatch')
    return
  }

  if (!form.value.agreeToTerms) {
    error.value = t('checkout.must_agree_terms')
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 1. Sign up with Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password
    })

    if (signUpError) {
      throw signUpError
    }

    if (!data.user || !data.session) {
      throw new Error(t('checkout.signup_failed'))
    }

    // Store token for bootstrap call
    const accessToken = data.session.access_token
    localStorage.setItem('token', accessToken)

    // 2. Create the account; it starts on Free and Stripe's confirmation upgrades it
    const { data: boot } = await client.post('/auth/bootstrap', { email: form.value.email })
    if (boot?.householdId) {
      localStorage.setItem('householdId', boot.householdId)
    }

    // 3. Update user profile with first and last name
    if (form.value.firstName || form.value.lastName) {
      await client.put('/auth/profile', {
        firstName: form.value.firstName,
        lastName: form.value.lastName
      })
    }

    // The address is kept for the payment; the time zone starts as the browser's. Neither blocks the checkout
    try {
      await userSettingsApi.updateAddress({
        street: form.value.street,
        city: form.value.city,
        province: form.value.province,
        postalCode: form.value.postalCode,
        country: form.value.country
      })
      await userSettingsApi.updatePreferences(Intl.DateTimeFormat().resolvedOptions().timeZone, true)
      // The box is required above, so the version the user accepted is recorded here
      await userSettingsApi.recordConsent(LEGAL_VERSION)
    } catch (profileErr) {
      console.warn('[CHECKOUT] Address or time zone not saved:', profileErr)
    }

    // The router guard reads the shared auth state: without this, the next page sends the new user to the login page
    await checkAuth()

    // 4. Free goes straight to the dashboard; a paid plan continues to the Stripe checkout
    if (!paidTier.value) {
      await router.push('/dashboard')
      return
    }

    // Karo's payment page shows Stripe's form; it falls back to Stripe's own page if the form cannot load
    await router.push({ path: '/paiement', query: { tier: paidTier.value, interval: interval.value } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('checkout.checkout_failed')
    console.error('Checkout error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  billingApi.getPlans().then(result => (plans.value = result)).catch(() => {})
  // If already logged in, redirect to dashboard
  if (localStorage.getItem('token')) {
    router.push({ name: 'Dashboard' })
  }
})
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.checkout-header {
  background: white;
  padding: 20px 0;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #0066cc;
  text-decoration: none;
  margin-left: 40px;
}

.checkout-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.checkout-summary {
  background: white;
  padding: 30px;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.checkout-summary h2 {
  font-size: 18px;
  margin-bottom: 25px;
  color: #333;
}

.plan-card {
  background: #f8f9fa;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.plan-header h3 {
  margin: 0 0 5px 0;
  font-size: 24px;
  color: #333;
}

.plan-desc {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin: 20px 0;
}

.interval-toggle {
  display: inline-flex;
  margin-top: 16px;
  border: 1px solid #ddd;
  border-radius: 999px;
  overflow: hidden;
}

.interval-toggle button {
  padding: 6px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.interval-toggle button.active {
  background: #3b82f6;
  color: #fff;
}

.price {
  font-size: 36px;
  font-weight: 700;
  color: #0066cc;
}

.period {
  color: #666;
  font-size: 14px;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
}

.feature-item i {
  color: #28a745;
  font-size: 18px;
}

.plan-terms {
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.plan-terms p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.order-total {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.total-row.grand-total {
  font-size: 18px;
  font-weight: 700;
  color: #0066cc;
  border-top: 1px solid #e5e5e5;
  padding-top: 10px;
  margin-top: 10px;
}

.checkout-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
}

.checkout-form h2 {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-control:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.form-group.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.form-group.checkbox input {
  margin-top: 5px;
}

.form-group.checkbox label {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.form-group.checkbox a {
  color: #0066cc;
  text-decoration: none;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-large {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .checkout-wrapper {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px 10px;
  }

  .checkout-summary {
    position: static;
  }

  .checkout-form {
    padding: 20px;
  }

  .logo-link {
    margin-left: 20px;
  }
}
</style>

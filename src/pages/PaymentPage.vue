<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { billingApi, billingErrorMessage, type BillingInterval, type PaidTier, type PlanPrice } from '../api/billing'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const tier = computed<PaidTier>(() => (route.query.tier === 'Family' ? 'Family' : 'Pro'))
const interval = computed<BillingInterval>(() => (route.query.interval === 'year' ? 'year' : 'month'))

const plan = ref<PlanPrice | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const formEl = ref<HTMLElement | null>(null)
let checkout: StripeEmbeddedCheckout | null = null

const price = computed(() => (plan.value ? (interval.value === 'year' ? plan.value.annualPrice : plan.value.monthlyPrice) : null))
const formatMoney = (amount: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CAD' }).format(amount)

// Stripe's own page still works when the form cannot be shown here (key missing, form refused)
const openHostedCheckout = async () => {
  try {
    window.location.href = await billingApi.startCheckout(tier.value, interval.value)
  } catch (err) {
    error.value = billingErrorMessage(err, t('billing.checkoutFailed'))
    loading.value = false
  }
}

onMounted(async () => {
  billingApi.getPlans().then(plans => (plan.value = plans.find(p => p.tier === tier.value) ?? null)).catch(() => {})

  let session: { clientSecret: string; publishableKey: string }
  try {
    session = await billingApi.startEmbeddedCheckout(tier.value, interval.value)
  } catch (err) {
    // A refusal of the plan itself (already subscribed, no price) would fail on Stripe's page too
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 400 && !billingErrorMessage(err, '').includes('PublishableKey')) {
      error.value = billingErrorMessage(err, t('billing.checkoutFailed'))
      loading.value = false
      return
    }
    await openHostedCheckout()
    return
  }

  try {
    const stripe = await loadStripe(session.publishableKey)
    if (!stripe || !formEl.value) throw new Error('Stripe.js did not load')
    checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret: session.clientSecret })
    checkout.mount(formEl.value)
  } catch (err) {
    console.error('[PAYMENT] Embedded checkout failed, opening Stripe’s page:', err)
    await openHostedCheckout()
    return
  }
  loading.value = false
})

onBeforeUnmount(() => checkout?.destroy())

const cancel = () => router.push({ path: '/profile', query: { checkout: 'cancelled' } })
</script>

<template>
  <div class="payment-page">
    <div class="payment-layout">
      <aside class="payment-summary">
        <button type="button" class="back-link" @click="cancel">
          <i class="mdi mdi-arrow-left"></i> {{ t('payment.back') }}
        </button>

        <p class="eyebrow">{{ t('payment.title') }}</p>
        <h1>Karo {{ t(`billing.tiers.${tier}`) }}</h1>
        <p v-if="price !== null" class="price">
          {{ formatMoney(price) }}
          <span>/ {{ interval === 'year' ? t('billing.perYear') : t('billing.perMonth') }}</span>
        </p>
        <p class="hint">{{ interval === 'year' ? t('billing.billedYearly') : t('billing.billedMonthly') }}</p>

        <ul class="reassurance">
          <li><i class="mdi mdi-lock-outline"></i> {{ t('payment.secure') }}</li>
          <li><i class="mdi mdi-receipt-text-outline"></i> {{ t('payment.taxes') }}</li>
          <li><i class="mdi mdi-calendar-remove-outline"></i> {{ t('payment.cancelAnytime') }}</li>
        </ul>
      </aside>

      <section class="payment-form">
        <div v-if="loading" class="state">
          <v-progress-circular indeterminate color="primary" />
          <p>{{ t('payment.loading') }}</p>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <div v-if="error" class="state">
          <v-btn color="primary" variant="tonal" @click="cancel">{{ t('payment.back') }}</v-btn>
        </div>
        <!-- Stripe draws its form in here -->
        <div ref="formEl" class="stripe-form"></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.payment-page {
  min-height: 100%;
  background: #f6f8fb;
  padding: 32px 16px 48px;
}

.payment-layout {
  display: grid;
  grid-template-columns: minmax(260px, 360px) 1fr;
  gap: 32px;
  max-width: 1040px;
  margin: 0 auto;
}

.payment-summary {
  align-self: start;
  position: sticky;
  top: 88px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #e5e9f0;
  border-radius: 16px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  padding: 0;
  background: none;
  border: none;
  color: #1b6ec2;
  font-size: 0.9rem;
  cursor: pointer;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.payment-summary h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.price {
  margin: 16px 0 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1b6ec2;
}

.price span {
  font-size: 0.95rem;
  font-weight: 400;
  color: #64748b;
}

.hint {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.reassurance {
  margin: 24px 0 0;
  padding: 20px 0 0;
  border-top: 1px solid #e5e9f0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #334155;
  font-size: 0.9rem;
}

.reassurance i {
  margin-right: 8px;
  color: #10b981;
}

.payment-form {
  min-height: 480px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e5e9f0;
  border-radius: 16px;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: #64748b;
}

@media (max-width: 800px) {
  .payment-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .payment-summary {
    position: static;
  }
}
</style>

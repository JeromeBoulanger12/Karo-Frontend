<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { billingApi, billingErrorMessage, type BillingInterval, type MySubscription, type PaidTier, type PlanPrice } from '../api/billing'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const subscription = ref<MySubscription | null>(null)
const plans = ref<PlanPrice[]>([])
const loading = ref(true)
const redirecting = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const interval = ref<BillingInterval>('month')

const paidTiers: PaidTier[] = ['Pro', 'Family']

// Only the tiers and intervals that have a Stripe price can be bought
const offers = computed(() =>
  paidTiers
    .map(tier => plans.value.find(p => p.tier === tier))
    .filter((plan): plan is PlanPrice => !!plan)
    .filter(plan => (interval.value === 'month' ? plan.stripeMonthlyPriceId : plan.stripeAnnualPriceId))
)
const yearlyAvailable = computed(() => plans.value.some(p => p.tier !== 'Free' && p.stripeAnnualPriceId))

const formatMoney = (amount: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CAD' }).format(amount)
const formatDate = (value: string) => new Date(value).toLocaleDateString(locale.value)
const tierName = (tier: string) => t(`billing.tiers.${tier}`)

const load = async () => {
  const [sub, tiers] = await Promise.all([billingApi.getMySubscription(), billingApi.getPlans().catch(() => [])])
  subscription.value = sub
  plans.value = tiers
}

// Stripe confirms the payment through its webhook, a few seconds after the user is back: check again a few times
const waitForActivation = async () => {
  for (let attempt = 0; attempt < 5 && !subscription.value?.isPaid; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    subscription.value = await billingApi.getMySubscription()
  }
  notice.value = subscription.value?.isPaid ? t('billing.activated') : t('billing.pending')
}

onMounted(async () => {
  try {
    await load()
    const checkout = route.query.checkout
    if (checkout) {
      // Clear the flag so a refresh does not show the message again
      router.replace({ query: { ...route.query, checkout: undefined, session_id: undefined } })
      if (checkout === 'success') {
        notice.value = t('billing.pending')
        await waitForActivation()
      } else if (checkout === 'cancelled') {
        notice.value = t('billing.cancelled')
      } else if (checkout === 'failed') {
        // The sign-up page created the account but could not open the payment page
        error.value = t('billing.checkoutFailed')
      }
    }
  } catch (err) {
    console.error('Error loading subscription:', err)
    error.value = t('billing.loadFailed')
  } finally {
    loading.value = false
  }
})

const subscribe = async (tier: PaidTier) => {
  // Karo's payment page shows Stripe's form and reports a refusal itself
  await router.push({ path: '/paiement', query: { tier, interval: interval.value } })
}

const manage = async () => {
  redirecting.value = true
  error.value = null
  try {
    window.location.href = await billingApi.openPortal()
  } catch (err) {
    error.value = billingErrorMessage(err, t('billing.portalFailed'))
    redirecting.value = false
  }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <i class="mdi mdi-star"></i>
      <h2>{{ t('profile.subscription') }}</h2>
    </div>

    <div class="card-body">
      <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

      <template v-else>
        <v-alert v-if="notice" type="info" class="mb-4">{{ notice }}</v-alert>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <div v-if="subscription" class="current-plan">
          <div class="plan-name">{{ tierName(subscription.tier) }}</div>

          <template v-if="subscription.isPaid">
            <p v-if="subscription.billingInterval" class="plan-line">
              {{ subscription.billingInterval === 'year' ? t('billing.billedYearly') : t('billing.billedMonthly') }}
            </p>
            <p class="plan-line">
              {{ subscription.cancelAtPeriodEnd
                ? t('billing.endsOn', { date: formatDate(subscription.renewalDate) })
                : t('billing.renewsOn', { date: formatDate(subscription.renewalDate) }) }}
            </p>
            <button type="button" class="btn-primary" :disabled="redirecting" @click="manage">
              <i class="mdi mdi-credit-card-outline"></i> {{ t('billing.manage') }}
            </button>
            <small class="plan-hint">{{ t('billing.manageHint') }}</small>
          </template>

          <p v-else-if="subscription.isManualAccess" class="plan-line">
            {{ subscription.manualAccessUntil
              ? t('billing.grantedUntil', { date: formatDate(subscription.manualAccessUntil) })
              : t('billing.granted') }}
          </p>
        </div>

        <!-- Not paying yet: offer the paid plans that are set up in Stripe -->
        <div v-if="subscription && !subscription.isPaid && offers.length > 0" class="upgrade">
          <div v-if="yearlyAvailable" class="interval-toggle" role="group" :aria-label="t('billing.interval')">
            <button type="button" :class="{ active: interval === 'month' }" @click="interval = 'month'">{{ t('billing.monthly') }}</button>
            <button type="button" :class="{ active: interval === 'year' }" @click="interval = 'year'">{{ t('billing.yearly') }}</button>
          </div>

          <div class="offers">
            <div v-for="plan in offers" :key="plan.tier" class="offer">
              <div class="offer-name">{{ tierName(plan.tier) }}</div>
              <div class="offer-price">
                {{ formatMoney(interval === 'month' ? plan.monthlyPrice : plan.annualPrice) }}
                <span>/ {{ interval === 'month' ? t('billing.perMonth') : t('billing.perYear') }}</span>
              </div>
              <button type="button" class="btn-primary" :disabled="redirecting" @click="subscribe(plan.tier as PaidTier)">
                {{ t('billing.choose', { plan: tierName(plan.tier) }) }}
              </button>
            </div>
          </div>
          <small class="plan-hint">{{ t('billing.taxesHint') }}</small>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.current-plan {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.plan-name {
  font-size: 1.25rem;
  font-weight: 600;
}

.plan-line {
  margin: 0;
  color: var(--text-muted);
}

.plan-hint {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-muted);
}

.upgrade {
  margin-top: 1.5rem;
}

.interval-toggle {
  display: inline-flex;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.interval-toggle button {
  padding: 0.4rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
}

.interval-toggle button.active {
  background: var(--primary-color, #3b82f6);
  color: #fff;
}

.offers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.offer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
}

.offer-name {
  font-weight: 600;
}

.offer-price {
  font-size: 1.25rem;
  font-weight: 600;
}

.offer-price span {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-muted);
}
</style>

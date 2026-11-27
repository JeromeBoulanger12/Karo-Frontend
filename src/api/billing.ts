import client from './client'

export type PaidTier = 'Pro' | 'Family'
export type BillingInterval = 'month' | 'year'

// Mirrors the backend SubscriptionDto (camelCase JSON)
export interface MySubscription {
  tier: 'Free' | PaidTier
  status: string
  startDate: string
  renewalDate: string
  cancelledDate: string | null
  manualAccessUntil: string | null
  isManualAccess: boolean
  isPaid: boolean
  billingInterval: BillingInterval | null
  cancelAtPeriodEnd: boolean
}

// The public part of a tier configuration: its prices and whether each interval is sold
export interface PlanPrice {
  tier: 'Free' | PaidTier
  monthlyPrice: number
  annualPrice: number
  stripeMonthlyPriceId: string | null
  stripeAnnualPriceId: string | null
}

// Stripe sends the user back here once the payment is done or abandoned (?checkout=success|cancelled)
export const profileReturnUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}profile`

export const billingApi = {
  getMySubscription() {
    return client.get<MySubscription>('/subscriptions/my-subscription').then(r => r.data)
  },
  getPlans() {
    return client.get<PlanPrice[]>('/admin/subscription-tier-configurations').then(r => r.data)
  },
  // Returns the Stripe checkout page; the tier changes once Stripe confirms the payment
  startCheckout(tier: PaidTier, interval: BillingInterval, returnUrl = profileReturnUrl()) {
    return client.post<{ url: string }>('/billing/checkout', { tier, interval, returnUrl }).then(r => r.data.url)
  },
  // Returns the Stripe customer portal (cancel, change plan or card)
  openPortal(returnUrl = profileReturnUrl()) {
    return client.post<{ url: string }>('/billing/portal', { returnUrl }).then(r => r.data.url)
  }
}

// The backend answers { error } on a refused checkout; fall back to a generic message otherwise
export const billingErrorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback

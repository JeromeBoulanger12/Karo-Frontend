import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import { createI18n } from 'vue-i18n'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './styles/globals.css'

import App from './App.vue'
import fr from './locales/fr.json'
import en from './locales/en.json'
import Landing from './pages/Landing.vue'
import PricingWithTax from './pages/PricingWithTax.vue'
import Login from './pages/Login.vue'
import Signup from './pages/Signup.vue'
import CheckoutPage from './pages/CheckoutPage.vue'
import Profile from './pages/Profile.vue'
import Household from './pages/Household.vue'
import InviteUser from './pages/InviteUser.vue'
import PendingInvitations from './pages/PendingInvitations.vue'
import DashboardNew from './pages/DashboardNew.vue'
import AdminDashboard from './pages/AdminDashboard.vue'
import AdminPanel from './pages/AdminPanel.vue'
import AdminSettings from './pages/AdminSettings.vue'
import AdminSubscriptions from './pages/AdminSubscriptions.vue'
import AdminUsers from './pages/AdminUsers.vue'
import AdminPromoCodes from './pages/AdminPromoCodes.vue'
import AdminTaxRates from './pages/AdminTaxRates.vue'
import AdminSubscriptionTierConfigurations from './pages/AdminSubscriptionTierConfigurations.vue'
import MembersList from './pages/MembersList.vue'
import { useAuth } from './composables/useAuth'
import { setupAuthInterceptor } from './api/client'

const routes = [
  { path: '/', component: Landing },
  { path: '/pricing', component: PricingWithTax },
  { path: '/login', component: Login },
  { path: '/signup', component: Signup },
  { path: '/checkout', component: CheckoutPage, name: 'Checkout' },

  // Main app routes
  { path: '/dashboard', component: DashboardNew },
  { path: '/profile', component: Profile },
  { path: '/household', component: Household },
  { path: '/household/invite', component: InviteUser },
  { path: '/invitations/pending', component: PendingInvitations },
  { path: '/members', component: MembersList },

  // Redirect old pages to dashboard
  { path: '/home', redirect: '/dashboard' },
  { path: '/accounts', redirect: '/dashboard' },
  { path: '/accounts/create', redirect: '/dashboard' },
  { path: '/accounts/:id', redirect: '/dashboard' },
  { path: '/envelopes', redirect: '/dashboard' },
  { path: '/envelopes/create', redirect: '/dashboard' },
  { path: '/envelopes/:id', redirect: '/dashboard' },
  { path: '/envelopes/:id/edit', redirect: '/dashboard' },
  { path: '/jobs', redirect: '/dashboard' },
  { path: '/jobs/create', redirect: '/dashboard' },
  { path: '/jobs/:id', redirect: '/dashboard' },
  { path: '/jobs/:id/edit', redirect: '/dashboard' },

  // Admin routes
  { path: '/admin', redirect: '/admin/dashboard' },
  {
    path: '/admin',
    component: AdminPanel,
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'settings', component: AdminSettings },
      { path: 'subscriptions', component: AdminSubscriptions },
      { path: 'users', component: AdminUsers },
      { path: 'promo-codes', component: AdminPromoCodes },
      { path: 'tax-rates', component: AdminTaxRates },
      { path: 'tier-configurations', component: AdminSubscriptionTierConfigurations }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Set up auth interceptor to redirect on 401/403
setupAuthInterceptor(router)

// Create auth instance once at app startup
const authInstance = useAuth()

// Router guard to protect routes and check authentication
router.beforeEach(async (to, from) => {
  const { checkAuth, isAuthenticated, authChecked } = authInstance

  // Check auth on first navigation only
  if (!authChecked.value) {
    await checkAuth()
  }

  // Landing page is accessible to everyone
  if (to.path === '/') {
    if (isAuthenticated.value) {
      return '/dashboard' // Redirect authenticated users to dashboard
    }
    return true // Allow unauthenticated users to see landing
  }

  // Public routes (login, signup, pricing, checkout)
  const publicRoutes = ['/login', '/signup', '/pricing', '/checkout']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (isPublicRoute) {
    if (isAuthenticated.value) {
      return '/dashboard'
    }
    return true
  } else {
    if (!isAuthenticated.value) {
      return '/login'
    }
    return true
  }
})

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'fr',
  fallbackLocale: 'fr',
  messages: { fr, en }
})

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          background: '#FFFFFF',
          surface: '#FFFFFF',
          primary: '#1B6EC2',
          secondary: '#0088CC',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#3B82F6'
        }
      }
    }
  },
  locale: {
    locale: 'fr',
    messages: {
      fr: {
        noDataText: 'Aucune donnée disponible',
        close: 'Fermer',
        dataFooter: {
          itemsPerPageText: 'Éléments par page:',
          itemsPerPageAll: 'Tous',
          pageText: '{0}-{1} sur {2}',
          firstPageAriaLabel: 'Première page',
          firstPage: 'Première page',
          lastPageAriaLabel: 'Dernière page',
          lastPage: 'Dernière page',
          nextPageAriaLabel: 'Page suivante',
          nextPage: 'Page suivante',
          prevPageAriaLabel: 'Page précédente',
          prevPage: 'Page précédente'
        },
        pagination: {
          ariaLabel: {
            root: 'Navigation de pagination'
          }
        }
      },
      en: {
        noDataText: 'No data available',
        close: 'Close',
        dataFooter: {
          itemsPerPageText: 'Items per page:',
          itemsPerPageAll: 'All',
          pageText: '{0}-{1} of {2}',
          firstPageAriaLabel: 'First page',
          firstPage: 'First page',
          lastPageAriaLabel: 'Last page',
          lastPage: 'Last page',
          nextPageAriaLabel: 'Next page',
          nextPage: 'Next page',
          prevPageAriaLabel: 'Previous page',
          prevPage: 'Previous page'
        },
        pagination: {
          ariaLabel: {
            root: 'Pagination navigation'
          }
        }
      }
    }
  }
})

const app = createApp(App)

app.config.globalProperties.$formatMoney = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return ''
  return Number(amount).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

app
  .use(router)
  .use(i18n)
  .use(vuetify)
  .mount('#app')

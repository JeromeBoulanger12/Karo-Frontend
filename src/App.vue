<script setup>
import { ref, onMounted, computed, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from './composables/useAuth'
import { householdsAPI } from './api/households'
import { notificationsApi } from './api/notifications'
import { userSettingsApi } from './api/userSettings'
import client from './api/client'

const router = useRouter()
const route = useRoute()
const { locale, t } = useI18n()
const { user, logout, handleEmailConfirmation, checkAuth } = useAuth()
const drawer = ref(true)
const userMenuOpen = ref(false)
const userRole = ref(null)
const isLoadingRole = ref(true)
const features = ref({ allowMembers: false, allowHousehold: false, allowBalanceHistory: false, allowPlanning: false })

// Tier features, shared with the dashboard components that gate a feature by plan
provide('subscriptionFeatures', features)

// The user's notification setting, shared with the profile page that changes it
const userPreferences = ref({ notificationsEnabled: true })
provide('userPreferences', userPreferences)

const loadUserPreferences = async () => {
  try {
    const response = await userSettingsApi.getProfile()
    userPreferences.value = { notificationsEnabled: !!response.data?.notificationsEnabled }
  } catch (err) {
    console.error('[App.vue] Could not load preferences', err)
  }
}

const isAdmin = computed(() => userRole.value === 'Owner' || userRole.value === 'Admin')

const loadFeatures = async () => {
  try {
    const response = await client.get('/subscriptions/my-features')
    features.value = {
      allowMembers: !!response.data?.allowMembers,
      allowHousehold: !!response.data?.allowHousehold,
      allowBalanceHistory: !!response.data?.allowBalanceHistory,
      allowPlanning: !!response.data?.allowPlanning
    }
  } catch (err) {
    console.error('[App.vue] Failed to load subscription features:', err)
    features.value = { allowMembers: false, allowHousehold: false, allowBalanceHistory: false, allowPlanning: false }
  }
}

console.log('[App.vue] Initial state - signed in:', !!user.value)

const loadUserRole = async () => {
  if (!user.value) {
    console.log('[App.vue] User not authenticated, skipping role load')
    isLoadingRole.value = false
    return
  }

  try {
    const householdId = localStorage.getItem('householdId')
    const userId = user.value.id

    console.log('[App.vue] Loading role - userId:', userId, 'householdId:', householdId)

    if (!householdId) {
      console.warn('[App.vue] No householdId in localStorage')
      isLoadingRole.value = false
      return
    }

    const response = await householdsAPI.getMembers(householdId)
    console.log('[App.vue] Members response:', response)

    if (!response.members || response.members.length === 0) {
      console.warn('[App.vue] No members found in household')
      isLoadingRole.value = false
      return
    }

    // Find current member - handle both camelCase and PascalCase id fields
    const currentMember = response.members.find(m =>
      (m.id === userId) || (m.Id === userId)
    )

    if (currentMember) {
      // Handle both camelCase and PascalCase role fields
      const role = currentMember.role || currentMember.Role
      console.log('[App.vue] Current member found:', currentMember, 'role:', role)
      userRole.value = role
    } else {
      console.warn('[App.vue] Current user not found in members list', {
        userId,
        memberIds: response.members.map(m => m.id || m.Id)
      })
    }
  } catch (err) {
    console.error('[App.vue] Failed to load user role:', err)
  } finally {
    isLoadingRole.value = false
  }
}

// Watch for user changes (user loads from checkAuth after router guard)
// Watch the id, not the object: auth can reassign the same user several times, which would reload the role each time
watch(() => user.value?.id, (userId) => {
  console.log('[App.vue] User changed:', userId)
  if (userId) {
    loadUserRole()
    loadFeatures()
    loadUserPreferences()
    loadNotifications()
  } else {
    userRole.value = null
    features.value = { allowMembers: false, allowHousehold: false, allowBalanceHistory: false, allowPlanning: false }
    userPreferences.value = { notificationsEnabled: true }
    notifications.value = []
    isLoadingRole.value = false
  }
})

onMounted(async () => {
  console.log('[App.vue] onMounted fired')
  handleEmailConfirmation()

  // Force checkAuth to ensure user is loaded
  await checkAuth()

  // If user loaded, role will be loaded by the watch
})

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
}

const handleLogout = async () => {
  await logout()
  userMenuOpen.value = false
}

const goToProfile = () => {
  router.push('/profile')
  userMenuOpen.value = false
}

const goHome = () => {
  if (user.value) {
    router.push('/dashboard')
  } else {
    router.push('/')
  }
}

// Notification bell: overdue and upcoming bills, and suspended automatic paychecks
const notifications = ref([])

const loadNotifications = async () => {
  try {
    const response = await notificationsApi.list()
    notifications.value = response.data ?? []
  } catch (err) {
    console.error('[App.vue] Could not load notifications', err)
  }
}

const notificationLocale = computed(() => (locale.value === 'fr' ? 'fr-CA' : 'en-CA'))

const notificationTitle = (item) => t(`notifications.kinds.${item.kind}`, { name: item.name })

const notificationSubtitle = (item) => {
  if (item.kind === 'AutomaticPaydaySuspended') return t('notifications.suspendedHint')

  // Dates are yyyy-mm-dd; reading them as local midnight keeps the day from shifting
  const date = new Date(`${item.dueDate}T00:00:00`).toLocaleDateString(notificationLocale.value, { day: 'numeric', month: 'long' })
  const amount = item.amount == null
    ? ''
    : ` · ${new Intl.NumberFormat(notificationLocale.value, { style: 'currency', currency: item.currency || 'CAD' }).format(item.amount)}`
  return `${t('notifications.dueOn', { date })}${amount}`
}

const notificationIcon = (item) => ({
  BillOverdue: 'mdi-alert-circle',
  BillDueSoon: 'mdi-calendar-clock',
  AutomaticPaydaySuspended: 'mdi-pause-circle'
})[item.kind]
</script>

<template>
  <v-app>
    <v-app-bar elevation="1" color="surface" class="navbar-custom">
      <!-- Logo -->
      <v-toolbar-title
        style="cursor: pointer; min-width: 120px; display: flex; align-items: center; gap: 0.5rem"
        @click="goHome"
        class="font-weight-bold"
      >
        <img src="/images/karo-icon.svg" alt="" aria-hidden="true" class="navbar-logo-icon" />
        <span class="navbar-logo-word">Karo</span>
      </v-toolbar-title>

      <!-- Desktop Navigation (hidden on mobile) -->
      <div v-if="$vuetify.display.mdAndUp && user" class="navbar-nav">
        <v-btn
          to="/dashboard"
          :active="route.path === '/dashboard'"
          variant="text"
          prepend-icon="mdi-view-dashboard"
          class="nav-btn"
        >
          {{ t('common.dashboard') }}
        </v-btn>

        <v-btn
          v-if="features.allowMembers"
          to="/members"
          :active="route.path === '/members'"
          variant="text"
          prepend-icon="mdi-account-multiple"
          class="nav-btn"
        >
          {{ t('common.members') }}
        </v-btn>

        <v-btn
          v-if="features.allowHousehold"
          to="/household"
          :active="route.path === '/household'"
          variant="text"
          prepend-icon="mdi-home-group"
          class="nav-btn"
        >
          {{ t('common.household') }}
        </v-btn>

        <v-btn
          to="/profile"
          :active="route.path === '/profile'"
          variant="text"
          prepend-icon="mdi-cog"
          class="nav-btn"
        >
          {{ t('common.setting') }}
        </v-btn>

        <v-btn
          v-if="!isLoadingRole && isAdmin"
          to="/admin/settings"
          :active="route.path.includes('/admin')"
          variant="text"
          prepend-icon="mdi-shield-admin"
          color="error"
          class="nav-btn"
        >
          Administration
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <!-- Notifications: paid plans that kept them on; refreshed each time the list opens -->
      <v-menu v-if="user && features.allowPlanning && userPreferences.notificationsEnabled" location="bottom end" @update:model-value="(open) => open && loadNotifications()">
        <template #activator="{ props }">
          <v-btn icon variant="text" :aria-label="t('notifications.title')" v-bind="props">
            <v-badge
              :model-value="notifications.length > 0"
              :content="notifications.length"
              :max="99"
              color="error"
              location="top end"
              offset-x="6"
              offset-y="6"
            >
              <v-icon icon="mdi-bell-outline"></v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-card class="notifications-card">
          <v-card-title class="notifications-title">{{ t('notifications.title') }}</v-card-title>
          <v-list v-if="notifications.length" density="compact" class="notifications-list">
            <v-list-item
              v-for="(item, index) in notifications"
              :key="index"
              :title="notificationTitle(item)"
              :subtitle="notificationSubtitle(item)"
              :prepend-icon="notificationIcon(item)"
              class="notification-item"
            ></v-list-item>
          </v-list>
          <v-card-text v-else class="text-medium-emphasis">{{ t('notifications.empty') }}</v-card-text>
        </v-card>
      </v-menu>

      <!-- Language Toggle -->
      <v-btn-group variant="text" class="lang-toggle">
        <v-btn
          :active="locale === 'fr'"
          @click="changeLanguage('fr')"
          size="small"
        >
          FR
        </v-btn>
        <v-btn
          :active="locale === 'en'"
          @click="changeLanguage('en')"
          size="small"
        >
          EN
        </v-btn>
      </v-btn-group>

      <!-- Login Button (shown when not authenticated) -->
      <div v-if="!user" class="auth-buttons">
        <v-btn
          to="/login"
          variant="text"
          prepend-icon="mdi-login"
        >
          {{ t('auth.login') }}
        </v-btn>
      </div>

      <!-- Mobile Menu Button (shown on mobile) -->
      <v-menu v-if="$vuetify.display.smAndDown && user">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-menu"
            variant="text"
            v-bind="props"
          ></v-btn>
        </template>
        <v-list density="compact">
          <v-list-item to="/dashboard" @click="drawer = false">
            <template #prepend>
              <v-icon>mdi-view-dashboard</v-icon>
            </template>
            <v-list-item-title>{{ t('common.dashboard') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="features.allowMembers" to="/members" @click="drawer = false">
            <template #prepend>
              <v-icon>mdi-account-multiple</v-icon>
            </template>
            <v-list-item-title>{{ t('common.members') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="features.allowHousehold" to="/household" @click="drawer = false">
            <template #prepend>
              <v-icon>mdi-home-group</v-icon>
            </template>
            <v-list-item-title>{{ t('common.household') }}</v-list-item-title>
          </v-list-item>
          <v-list-item to="/profile" @click="drawer = false">
            <template #prepend>
              <v-icon>mdi-cog</v-icon>
            </template>
            <v-list-item-title>{{ t('common.setting') }}</v-list-item-title>
          </v-list-item>
          <v-divider v-if="!isLoadingRole && isAdmin"></v-divider>
          <v-list-item v-if="!isLoadingRole && isAdmin" to="/admin/settings" @click="drawer = false">
            <template #prepend>
              <v-icon color="error">mdi-shield-admin</v-icon>
            </template>
            <v-list-item-title class="text-error">Administration</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Mobile Login Button (shown on mobile when not authenticated) -->
      <v-btn
        v-if="$vuetify.display.smAndDown && !user"
        to="/login"
        icon="mdi-login"
        variant="text"
      ></v-btn>

      <!-- User Menu -->
      <v-menu v-model="userMenuOpen" v-if="user">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-account-circle"
            size="large"
            v-bind="props"
            variant="text"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item disabled>
            <v-list-item-title class="text-caption">{{ user.email }}</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="goToProfile">
            <template #prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>{{ t('common.profile') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleLogout">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>{{ t('common.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
/* Logo: the wallet icon with the wordmark, larger than the default toolbar title */
.navbar-logo-icon {
  height: 44px;
  width: 44px;
  flex-shrink: 0;
}

.navbar-logo-word {
  font-size: 1.75rem;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

/* Notification list: fits the screen, scrolls when long, and wraps long titles instead of cutting them */
.notifications-card {
  width: min(380px, calc(100vw - 24px));
}

.notifications-title {
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 16px 4px;
}

.notifications-list {
  max-height: 60vh;
  overflow-y: auto;
  padding-bottom: 8px;
}

.notification-item :deep(.v-list-item-title),
.notification-item :deep(.v-list-item-subtitle) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

.navbar-custom {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 2rem;
}

.nav-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background-color: var(--surface);
  color: var(--primary);
}

.nav-btn.v-btn--active {
  background-color: #e3f2fd;
  color: var(--primary);
  font-weight: 600;
}

.lang-toggle {
  margin-right: 1rem;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}
</style>


<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from './composables/useAuth'
import { householdsAPI } from './api/households'

const router = useRouter()
const route = useRoute()
const { locale, t } = useI18n()
const { user, logout, handleEmailConfirmation, checkAuth } = useAuth()
const drawer = ref(true)
const userMenuOpen = ref(false)
const userRole = ref(null)
const isLoadingRole = ref(true)

const isAdmin = computed(() => userRole.value === 'Owner' || userRole.value === 'Admin')

console.log('[App.vue] Initial state - user.value:', user.value, 'householdId:', localStorage.getItem('householdId'))

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
  } else {
    userRole.value = null
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
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0">
          <defs>
            <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- House shape -->
          <path d="M14 2L4 11V24C4 25.1046 4.89543 26 6 26H22C23.1046 26 24 25.1046 24 24V11L14 2Z" fill="url(#homeGradient)" stroke="url(#homeGradient)" stroke-width="1.5" stroke-linejoin="round"/>
          <!-- Door -->
          <rect x="12" y="15" width="4" height="6" rx="0.5" fill="white" opacity="0.95"/>
          <!-- Door knob -->
          <circle cx="15.5" cy="18.5" r="0.8" fill="url(#homeGradient)"/>
        </svg>
        Karo
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
          to="/members"
          :active="route.path === '/members'"
          variant="text"
          prepend-icon="mdi-account-multiple"
          class="nav-btn"
        >
          {{ t('common.members') }}
        </v-btn>

        <v-btn
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
          <v-list-item to="/members" @click="drawer = false">
            <template #prepend>
              <v-icon>mdi-account-multiple</v-icon>
            </template>
            <v-list-item-title>{{ t('common.members') }}</v-list-item-title>
          </v-list-item>
          <v-list-item to="/household" @click="drawer = false">
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


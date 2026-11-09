<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import client from '../api/client'

const { t } = useI18n()
const router = useRouter()
const { householdId } = useAuth()

const email = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(false)

const handleInvite = async () => {
  if (!email.value) return

  loading.value = true
  error.value = null

  try {
    await client.post(`/households/${householdId.value}/invitations`, { email: email.value })
    success.value = true
    email.value = ''

    setTimeout(() => {
      router.push('/household')
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.error || err.message
    console.error('Error inviting user:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-4" style="max-width: 500px">
    <h1 class="text-h4 mb-4">{{ t('invitations.invite.title') }}</h1>

    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" class="mb-4">
      {{ t('invitations.invite.success') }}
    </v-alert>

    <v-form @submit.prevent="handleInvite">
      <v-text-field
        v-model="email"
        type="email"
        :label="t('invitations.invite.email')"
        :placeholder="t('invitations.invite.emailPlaceholder')"
        outlined
        class="mb-4"
        required
      ></v-text-field>

      <v-btn
        type="submit"
        color="primary"
        block
        :loading="loading"
        :disabled="!email"
      >
        {{ t('invitations.invite.submit') }}
      </v-btn>
    </v-form>

    <v-divider class="my-6"></v-divider>

    <router-link to="/household" class="text-decoration-none">
      <v-btn variant="text" block>
        {{ t('invitations.invite.back') }}
      </v-btn>
    </router-link>
  </v-container>
</template>

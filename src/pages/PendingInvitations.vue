<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import client from '../api/client'

const { t } = useI18n()
const router = useRouter()

const invitations = ref([])
const loading = ref(false)
const error = ref(null)

const loadInvitations = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await client.get('/households/invitations/pending')
    invitations.value = response.data
  } catch (err) {
    error.value = err.message
    console.error('Error loading invitations:', err)
  } finally {
    loading.value = false
  }
}

const acceptInvitation = async (invitationId) => {
  try {
    await client.post(`/households/invitations/${invitationId}/accept`)
    await loadInvitations()
    await router.push('/dashboard')
  } catch (err) {
    error.value = err.message
    console.error('Error accepting invitation:', err)
  }
}

const rejectInvitation = async (invitationId) => {
  // TODO: implement reject endpoint
  console.log('Reject invitation:', invitationId)
}

onMounted(() => {
  loadInvitations()
})
</script>

<template>
  <v-container class="py-4">
    <h1 class="text-h4 mb-4">{{ t('household.pendingInvitations') }}</h1>

    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

    <v-card v-if="!loading && invitations.length === 0" class="text-center py-8">
      <v-card-text>
        <p class="text-subtitle1">{{ t('household.noInvitations') }}</p>
      </v-card-text>
    </v-card>

    <v-row v-else>
      <v-col
        v-for="invitation in invitations"
        :key="invitation.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-card-text>
            <p class="text-subtitle2 mb-2">Invité par:</p>
            <p class="text-body2 mb-4">{{ invitation.invitedByEmail }}</p>
            <p class="text-caption text-grey">{{ new Date(invitation.createdAt).toLocaleDateString() }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              size="small"
              @click="rejectInvitation(invitation.id)"
            >
              Refuser
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              @click="acceptInvitation(invitation.id)"
            >
              Accepter
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

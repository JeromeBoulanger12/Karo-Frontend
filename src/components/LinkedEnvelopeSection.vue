<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../api/client'

const props = defineProps({
  envelope: {
    type: Object,
    required: true
  },
  allEnvelopes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['updated'])

const showLinkDialog = ref(false)
const selectedTargetEnvelope = ref(null)
const sharedPercentage = ref(50)
const loading = ref(false)
const error = ref(null)
const householdEnvelopes = ref([])

// Load all household envelopes when dialog opens (for linking purposes only)
const openLinkDialog = async () => {
  try {
    console.log('Loading household envelopes for linking...')
    const response = await client.get('/envelopes?includeLinked=true')
    console.log('Loaded envelopes:', response.data)
    householdEnvelopes.value = response.data
    console.log('Available envelopes to link:', availableEnvelopes.value)
  } catch (err) {
    console.error('Failed to load envelopes:', err)
    error.value = 'Failed to load envelopes for linking'
  }
  showLinkDialog.value = true
}

const availableEnvelopes = computed(() => {
  const filtered = householdEnvelopes.value.filter(e => {
    const isDifferent = e.id !== props.envelope.id
    const notAlreadyLinked = !e.linkedEnvelopeId
    const isShareable = e.isShareable === true
    return isDifferent && notAlreadyLinked && isShareable
  })
  return filtered
})

const linkEnvelope = async () => {
  if (!selectedTargetEnvelope.value) return

  loading.value = true
  error.value = null

  try {
    await client.post(`/envelopes/${props.envelope.id}/link`, {
      targetEnvelopeId: selectedTargetEnvelope.value,
      sharedPercentage: sharedPercentage.value
    })

    showLinkDialog.value = false
    emit('updated')
  } catch (err) {
    error.value = err.response?.data?.message || err.message
  } finally {
    loading.value = false
  }
}

const unlinkEnvelope = async () => {
  if (!confirm('Êtes-vous sûr de vouloir délier cette enveloppe?')) return

  loading.value = true
  error.value = null

  try {
    await client.post(`/envelopes/${props.envelope.id}/unlink`)
    emit('updated')
  } catch (err) {
    error.value = err.response?.data?.message || err.message
  } finally {
    loading.value = false
  }
}

const getLinkedEnvelopeName = () => {
  return props.allEnvelopes.find(e => e.id === props.envelope.linkedEnvelopeId)?.name
}

const getContributionAmount = () => {
  if (!props.envelope.linkedEnvelopeId || !props.envelope.sharedPercentage) return 0
  return props.envelope.balance * (props.envelope.sharedPercentage / 100)
}
</script>

<template>
  <v-card class="mt-4">
    <v-card-title>Enveloppe Liée</v-card-title>
    <v-card-text>
      <v-alert v-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>

      <div v-if="envelope.linkedEnvelopeId" class="mb-4">
        <p class="text-body2"><strong>Liée à:</strong> {{ getLinkedEnvelopeName() }}</p>
        <p class="text-body2"><strong>Contribution:</strong> {{ sharedPercentage }}%</p>
        <p class="text-body2"><strong>Montant:</strong> ${{ getContributionAmount().toFixed(2) }}</p>

        <v-btn
          color="error"
          variant="text"
          size="small"
          @click="unlinkEnvelope"
          :loading="loading"
          class="mt-2"
        >
          Délier cette enveloppe
        </v-btn>
      </div>

      <div v-else>
        <p class="text-body2 text-grey">Cette enveloppe n'est pas liée à une autre.</p>

        <v-btn
          color="primary"
          variant="flat"
          size="small"
          @click="openLinkDialog"
          class="mt-2"
        >
          Lier une enveloppe
        </v-btn>
      </div>
    </v-card-text>
  </v-card>

  <!-- Link Dialog -->
  <v-dialog v-model="showLinkDialog" width="500">
    <v-card>
      <v-card-title>Lier une enveloppe</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedTargetEnvelope"
          :items="availableEnvelopes"
          item-title="name"
          item-value="id"
          label="Sélectionnez une enveloppe"
          outlined
          class="mb-4"
        ></v-select>

        <v-slider
          v-model="sharedPercentage"
          label="Pourcentage partagé (%)"
          min="0"
          max="100"
          step="1"
          class="mb-4"
        ></v-slider>

        <p class="text-caption text-grey">
          Vous contribuerez {{ sharedPercentage }}% des montants dans cette enveloppe.
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="showLinkDialog = false"
          :disabled="loading"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="linkEnvelope"
          :loading="loading"
          :disabled="!selectedTargetEnvelope"
        >
          Lier
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

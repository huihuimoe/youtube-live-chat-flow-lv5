<template>
  <v-app>
    <v-main class="fill-height">
      <v-container fluid>
        <div class="subtitle-2">General</div>
        <general-section class="mt-3 mb-5 mx-3" />

        <div class="subtitle-2">Appearance</div>
        <appearance-section class="mt-3 mb-5 mx-3" />

        <div class="subtitle-2">Behavior</div>
        <behavior-section class="mt-3 mb-5 mx-3" />

        <div class="subtitle-2">Filter</div>
        <filter-section class="mt-3 mb-5 mx-3" />

        <div class="subtitle-2">Others</div>
        <others-section class="mt-3 mb-5 mx-3" />

        <div class="subtitle-2">Settings</div>
        <div class="settings-actions mt-3 mb-5 mx-3">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-export"
            @click="handleClickExport"
          >
            Export Settings
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-import"
            @click="handleClickImport"
          >
            Import Settings
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-restore"
            @click="handleClickReset"
          >
            Reset to Default
          </v-btn>
        </div>
      </v-container>

      <v-snackbar
        v-model="snackbarVisible"
        :color="snackbarColor"
        timeout="2400"
      >
        {{ snackbarMessage }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppearanceSection from '~/components/AppearanceSection.vue'
import BehaviorSection from '~/components/BehaviorSection.vue'
import FilterSection from '~/components/FilterSection.vue'
import GeneralSection from '~/components/GeneralSection.vue'
import OthersSection from '~/components/OthersSection.vue'
import { settingsStore } from '~/store'

const snackbarVisible = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const showSnackbar = (message: string, color: 'success' | 'error') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbarVisible.value = true
}

const runSettingsAction = async (
  action: () => void | Promise<void>,
  successMessage: string,
) => {
  try {
    await action()
    showSnackbar(successMessage, 'success')
  } catch {
    showSnackbar('Settings action failed', 'error')
  }
}

const handleClickExport = () => {
  void runSettingsAction(
    () => settingsStore.exportToClipboard(),
    'Settings exported to clipboard',
  )
}

const handleClickImport = () => {
  void runSettingsAction(
    () => settingsStore.importFromClipboard(),
    'Settings imported from clipboard',
  )
}

const handleClickReset = () => {
  settingsStore.resetState()
  showSnackbar('Settings reset to default', 'success')
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>

<style scoped>
.v-application {
  width: 640px;
}

.settings-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.settings-actions :deep(.v-btn__content) {
  min-width: 0;
  white-space: normal;
}

@media (max-width: 520px) {
  .v-application {
    width: 100%;
  }

  .settings-actions {
    grid-template-columns: 1fr;
  }
}
</style>

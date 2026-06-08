<template>
  <v-app>
    <v-main class="settings-main">
      <v-container fluid>
        <div class="settings-section-title">General</div>
        <general-section class="settings-section-body" />

        <div class="settings-section-title">Appearance</div>
        <appearance-section class="settings-section-body" />

        <div class="settings-section-title">Behavior</div>
        <behavior-section class="settings-section-body" />

        <div class="settings-section-title">Filter</div>
        <filter-section class="settings-section-body" />

        <div class="settings-section-title">Others</div>
        <others-section class="settings-section-body" />

        <div class="settings-section-title">Settings</div>
        <div class="settings-actions settings-section-body">
          <v-btn
            variant="tonal"
            prepend-icon="$export"
            @click="handleClickExport"
          >
            Export Settings
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="$import"
            @click="handleClickImport"
          >
            Import Settings
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="$restore"
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

.settings-main {
  min-height: 100%;
}

.settings-section-title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.375rem;
}

.settings-section-body {
  margin: 12px 12px 20px;
}

.settings-field-label {
  font-size: 0.75rem;
  line-height: 1.25rem;
}

.settings-inline-row {
  display: flex;
}

.settings-center-row {
  display: flex;
  align-items: center;
}

.settings-grow {
  flex-grow: 1;
  min-width: 0;
}

.settings-slider {
  align-items: center;
  margin-bottom: 20px;
}

.settings-flush-control {
  margin-top: 0;
  padding-top: 0;
}

.settings-value-field {
  width: 112px;
}

.settings-stacked-control {
  margin-top: 4px;
  padding-top: 0;
}

.settings-capitalize {
  text-transform: capitalize;
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

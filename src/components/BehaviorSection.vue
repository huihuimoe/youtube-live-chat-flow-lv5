<template>
  <div class="behavior-section">
    <div class="settings-field-label">Display Time</div>
    <v-slider
      v-model="displayTime"
      class="settings-slider"
      min="1"
      max="10"
      step="0.1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="displayTime"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="1"
          max="10"
          step="0.1"
          suffix="sec"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Delay Time</div>
    <v-slider
      v-model="delayTime"
      class="settings-slider"
      min="0"
      max="300"
      step="1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="delayTime"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="300"
          step="1"
          suffix="sec"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Max Lines</div>
    <v-slider
      v-model="maxLines"
      class="settings-slider"
      min="0"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="maxLines"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">
      Max Displays per second (Infinite if set to 0)
    </div>
    <v-slider
      v-model="maxDisplays"
      class="settings-slider"
      min="0"
      max="10"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="maxDisplays"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="100"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Stack Directions</div>
    <v-select
      v-model="stackDirection"
      :items="stackDirections"
      density="compact"
      single-line
      class="settings-stacked-control"
    />

    <div class="settings-field-label">Overflow Mode</div>
    <v-select
      v-model="overflow"
      :items="overflows"
      density="compact"
      single-line
      class="settings-stacked-control"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { settingsStore } from '~/store'

const stackDirections = [
  { title: 'Top to Bottom', value: 'top_to_bottom' },
  { title: 'Bottom to Top', value: 'bottom_to_top' },
]
const overflows = [
  { title: 'Hidden', value: 'hidden' },
  { title: 'Overlay', value: 'overlay' },
]

const delayTime = computed({
  get: () => {
    return settingsStore.delayTime
  },
  set: (value) => {
    settingsStore.setDelayTime({
      delayTime: Number(value),
    })
  },
})
const displayTime = computed({
  get: () => {
    return settingsStore.displayTime
  },
  set: (value) => {
    settingsStore.setDisplayTime({
      displayTime: Number(value),
    })
  },
})
const maxDisplays = computed({
  get: () => {
    return settingsStore.maxDisplays
  },
  set: (value) => {
    settingsStore.setMaxDisplays({
      maxDisplays: Number(value),
    })
  },
})
const maxLines = computed({
  get: () => {
    return settingsStore.maxLines
  },
  set: (value) => {
    settingsStore.setMaxLines({
      maxLines: Number(value),
    })
  },
})
const overflow = computed({
  get: () => {
    return settingsStore.overflow
  },
  set: (value) => {
    settingsStore.setOverflow({
      overflow: value,
    })
  },
})
const stackDirection = computed({
  get: () => {
    return settingsStore.stackDirection
  },
  set: (value) => {
    settingsStore.setStackDirection({
      stackDirection: value,
    })
  },
})
</script>

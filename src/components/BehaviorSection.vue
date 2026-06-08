<template>
  <div class="behavior-section">
    <div class="caption">Display Time</div>
    <v-slider
      v-model="displayTime"
      class="align-center mb-5"
      min="1"
      max="10"
      step="0.1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="displayTime"
          class="mt-0 pt-0"
          density="compact"
          hide-details
          single-line
          type="number"
          min="1"
          max="10"
          step="0.1"
          suffix="sec"
          style="width: 75px"
        />
      </template>
    </v-slider>

    <div class="caption">Delay Time</div>
    <v-slider
      v-model="delayTime"
      class="align-center mb-5"
      min="0"
      max="300"
      step="1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="delayTime"
          class="mt-0 pt-0"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="300"
          step="1"
          suffix="sec"
          style="width: 75px"
        />
      </template>
    </v-slider>

    <div class="caption">Max Lines</div>
    <v-slider
      v-model="maxLines"
      class="align-center mb-5"
      min="0"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="maxLines"
          class="mt-0 pt-0"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          style="width: 75px"
        />
      </template>
    </v-slider>

    <div class="caption">Max Displays per second (Infinite if set to 0)</div>
    <v-slider
      v-model="maxDisplays"
      class="align-center mb-5"
      min="0"
      max="10"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="maxDisplays"
          class="mt-0 pt-0"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="100"
          style="width: 75px"
        />
      </template>
    </v-slider>

    <div class="caption">Stack Directions</div>
    <v-select
      v-model="stackDirection"
      :items="stackDirections"
      density="compact"
      single-line
      class="mt-1 pt-0"
    />

    <div class="caption">Overflow Mode</div>
    <v-select
      v-model="overflow"
      :items="overflows"
      density="compact"
      single-line
      class="mt-1 pt-0"
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

<template>
  <div class="appearance-section">
    <div class="settings-inline-row">
      <div class="height-type-field">
        <div class="settings-field-label">Height</div>
        <v-select
          v-model="heightType"
          :items="heightTypes"
          density="compact"
          single-line
          class="settings-stacked-control"
          style="width: 120px"
        />
      </div>
      <div class="settings-grow">
        <template v-if="heightType === 'fixed'">
          <div class="settings-field-label">Line Height</div>
          <v-slider
            v-model="lineHeight"
            class="settings-slider"
            min="1"
            max="256"
            step="1"
            density="compact"
            hide-details
          >
            <template #prepend>
              <v-text-field
                v-model="lineHeight"
                class="settings-flush-control settings-value-field"
                density="compact"
                hide-details
                single-line
                type="number"
                min="1"
                max="256"
                step="1"
                suffix="px"
              />
            </template>
          </v-slider>
        </template>
        <template v-else>
          <div class="settings-field-label">Lines</div>
          <v-slider
            v-model="lines"
            class="settings-slider"
            min="1"
            max="64"
            step="1"
            density="compact"
            hide-details
          >
            <template #prepend>
              <v-text-field
                v-model="lines"
                class="settings-flush-control settings-value-field"
                density="compact"
                hide-details
                single-line
                type="number"
                min="1"
                max="64"
                step="1"
              />
            </template>
          </v-slider>
        </template>
      </div>
    </div>

    <div class="settings-field-label">Max Width (Infinite if set to 0)</div>
    <v-slider
      v-model="maxWidth"
      class="settings-slider"
      min="0"
      max="300"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="maxWidth"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="300"
          suffix="%"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Opacity</div>
    <v-slider
      v-model="opacity"
      class="settings-slider"
      min="0"
      max="1"
      step="0.1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="opacity"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="1"
          step="0.1"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">
      Show Background (for Non-paid Messages)
    </div>
    <v-switch
      v-model="background"
      class="settings-flush-control"
      density="compact"
    />

    <div class="settings-field-label">Background Opacity</div>
    <v-slider
      v-model="backgroundOpacity"
      class="settings-slider"
      min="0"
      max="1"
      step="0.1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="backgroundOpacity"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="1"
          step="0.1"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Outline Ratio</div>
    <v-slider
      v-model="outlineRatio"
      class="settings-slider"
      min="0"
      max="5"
      step="0.1"
      density="compact"
      hide-details
    >
      <template #prepend>
        <v-text-field
          v-model="outlineRatio"
          class="settings-flush-control settings-value-field"
          density="compact"
          hide-details
          single-line
          type="number"
          min="0"
          max="5"
          step="0.1"
          suffix="%"
        />
      </template>
    </v-slider>

    <div class="settings-field-label">Emoji Style</div>
    <v-select
      v-model="emojiStyle"
      :items="emojiStyles"
      density="compact"
      single-line
      class="settings-stacked-control"
    />

    <div class="settings-field-label">Extended Style</div>
    <v-textarea
      v-model="extendedStyle"
      placeholder='font-family: "Yu Gothic", YuGothic, Meiryo;'
      density="compact"
      single-line
      rows="1"
      auto-grow
      class="settings-stacked-control"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { settingsStore } from '~/store'

const heightTypes = [
  { title: 'Flexible', value: 'flexible' },
  { title: 'Fixed', value: 'fixed' },
]

const emojiStyles = [
  { title: 'Image', value: 'image' },
  { title: 'Alternative Text', value: 'text' },
  { title: 'None', value: 'none' },
]

const background = computed({
  get: () => {
    return settingsStore.background
  },
  set: (value) => {
    settingsStore.setBackground({
      background: value,
    })
  },
})
const backgroundOpacity = computed({
  get: () => {
    return settingsStore.backgroundOpacity
  },
  set: (value) => {
    settingsStore.setBackgroundOpacity({
      backgroundOpacity: Number(value),
    })
  },
})
const emojiStyle = computed({
  get: () => {
    return settingsStore.emojiStyle
  },
  set: (value) => {
    settingsStore.setEmojiStyle({
      emojiStyle: value,
    })
  },
})
const extendedStyle = computed({
  get: () => {
    return settingsStore.extendedStyle
  },
  set: (value) => {
    settingsStore.setExtendedStyle({
      extendedStyle: value,
    })
  },
})
const heightType = computed({
  get: () => {
    return settingsStore.heightType
  },
  set: (value) => {
    settingsStore.setHeightType({
      heightType: value,
    })
  },
})
const lineHeight = computed({
  get: () => {
    return settingsStore.lineHeight
  },
  set: (value) => {
    settingsStore.setLineHeight({
      lineHeight: Number(value),
    })
  },
})
const lines = computed({
  get: () => {
    return settingsStore.lines
  },
  set: (value) => {
    settingsStore.setLines({
      lines: Number(value),
    })
  },
})
const maxWidth = computed({
  get: () => {
    return settingsStore.maxWidth
  },
  set: (value) => {
    settingsStore.setMaxWidth({
      maxWidth: Number(value),
    })
  },
})
const opacity = computed({
  get: () => {
    return settingsStore.opacity
  },
  set: (value) => {
    settingsStore.setOpacity({
      opacity: Number(value),
    })
  },
})
const outlineRatio = computed({
  get: () => {
    return (settingsStore.outlineRatio * 1000) / 10
  },
  set: (value) => {
    settingsStore.setOutlineRatio({
      outlineRatio: (Number(value) * 10) / 1000,
    })
  },
})
</script>

<style scoped>
.height-type-field {
  margin-right: 12px;
}
</style>

<template>
  <div class="general-section">
    <div
      v-for="authorType in authorTypes"
      :key="authorType"
      class="d-flex align-center"
    >
      <div class="caption text-capitalize" style="width: 100px">
        {{ authorType }}
      </div>
      <v-btn
        :color="isVisible(authorType) ? 'primary' : 'grey'"
        variant="text"
        icon
        @click="handleClickVisibility(authorType)"
      >
        <v-icon>mdi-eye</v-icon>
      </v-btn>
      <v-btn
        :color="isAvatar(authorType) ? 'primary' : 'grey'"
        variant="text"
        icon
        @click="handleClickAvatar(authorType)"
      >
        <v-icon>mdi-account-circle</v-icon>
      </v-btn>
      <div
        class="color-picker mx-2"
        :style="{ backgroundColor: getColor(authorType) }"
      >
        <v-text-field
          :model-value="getColor(authorType)"
          class="mt-0 pt-0"
          type="color"
          hide-details
          @update:model-value="(value) => setColor(authorType, String(value))"
        />
      </div>
      <v-select
        :model-value="getTemplate(authorType)"
        :items="templates"
        density="compact"
        hide-details
        class="mt-0 pt-0 ml-2 caption flex-grow-1"
        @update:model-value="
          (value) => setTemplate(authorType, value as Template)
        "
      />
    </div>
    <div
      v-for="messageType in messageTypes"
      :key="messageType"
      class="d-flex align-center"
    >
      <div class="caption text-capitalize" style="width: 100px">
        {{ getTitle(messageType) }}
      </div>
      <v-btn
        :color="isVisible(messageType) ? 'primary' : 'grey'"
        variant="text"
        icon
        @click="handleClickVisibility(messageType)"
      >
        <v-icon>mdi-eye</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AuthorType, MessageType, Template } from '~/models'
import { settingsStore } from '~/store'

const authorTypes = ['guest', 'member', 'moderator', 'owner', 'you'] as const
const messageTypes = ['super-chat', 'super-sticker', 'membership'] as const
const templates = [
  { title: '1 line (without Author)', value: 'one-line-without-author' },
  { title: '1 line (with Author)', value: 'one-line-with-author' },
  { title: '2 lines', value: 'two-line' },
]

const getColor = (authorType: AuthorType) => {
  return settingsStore.styles[authorType].color
}
const setColor = (authorType: AuthorType, color: string) => {
  return settingsStore.updateStyle({ authorType, color })
}
const getTemplate = (authorType: AuthorType) => {
  return settingsStore.styles[authorType].template
}
const setTemplate = (authorType: AuthorType, template: Template) => {
  return settingsStore.updateStyle({ authorType, template })
}
const isVisible = (type: AuthorType | MessageType) => {
  return settingsStore.visibilities[type]
}
const isAvatar = (authorType: AuthorType) => {
  return settingsStore.styles[authorType].avatar
}
const getTitle = (messageType: MessageType) => {
  return messageType.replace('-', ' ')
}

const handleClickVisibility = (type: AuthorType | MessageType) => {
  const visibility = !settingsStore.visibilities[type]
  return settingsStore.setVisibility({ type, visibility })
}
const handleClickAvatar = (authorType: AuthorType) => {
  const style = settingsStore.styles[authorType]
  return settingsStore.updateStyle({ authorType, avatar: !style.avatar })
}
</script>

<style scoped>
.color-picker {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid grey;
  position: relative;
}

.color-picker > .v-text-field {
  position: absolute;
  margin: 0 !important;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.color-picker > .v-text-field :deep(input) {
  cursor: pointer;
  height: 24px;
}
</style>

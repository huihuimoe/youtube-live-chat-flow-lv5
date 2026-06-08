import { defineStore } from 'pinia'
import {
  AuthorType,
  EmojiStyle,
  HeightType,
  MessageType,
  Overflow,
  Settings,
  StackDirection,
  Style,
} from '~/models'
import { serializeSettings } from '~/store/persistence'

export { serializeSettings }

export const createInitialSettings = (): Settings => ({
  background: false,
  backgroundOpacity: 0.4,
  chatVisible: true,
  delayTime: 0,
  displayTime: 5,
  emojiStyle: 'image',
  extendedStyle: '',
  heightType: 'flexible',
  lineHeight: 64,
  lines: 12,
  maxDisplays: 0,
  maxLines: 0,
  maxWidth: 200,
  opacity: 0.8,
  outlineRatio: 0.015,
  overflow: 'overlay',
  stackDirection: 'top_to_bottom',
  styles: {
    guest: {
      avatar: false,
      color: '#ffffff',
      template: 'one-line-without-author',
    },
    member: {
      avatar: true,
      color: '#ccffcc',
      template: 'one-line-without-author',
    },
    moderator: {
      avatar: true,
      color: '#ccccff',
      template: 'two-line',
    },
    owner: {
      avatar: true,
      color: '#ffffcc',
      template: 'two-line',
    },
    you: {
      avatar: true,
      color: '#ffcccc',
      template: 'one-line-with-author',
    },
  },
  visibilities: {
    guest: true,
    member: true,
    moderator: true,
    owner: true,
    you: true,
    'super-chat': true,
    'super-sticker': true,
    membership: true,
  },
})

export const parseSettingsJson = (value: string): Settings => {
  return JSON.parse(value) as Settings
}

export const useSettingsStore = defineStore('settings', {
  state: createInitialSettings,
  actions: {
    updateStyle({
      authorType,
      ...params
    }: { authorType: AuthorType } & Partial<Style>) {
      this.styles = {
        ...this.styles,
        [authorType]: {
          ...this.styles[authorType],
          ...params,
        },
      }
    },
    setVisibility({
      type,
      visibility,
    }: {
      type: AuthorType | MessageType
      visibility: boolean
    }) {
      this.visibilities[type] = visibility
    },
    setBackground({ background }: { background: boolean }) {
      this.background = background
    },
    setBackgroundOpacity({ backgroundOpacity }: { backgroundOpacity: number }) {
      this.backgroundOpacity = backgroundOpacity
    },
    setChatVisible({ chatVisible }: { chatVisible: boolean }) {
      this.chatVisible = chatVisible
    },
    setDelayTime({ delayTime }: { delayTime: number }) {
      this.delayTime = delayTime
    },
    setDisplayTime({ displayTime }: { displayTime: number }) {
      this.displayTime = displayTime
    },
    setEmojiStyle({ emojiStyle }: { emojiStyle: EmojiStyle }) {
      this.emojiStyle = emojiStyle
    },
    setExtendedStyle({ extendedStyle }: { extendedStyle: string }) {
      this.extendedStyle = extendedStyle
    },
    setHeightType({ heightType }: { heightType: HeightType }) {
      this.heightType = heightType
    },
    setLineHeight({ lineHeight }: { lineHeight: number }) {
      this.lineHeight = lineHeight
    },
    setLines({ lines }: { lines: number }) {
      this.lines = lines
    },
    setMaxDisplays({ maxDisplays }: { maxDisplays: number }) {
      this.maxDisplays = maxDisplays
    },
    setMaxLines({ maxLines }: { maxLines: number }) {
      this.maxLines = maxLines
    },
    setMaxWidth({ maxWidth }: { maxWidth: number }) {
      this.maxWidth = maxWidth
    },
    setOpacity({ opacity }: { opacity: number }) {
      this.opacity = opacity
    },
    setOutlineRatio({ outlineRatio }: { outlineRatio: number }) {
      this.outlineRatio = outlineRatio
    },
    setOverflow({ overflow }: { overflow: Overflow }) {
      this.overflow = overflow
    },
    setStackDirection({ stackDirection }: { stackDirection: StackDirection }) {
      this.stackDirection = stackDirection
    },
    async exportToClipboard() {
      await navigator.clipboard.writeText(serializeSettings(this.$state))
    },
    async importFromClipboard() {
      const value = await navigator.clipboard.readText()
      this.$patch(parseSettingsJson(value))
    },
    resetState() {
      this.$patch(createInitialSettings())
    },
  },
})

import Color from 'color'
import { AuthorType, Message, Settings } from '~/models'
import { setBoundedCacheValue } from '~/utils/bounded-cache'

const MAX_BACKGROUND_COLOR_CACHE_SIZE = 100

export default class MessageSettings {
  private message: Message
  private settings: Settings
  private yourName: string
  private static backgroundColorCache = new Map<string, string | undefined>()

  constructor(message: Message, settings: Settings, yourName: string) {
    this.message = message
    this.settings = settings
    this.yourName = yourName
  }

  private get authorType() {
    const author = this.message.author
    const you = author && author === this.yourName
    const authorType = you ? 'you' : (this.message.authorType ?? 'guest')
    return (
      ['guest', 'member', 'moderator', 'owner', 'you'].includes(authorType)
        ? authorType
        : 'guest'
    ) as AuthorType
  }

  private get paid() {
    return ['paid-message', 'paid-sticker', 'membership-item'].includes(
      this.message.messageType ?? '',
    )
  }

  private get style() {
    return this.settings.styles[this.authorType]
  }

  get template() {
    switch (this.message.messageType) {
      case 'text-message':
        return this.settings.visibilities[this.authorType]
          ? this.style.template === 'two-line'
            ? 'two-line-message'
            : 'one-line-message'
          : undefined
      case 'paid-message':
        return this.settings.visibilities['super-chat']
          ? 'two-line-message'
          : undefined
      case 'paid-sticker':
        return this.settings.visibilities['super-sticker']
          ? 'sticker'
          : undefined
      case 'membership-item':
        return this.settings.visibilities['membership']
          ? 'two-line-message'
          : undefined
    }
  }

  get author() {
    switch (this.message.messageType) {
      case 'text-message':
        return this.style.template !== 'one-line-without-author'
      case 'paid-message':
        return true
      case 'paid-sticker':
        return true
      case 'membership-item':
        return true
      default:
        return false
    }
  }

  get avatar() {
    return this.paid ? true : this.style.avatar
  }

  get fontColor() {
    return this.paid ? '#ffffff' : this.style.color
  }

  get fontStyle() {
    return this.settings.extendedStyle
  }

  get backgroundColor() {
    const backgroundColor = this.paid
      ? this.message.backgroundColor
      : this.settings.background
        ? 'black'
        : undefined

    if (!backgroundColor) {
      return undefined
    }

    const cacheKey = `${backgroundColor}:${this.settings.backgroundOpacity}`
    if (MessageSettings.backgroundColorCache.has(cacheKey)) {
      return MessageSettings.backgroundColorCache.get(cacheKey)
    }

    try {
      const o = new Color(backgroundColor).object()
      const opacity = this.settings.backgroundOpacity
      const color = `rgba(${o.r}, ${o.g}, ${o.b}, ${opacity})`
      return setBoundedCacheValue(
        MessageSettings.backgroundColorCache,
        cacheKey,
        color,
        MAX_BACKGROUND_COLOR_CACHE_SIZE,
      )
    } catch {
      // Invalid custom colors should not break message rendering.
      return setBoundedCacheValue(
        MessageSettings.backgroundColorCache,
        cacheKey,
        undefined,
        MAX_BACKGROUND_COLOR_CACHE_SIZE,
      )
    }
  }
}

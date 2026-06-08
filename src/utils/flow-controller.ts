import { Message, Settings } from '~/models'
import { querySelectorAsync, waitLayoutImagesLoaded } from '~/utils/dom-helper'
import {
  createTransformKeyframes,
  findTimelineIndex,
  getTimelineCapacity,
  pruneTimelines,
} from '~/utils/flow-layout'
import type { Timeline } from '~/utils/flow-layout'
import MessageSettings from '~/utils/message-settings'
import { parse } from '~/utils/message-parser'
import { render } from '~/utils/message-renderer'

const ClassName = {
  filterActivated: 'ylcfr-active',
  filteredMessage: 'ylcfr-filtered-message',
  deletedMessage: 'ylcfr-deleted-message',
}

const MAX_MESSAGES_STARTED_PER_FRAME = 4
const DEFAULT_PENDING_LIMIT = 60
const PENDING_LIMIT_STACKS = 2
const YOUR_NAME_CACHE_MILLIS = 1000

type LayoutTargets = {
  video: HTMLVideoElement
  container: HTMLElement
}

type LayoutMetrics = {
  videoHeight: number
  containerWidth: number
}

class Limiter {
  private limits: number
  private count = 0
  private expireTime = Date.now()

  constructor(limits: number) {
    this.limits = limits
  }

  isOver() {
    const now = Date.now()
    if (now > this.expireTime) {
      this.count = 0
      this.expireTime = now + 1000
    }
    return ++this.count > this.limits
  }
}

export default class FlowController {
  private _enabled = false
  private _following = false
  private _settings: Settings | undefined
  private timelines: Timeline[][] = []
  private observer: MutationObserver | undefined
  private resizeObserver: ResizeObserver | undefined
  private followingTimer = -1
  private cleanupTimer = -1
  private observeGeneration = 0
  private pendingFrame = -1
  private limiter: Limiter | undefined
  private pendingElements: HTMLElement[] = []
  private activeMessages = new Set<HTMLElement>()
  private renderingMessages = 0
  private reusableMessages: HTMLElement[] = []
  private layoutQueue = Promise.resolve()
  private video: HTMLVideoElement | undefined
  private container: HTMLElement | undefined
  private observedVideo: HTMLVideoElement | undefined
  private observedContainer: HTMLElement | undefined
  private metrics: LayoutMetrics = {
    containerWidth: 0,
    videoHeight: 0,
  }
  private cachedYourName = ''
  private yourNameExpiresAt = 0

  get enabled() {
    return this._enabled
  }

  set enabled(value: boolean) {
    this._enabled = value
    if (!this._enabled) {
      this.clear()
    }
  }

  get following() {
    return this._following
  }

  set following(value: boolean) {
    this._following = value
    clearInterval(this.followingTimer)
    if (value) {
      const scrollToBottom = () => {
        const hovered = !!document.querySelector('#chat:hover')
        if (hovered) {
          return
        }
        const scroller = document.querySelector('#item-scroller')
        if (scroller) {
          scroller.scrollTop = scroller.scrollHeight
        }
      }
      scrollToBottom()
      this.followingTimer = window.setInterval(scrollToBottom, 1000)
    }
  }

  get settings() {
    return this._settings
  }

  set settings(value: Settings | undefined) {
    this._settings = value
    this.limiter = new Limiter(value?.maxDisplays ?? 0)
  }

  private enqueue(element: HTMLElement) {
    this.pendingElements.push(element)
    const overflow = this.pendingElements.length - this.getPendingLimit()
    if (overflow > 0) {
      this.pendingElements.splice(0, overflow)
    }
    this.schedulePendingMessages()
  }

  private getPendingLimit() {
    if (!this.settings) {
      return DEFAULT_PENDING_LIMIT
    }

    const metrics = this.getMetrics()
    const [lines] = this.getLinesAndHeight(metrics.videoHeight, this.settings)
    if (lines <= 0) {
      return DEFAULT_PENDING_LIMIT
    }

    return Math.max(
      MAX_MESSAGES_STARTED_PER_FRAME,
      getTimelineCapacity(lines, this.settings.overflow) * PENDING_LIMIT_STACKS,
    )
  }

  private schedulePendingMessages() {
    if (this.pendingFrame !== -1) {
      return
    }

    this.pendingFrame = window.requestAnimationFrame(() => {
      this.pendingFrame = -1
      const elements = this.pendingElements.splice(
        0,
        MAX_MESSAGES_STARTED_PER_FRAME,
      )
      elements.forEach((element) => {
        void this.proceed(element)
      })
      if (this.pendingElements.length > 0) {
        this.schedulePendingMessages()
      }
    })
  }

  private queueLayout(task: () => void) {
    const next = this.layoutQueue.then(task, task)
    this.layoutQueue = next.catch(() => undefined)
    return next
  }

  private getLayoutTargets(): LayoutTargets | undefined {
    if (!this.video?.isConnected) {
      this.video =
        parent.document.querySelector<HTMLVideoElement>(
          'ytd-watch-flexy video.html5-main-video',
        ) ?? undefined
    }
    if (!this.container?.isConnected) {
      this.container =
        parent.document.querySelector<HTMLElement>('.html5-video-container') ??
        undefined
    }
    if (!this.video || !this.container) {
      return undefined
    }

    this.observeLayoutTargets(this.video, this.container)
    return {
      container: this.container,
      video: this.video,
    }
  }

  private observeLayoutTargets(
    video: HTMLVideoElement,
    container: HTMLElement,
  ) {
    if (this.observedVideo === video && this.observedContainer === container) {
      return
    }

    this.resizeObserver?.disconnect()
    this.observedVideo = video
    this.observedContainer = container
    this.resizeObserver = new ResizeObserver(() => {
      this.refreshMetrics()
    })
    this.resizeObserver.observe(video)
    this.resizeObserver.observe(container)
    this.refreshMetrics()
  }

  private refreshMetrics() {
    if (!this.video || !this.container) {
      return
    }

    const videoRect = this.video.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()
    this.metrics = {
      containerWidth: containerRect.width || this.container.offsetWidth,
      videoHeight: videoRect.height || this.video.offsetHeight,
    }
  }

  private getMetrics() {
    if (!this.metrics.containerWidth || !this.metrics.videoHeight) {
      this.refreshMetrics()
    }
    return this.metrics
  }

  private async proceed(element: HTMLElement) {
    if (!this._enabled || !this.settings) {
      return
    }

    const targets = this.getLayoutTargets()
    if (!targets || targets.video.paused) {
      return
    }

    const metrics = this.getMetrics()
    const [lines, height] = this.getLinesAndHeight(
      metrics.videoHeight,
      this.settings,
    )
    if (lines <= 0) {
      return
    }

    const activeLimit = getTimelineCapacity(lines, this.settings.overflow)
    if (!this.reserveFlowMessageSlot(activeLimit)) {
      return
    }

    let queuedForLayout = false
    try {
      const deleted = await this.validateDeletedMessage(element)
      if (deleted) {
        return
      }

      const message = await parse(element)
      if (!message) {
        return
      }

      if (this.settings.maxDisplays > 0 && this.limiter?.isOver()) {
        return
      }

      const me = await this.createMessageElement(message, height, this.settings)
      if (!me) {
        return
      }

      await waitLayoutImagesLoaded(me)

      queuedForLayout = true
      void this.queueLayout(() => {
        this.releaseFlowMessageSlot()
        this.layoutAndAnimateMessage(me)
      }).catch(() => {
        this.recycleFlowMessage(me)
      })
    } finally {
      if (!queuedForLayout) {
        this.releaseFlowMessageSlot()
      }
    }
  }

  private getLinesAndHeight(videoHeight: number, settings: Settings) {
    let lines, height
    if (settings.heightType === 'fixed') {
      height = settings.lineHeight
      lines = Math.floor((videoHeight - height * 0.2) / height)
    } else {
      lines = settings.lines
      height = videoHeight / (lines + 0.2)
    }
    lines = settings.maxLines > 0 ? Math.min(settings.maxLines, lines) : lines
    return [lines, height]
  }

  private async validateDeletedMessage(element: HTMLElement) {
    const active = document.documentElement.classList.contains(
      ClassName.filterActivated,
    )
    if (!active) {
      return false
    }
    if (element.classList.contains(ClassName.filteredMessage)) {
      return element.classList.contains(ClassName.deletedMessage)
    }

    const deleted = await new Promise<boolean>((resolve) => {
      let resolved = false
      const complete = () => {
        if (resolved) {
          return
        }
        resolved = true
        clearTimeout(timer)
        observer.disconnect()
        resolve(element.classList.contains(ClassName.deletedMessage))
      }
      const observer = new MutationObserver(() => {
        if (element.classList.contains(ClassName.filteredMessage)) {
          complete()
        }
      })
      const timer = window.setTimeout(complete, 1000)

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class'],
      })
    })
    return deleted
  }

  private getYourName() {
    const now = Date.now()
    if (now < this.yourNameExpiresAt) {
      return this.cachedYourName
    }

    this.cachedYourName = this.resolveYourName()
    this.yourNameExpiresAt = now + YOUR_NAME_CACHE_MILLIS
    return this.cachedYourName
  }

  private resolveYourName() {
    const span = document.querySelector('#input-container span#author-name')
    if (span?.textContent) {
      return span.textContent
    }

    const movedSpan = parent.document.querySelector(
      '#input-container span#author-name',
    )
    if (movedSpan?.textContent) {
      return movedSpan.textContent
    }

    const button = parent.document.querySelector<HTMLElement>(
      '.html5-video-player .ytp-chrome-top-buttons .ytp-watch-later-button',
    )
    return (
      button?.getAttribute('title')?.replace(' として後で再生します', '') ?? ''
    )
  }

  private async createMessageElement(
    message: Message,
    height: number,
    settings: Settings,
  ) {
    const ms = new MessageSettings(message, settings, this.getYourName())
    if (!ms.template) {
      return null
    }

    const reusableElement = this.reusableMessages.pop()
    const element = render(
      ms.template,
      {
        ...message,
        author: ms.author ? message.author : undefined,
        avatarUrl: ms.avatar ? message.avatarUrl : undefined,
        fontColor: ms.fontColor,
        fontStyle: ms.fontStyle,
        backgroundColor: ms.backgroundColor,
        height,
        width: settings.maxWidth,
        outlineRatio: settings.outlineRatio,
        emojiStyle: settings.emojiStyle,
      },
      reusableElement,
    )

    if (!element) {
      if (reusableElement) {
        this.recycleFlowMessage(reusableElement)
      }
      return null
    }

    element.classList.add('ylcf-flow-message')
    element.style.visibility = 'hidden'

    return element
  }

  private layoutAndAnimateMessage(element: HTMLElement) {
    const settings = this.settings
    const targets = this.getLayoutTargets()
    if (!settings || !targets || targets.video.paused) {
      this.recycleFlowMessage(element)
      return
    }

    const metrics = this.getMetrics()
    const [lines, height] = this.getLinesAndHeight(
      metrics.videoHeight,
      settings,
    )
    const activeLimit = getTimelineCapacity(lines, settings.overflow)
    if (lines <= 0 || this.getFlowMessageLoad() >= activeLimit) {
      this.recycleFlowMessage(element)
      return
    }

    element.style.visibility = 'hidden'
    targets.container.appendChild(element)

    const rect = element.getBoundingClientRect()
    const messageRows = Math.max(1, Math.ceil(rect.height / Math.ceil(height)))
    const timeline = this.createTimeline(
      rect.width,
      metrics.containerWidth,
      settings,
    )
    const index = findTimelineIndex({
      lines,
      messageRows,
      overflow: settings.overflow,
      timeline,
      timelines: this.timelines,
    })
    if (index === undefined) {
      this.recycleFlowMessage(element)
      return
    }

    this.pushTimeline(timeline, index, messageRows)

    const z = Math.floor(index / lines)
    const y = (index % lines) + (z % 2 > 0 ? 0.5 : 0)
    const opacity = settings.opacity ** (z + 1)
    const top =
      settings.stackDirection === 'bottom_to_top'
        ? metrics.videoHeight - height * (y + messageRows + 0.1)
        : height * (y + 0.1)
    const keyframes = createTransformKeyframes(
      metrics.containerWidth,
      rect.width,
      top,
    )

    element.style.transform = keyframes[0].transform
    element.style.opacity = String(opacity)
    element.style.zIndex = String(z + 1 + 11) // 11 is set to z-index on div.webgl
    element.style.visibility = ''

    const animation = this.createAnimation(element, keyframes, settings)
    this.activeMessages.add(element)
    animation.onfinish = () => {
      this.recycleFlowMessage(element)
    }
    animation.play()
  }

  private createTimeline(
    messageWidth: number,
    containerWidth: number,
    settings: Settings,
  ) {
    const displayMillis = settings.displayTime * 1000
    const delayMillis = settings.delayTime * 1000
    const v = (containerWidth + messageWidth) / displayMillis
    const t = messageWidth / v
    const n = Date.now()

    return {
      willAppear: n + delayMillis,
      didAppear: n + t + delayMillis,
      willDisappear: n + displayMillis - t + delayMillis,
      didDisappear: n + displayMillis + delayMillis,
    }
  }

  private createAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    settings: Settings,
  ) {
    const animation = element.animate(keyframes, {
      delay: settings.delayTime * 1000,
      duration: settings.displayTime * 1000,
    })
    animation.pause()
    return animation
  }

  private pushTimeline(timeline: Timeline, index: number, messageRows: number) {
    Array.from({ length: messageRows }).forEach((_, j) => {
      const i = index + j
      if (!this.timelines[i]) {
        this.timelines[i] = []
      }
      this.timelines[i].push(timeline)
    })
  }

  private getFlowMessageLoad() {
    return this.activeMessages.size + this.renderingMessages
  }

  private reserveFlowMessageSlot(activeLimit: number) {
    if (this.getFlowMessageLoad() >= activeLimit) {
      return false
    }
    this.renderingMessages += 1
    return true
  }

  private releaseFlowMessageSlot() {
    this.renderingMessages = Math.max(0, this.renderingMessages - 1)
  }

  private recycleFlowMessage(element: HTMLElement) {
    this.activeMessages.delete(element)
    if (!this._enabled) {
      this.clearFlowMessage(element)
      return
    }
    element.getAnimations?.().forEach((animation) => {
      animation.cancel()
    })
    element.style.opacity = ''
    element.style.transform = ''
    element.style.visibility = 'hidden'
    element.style.zIndex = ''
    if (!this.reusableMessages.includes(element)) {
      this.reusableMessages.push(element)
    }
  }

  private clearFlowMessage(element: Element) {
    element.getAnimations?.().forEach((animation) => {
      animation.cancel()
    })
    element.remove()
  }

  async observe() {
    const generation = ++this.observeGeneration
    this.observer?.disconnect()
    this.observer = undefined
    clearInterval(this.cleanupTimer)
    this.cleanupTimer = -1

    const items = await querySelectorAsync(
      '#items.yt-live-chat-item-list-renderer',
    )
    if (generation !== this.observeGeneration) {
      return
    }
    if (!items) {
      return
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const nodes = Array.from(mutation.addedNodes)
        nodes.forEach((node: Node) => {
          if (node instanceof HTMLElement) {
            this.enqueue(node)
          }
        })
      })
    })
    this.observer.observe(items, { childList: true })

    this.cleanupTimer = window.setInterval(() => {
      this.timelines = pruneTimelines(this.timelines, Date.now())
    }, 1000)
  }

  disconnect() {
    this.observeGeneration++
    clearInterval(this.cleanupTimer)
    this.cleanupTimer = -1
    clearInterval(this.followingTimer)
    this.observer?.disconnect()
    this.observer = undefined
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
    this.observedVideo = undefined
    this.observedContainer = undefined
    this.video = undefined
    this.container = undefined
    this.metrics = {
      containerWidth: 0,
      videoHeight: 0,
    }
    this.clear()
  }

  play() {
    this.activeMessages.forEach((element) => {
      element.getAnimations().forEach((animation) => animation.play())
    })
  }

  pause() {
    this.activeMessages.forEach((element) => {
      element.getAnimations().forEach((animation) => animation.pause())
    })
  }

  clear() {
    if (this.pendingFrame !== -1) {
      window.cancelAnimationFrame(this.pendingFrame)
      this.pendingFrame = -1
    }
    this.pendingElements = []
    this.activeMessages.forEach((element) => {
      this.clearFlowMessage(element)
    })
    this.reusableMessages.forEach((element) => {
      this.clearFlowMessage(element)
    })
    parent.document
      .querySelectorAll('.ylcf-flow-message')
      .forEach((element) => {
        this.clearFlowMessage(element)
      })
    this.activeMessages.clear()
    this.renderingMessages = 0
    this.reusableMessages = []
    this.timelines = []
  }
}

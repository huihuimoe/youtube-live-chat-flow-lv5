import FlowController from '~/utils/flow-controller'
import chat from '~/assets/chat.svg?raw'
import downArrow from '~/assets/down-arrow.svg?raw'
import refresh from '~/assets/refresh.svg?raw'
import { querySelectorAsync } from '~/utils/dom-helper'

const controller = new FlowController()
let observer: MutationObserver | undefined
let playerObserver: MutationObserver | undefined
let playerSyncFrame: number | undefined
let playbackVideo: HTMLVideoElement | undefined

const menuButtonConfigs = [
  {
    svg: downArrow,
    title: 'Follow New Messages',
    className: 'ylcf-follow-button',
    onclick: async () =>
      await chrome.runtime.sendMessage({ type: 'menu-button-clicked' }),
    isActive: () => controller.following,
  },
  {
    svg: refresh,
    title: 'Reload Frame',
    className: 'ylcf-reload-button',
    onclick: () => window.location.reload(),
    isActive: () => false,
  },
]

const updateControlButton = () => {
  const button = parent.document.querySelector('.ylcf-control-button')
  if (button) {
    button.setAttribute('aria-pressed', String(controller.enabled))
  }
}

const removeControlButton = () => {
  const button = parent.document.querySelector('.ylcf-control-button')
  if (button) {
    button.remove()
  }
}

const findDirectChild = (parent: Element, selector: string) =>
  Array.from(parent.children).find((child) => child.matches(selector))

const insertControlButton = (controls: Element, button: HTMLButtonElement) => {
  /**
   * Newer YouTube layouts put part of the right controls in a nested
   * `.ytp-right-controls-left` group. `insertBefore` only accepts direct
   * children, so references must be resolved inside the actual target parent.
   */
  const target =
    findDirectChild(controls, '.ytp-right-controls-left') ?? controls
  const referenceButton =
    findDirectChild(target, '.ytp-settings-button') ??
    findDirectChild(target, '.ytp-fullscreen-button') ??
    findDirectChild(target, '.ytp-size-button') ??
    findDirectChild(target, '.ytp-miniplayer-button')

  target.insertBefore(button, referenceButton ?? null)
}

const createControlButtonIcon = (document: Document) => {
  const icon = document.createElement('span')
  icon.classList.add('ylcf-control-icon')
  icon.setAttribute('aria-hidden', 'true')

  const shadowRoot = icon.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = `
    <style>
      :host {
        color: #fff;
      }

      svg {
        display: block;
        fill: currentColor;
        height: 100%;
        width: 100%;
      }
    </style>
    ${chat}
  `

  const svg = shadowRoot.querySelector('svg')
  if (svg) {
    svg.setAttribute('height', '100%')
    svg.setAttribute('width', '100%')
  }

  return icon
}

const addControlButton = () => {
  const controls = parent.document.querySelector(
    '.ytp-chrome-bottom .ytp-chrome-controls .ytp-right-controls',
  )
  if (!controls) {
    return false
  }

  let button = parent.document.querySelector<HTMLButtonElement>(
    '.ylcf-control-button',
  )
  if (!button) {
    button = controls.ownerDocument.createElement('button')
    button.classList.add('ytp-button', 'ylcf-control-button')
    button.title = 'Flow messages'
    button.onclick = async () =>
      await chrome.runtime.sendMessage({ type: 'control-button-clicked' })
    button.append(createControlButtonIcon(controls.ownerDocument))
  }

  insertControlButton(controls, button)

  updateControlButton()
  return true
}

const updateMenuButtons = () => {
  for (const config of menuButtonConfigs) {
    const button = document.querySelector(`.${config.className}`)
    if (!button) {
      return
    }
    if (config.isActive()) {
      button.classList.add('ylcf-active-menu-button')
    } else {
      button.classList.remove('ylcf-active-menu-button')
    }
  }
}

const addMenuButtons = () => {
  removeMenuButtons()

  const refIconButton = document.querySelector(
    '#chat-messages > yt-live-chat-header-renderer > yt-icon-button',
  )
  if (!refIconButton) {
    return
  }

  for (const config of menuButtonConfigs) {
    const icon = document.createElement('yt-icon')
    icon.classList.add('yt-live-chat-header-renderer', 'style-scope')

    const iconButton = document.createElement('yt-icon-button')
    iconButton.id = 'overflow'
    iconButton.classList.add(
      'yt-live-chat-header-renderer',
      'style-scope',
      'ylcf-menu-button',
      config.className,
    )
    iconButton.title = config.title
    iconButton.onclick = config.onclick
    iconButton.append(icon)

    refIconButton.parentElement?.insertBefore(iconButton, refIconButton)

    // insert svg after wrapper button appended
    icon.innerHTML = config.svg
  }

  updateMenuButtons()
}

const removeMenuButtons = () => {
  document.querySelectorAll('.ylcf-menu-button').forEach((button) => {
    button.remove()
  })
}

const onVideoPlay = () => {
  controller.play()
}

const onVideoPause = () => {
  controller.pause()
}

const removeVideoEventListener = () => {
  if (!playbackVideo) {
    return
  }

  playbackVideo.removeEventListener('play', onVideoPlay)
  playbackVideo.removeEventListener('pause', onVideoPause)
  playbackVideo = undefined
}

const addVideoEventListener = () => {
  const video = parent.document.querySelector<HTMLVideoElement>(
    'ytd-watch-flexy video.html5-main-video',
  )
  if (!video) {
    removeVideoEventListener()
    return false
  }
  if (playbackVideo === video) {
    return true
  }

  removeVideoEventListener()
  playbackVideo = video
  playbackVideo.addEventListener('play', onVideoPlay)
  playbackVideo.addEventListener('pause', onVideoPause)
  return true
}

const syncPlayerControls = () => {
  addVideoEventListener()
  const hasControlButton = addControlButton()
  return hasControlButton
}

const disconnectPlayerObserver = () => {
  playerObserver?.disconnect()
  playerObserver = undefined
  if (playerSyncFrame !== undefined) {
    window.cancelAnimationFrame(playerSyncFrame)
    playerSyncFrame = undefined
  }
}

const schedulePlayerControlsSync = () => {
  if (playerSyncFrame !== undefined) {
    return
  }

  playerSyncFrame = window.requestAnimationFrame(() => {
    playerSyncFrame = undefined
    if (syncPlayerControls()) {
      disconnectPlayerObserver()
    }
  })
}

const observePlayerControls = () => {
  disconnectPlayerObserver()
  if (syncPlayerControls()) {
    return
  }

  const root = parent.document.documentElement
  if (!root) {
    return
  }

  playerObserver = new MutationObserver(() => {
    schedulePlayerControlsSync()
  })
  playerObserver.observe(root, { childList: true, subtree: true })
  schedulePlayerControlsSync()
}

const observe = async () => {
  await controller.observe()

  const itemList = await querySelectorAsync('#item-list.yt-live-chat-renderer')
  if (!itemList) {
    return
  }

  observer = new MutationObserver(async () => {
    await controller.observe()
  })
  observer.observe(itemList, { childList: true })
}

const disconnect = () => {
  controller.disconnect()
  observer?.disconnect()
  disconnectPlayerObserver()
  removeVideoEventListener()
  removeMenuButtons()
}

const init = async () => {
  disconnect()
  controller.clear()
  removeControlButton()

  observePlayerControls()
  addMenuButtons()

  await observe()
}

const cleanup = () => {
  disconnect()
  controller.clear()
  removeControlButton()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, data } = message
  switch (type) {
    case 'url-changed':
      void init().then(() => sendResponse())
      return true
    case 'enabled-changed':
      controller.enabled = data.enabled
      updateControlButton()
      return sendResponse()
    case 'following-changed':
      controller.following = data.following
      updateMenuButtons()
      return sendResponse()
    case 'settings-changed':
      controller.settings = data.settings
      return sendResponse()
  }
})

const start = async () => {
  const data = await chrome.runtime.sendMessage({ type: 'iframe-loaded' })

  controller.enabled = data.enabled
  controller.following = data.following
  controller.settings = data.settings

  await init()

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      return
    }

    cleanup()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), {
    once: true,
  })
} else {
  void start()
}

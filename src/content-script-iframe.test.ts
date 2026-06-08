import { beforeEach, describe, expect, test, vi } from 'vitest'

const { controller, runtimeListeners } = vi.hoisted(() => {
  return {
    controller: {
      clear: vi.fn(),
      disconnect: vi.fn(),
      observe: vi.fn(async () => undefined),
      pause: vi.fn(),
      play: vi.fn(),
    },
    runtimeListeners: [] as Array<
      (
        message: { type: string; data?: unknown },
        sender: unknown,
        sendResponse: () => void,
      ) => boolean | undefined
    >,
  }
})

vi.mock('~/utils/flow-controller', () => {
  return {
    default: class {
      clear = controller.clear
      disconnect = controller.disconnect
      observe = controller.observe
      pause = controller.pause
      play = controller.play
      enabled = false
      following = false
      settings = undefined
    },
  }
})

vi.mock('~/utils/dom-helper', () => {
  return {
    querySelectorAsync: async <T extends Element>(selector: string) => {
      return document.querySelector<T>(selector)
    },
  }
})

const sendRuntimeMessage = async (type: string) => {
  const listener = runtimeListeners[0]
  await new Promise<void>((resolve) => {
    listener({ type }, {}, resolve)
  })
}

describe('content script iframe lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    runtimeListeners.length = 0
    Object.values(controller).forEach((value) => {
      if (typeof value === 'function') {
        value.mockClear()
      }
    })
    document.body.innerHTML = `
      <ytd-watch-flexy>
        <video class="html5-main-video"></video>
      </ytd-watch-flexy>
    `
    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: {
          addListener: vi.fn((listener) => {
            runtimeListeners.push(listener)
          }),
        },
        sendMessage: vi.fn(async () => ({
          enabled: true,
          following: true,
          settings: {},
        })),
      },
    })
  })

  test('does not duplicate video playback listeners across init calls', async () => {
    await import('~/content-script-iframe')

    await sendRuntimeMessage('url-changed')
    await sendRuntimeMessage('url-changed')
    document
      .querySelector('video.html5-main-video')
      ?.dispatchEvent(new Event('play'))

    expect(controller.play).toHaveBeenCalledTimes(1)
  })

  test('does not duplicate menu buttons across init calls', async () => {
    document.body.innerHTML += `
      <div id="chat-messages">
        <yt-live-chat-header-renderer>
          <yt-icon-button id="reference-menu-button"></yt-icon-button>
        </yt-live-chat-header-renderer>
      </div>
    `
    await import('~/content-script-iframe')

    await sendRuntimeMessage('url-changed')
    await sendRuntimeMessage('url-changed')

    expect(document.querySelectorAll('.ylcf-menu-button')).toHaveLength(2)
  })

  test('adds control button to YouTube right controls left group', async () => {
    document.body.innerHTML += `
      <div class="ytp-chrome-bottom">
        <div class="ytp-chrome-controls">
          <div class="ytp-right-controls">
            <div class="ytp-right-controls-left">
              <button class="ytp-expand-right-bottom-section-button ytp-button"></button>
              <button class="ytp-autonav-toggle ytp-button"></button>
              <button class="ytp-subtitles-button ytp-button"></button>
              <button class="ytp-settings-button ytp-button"></button>
            </div>
            <button class="ytp-fullscreen-button ytp-button"></button>
          </div>
        </div>
      </div>
    `
    await import('~/content-script-iframe')

    await sendRuntimeMessage('url-changed')

    const leftControls = document.querySelector('.ytp-right-controls-left')
    const controlButton = document.querySelector('.ylcf-control-button')

    expect(controlButton?.parentElement).toBe(leftControls)
    expect(controlButton?.nextElementSibling?.classList).toContain(
      'ytp-settings-button',
    )
  })

  test('adds control button after YouTube player controls become ready', async () => {
    await import('~/content-script-iframe')

    await sendRuntimeMessage('url-changed')
    expect(document.querySelector('.ylcf-control-button')).toBeNull()

    document.body.insertAdjacentHTML(
      'beforeend',
      `
        <div class="ytp-chrome-bottom">
          <div class="ytp-chrome-controls">
            <div class="ytp-right-controls">
              <div class="ytp-right-controls-left">
                <button class="ytp-settings-button ytp-button"></button>
              </div>
            </div>
          </div>
        </div>
      `,
    )

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.ylcf-control-button')).toHaveLength(1)
    })
  })
})

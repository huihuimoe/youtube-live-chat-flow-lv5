import { describe, expect, test, vi } from 'vitest'
import { waitImageLoaded } from '~/utils/dom-helper'

const markImageLoaded = (img: HTMLImageElement) => {
  Object.defineProperty(img, 'complete', {
    configurable: true,
    value: true,
  })
  Object.defineProperty(img, 'naturalWidth', {
    configurable: true,
    value: 1,
  })
}

describe('waitImageLoaded', () => {
  test('does not create polling timers for an already loaded image', async () => {
    const img = document.createElement('img')
    markImageLoaded(img)
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    await waitImageLoaded(img)

    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  test('resolves from image load events without polling', async () => {
    vi.useFakeTimers()
    const img = document.createElement('img')
    Object.defineProperty(img, 'complete', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(img, 'naturalWidth', {
      configurable: true,
      value: 0,
    })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    const loaded = waitImageLoaded(img)
    img.dispatchEvent(new Event('load'))

    await expect(loaded).resolves.toBe('')
    expect(setIntervalSpy).not.toHaveBeenCalled()

    setIntervalSpy.mockRestore()
    vi.useRealTimers()
  })
})

import { describe, expect, test } from 'vitest'
import {
  createTransformKeyframes,
  findTimelineIndex,
  getTimelineCapacity,
  pruneTimelines,
  Timeline,
} from '~/utils/flow-layout'

const timeline = (didAppear: number, didDisappear: number): Timeline => ({
  willAppear: didAppear - 1000,
  didAppear,
  willDisappear: didDisappear - 1000,
  didDisappear,
})

describe('flow layout helpers', () => {
  test('caps overlay timelines to two visual stacks', () => {
    expect(getTimelineCapacity(6, 'hidden')).toBe(6)
    expect(getTimelineCapacity(6, 'overlay')).toBe(11)
  })

  test('does not allocate rows beyond overlay capacity', () => {
    const candidate = timeline(10_000, 20_000)
    const timelines = Array.from({ length: 11 }, () => [
      timeline(9_000, 19_000),
    ])

    const index = findTimelineIndex({
      lines: 6,
      messageRows: 1,
      overflow: 'overlay',
      timeline: candidate,
      timelines,
    })

    expect(index).toBeUndefined()
  })

  test('trims expired timeline rows instead of keeping old high-water marks', () => {
    const timelines = [
      [timeline(100, 200), timeline(300, 1_200)],
      [timeline(100, 200)],
      [],
      [timeline(100, 200)],
    ]

    expect(pruneTimelines(timelines, 1_000)).toEqual([[timeline(300, 1_200)]])
  })

  test('uses translate3d for both row placement and horizontal animation', () => {
    expect(createTransformKeyframes(640, 120, 48)).toEqual([
      { transform: 'translate3d(640px, 48px, 0)' },
      { transform: 'translate3d(-120px, 48px, 0)' },
    ])
  })
})

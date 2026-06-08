import { describe, expect, test } from 'vitest'
import { setBoundedCacheValue } from '~/utils/bounded-cache'

describe('setBoundedCacheValue', () => {
  test('evicts the oldest entry when adding beyond the cache limit', () => {
    const cache = new Map<string, number>()

    setBoundedCacheValue(cache, 'a', 1, 2)
    setBoundedCacheValue(cache, 'b', 2, 2)
    setBoundedCacheValue(cache, 'c', 3, 2)

    expect([...cache.entries()]).toEqual([
      ['b', 2],
      ['c', 3],
    ])
  })

  test('updates existing entries without evicting another key', () => {
    const cache = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ])

    setBoundedCacheValue(cache, 'a', 3, 2)

    expect([...cache.entries()]).toEqual([
      ['a', 3],
      ['b', 2],
    ])
  })
})

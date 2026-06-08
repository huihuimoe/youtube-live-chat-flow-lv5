export const setBoundedCacheValue = <K, V>(
  cache: Map<K, V>,
  key: K,
  value: V,
  maxSize: number,
) => {
  if (!cache.has(key) && cache.size >= maxSize) {
    const oldest = cache.keys().next()
    if (!oldest.done) {
      cache.delete(oldest.value)
    }
  }

  cache.set(key, value)
  return value
}

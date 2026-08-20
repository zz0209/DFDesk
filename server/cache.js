const entries = new Map()

export async function cached(key, ttlMs, loader) {
  const now = Date.now()
  const current = entries.get(key)
  if (current?.value && current.expiresAt > now) return { ...current.value, cache: 'hit' }
  if (current?.pending) return current.pending

  const pending = loader()
    .then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs })
      return { ...value, cache: 'miss' }
    })
    .catch((error) => {
      if (current?.value) {
        entries.set(key, { value: current.value, expiresAt: Date.now() + Math.min(ttlMs, 60_000) })
        return { ...current.value, stale: true, cache: 'stale', upstreamError: error.message }
      }
      entries.delete(key)
      throw error
    })

  entries.set(key, { ...current, pending })
  return pending
}

export function cacheStats() {
  return { entries: entries.size }
}

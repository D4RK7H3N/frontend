const cache = new Map()
const inflight = new Map()

const DEFAULT_TTL = 30_000

export const cacheGet = (key) => {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expires && entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

export const cacheSet = (key, value, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    value,
    expires: ttl > 0 ? Date.now() + ttl : 0,
  })
}

export const cacheInvalidate = (key) => {
  cache.delete(key)
  if (inflight.has(key)) {
    inflight.delete(key)
  }
}

export const cachedFetch = async (key, fetcher, ttl = DEFAULT_TTL) => {
  const cached = cacheGet(key)
  if (cached !== null) return cached

  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const promise = (async () => {
    try {
      const value = await fetcher()
      cacheSet(key, value, ttl)
      return value
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}

export const clearAllCache = () => {
  cache.clear()
  inflight.clear()
}

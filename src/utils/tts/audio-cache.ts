import { Sha256Hex } from '@/utils/hash'

interface CacheEntry {
  audioBase64: string
  size: number
}

const DEFAULT_MAX_ENTRIES = 50
const DEFAULT_MAX_MEMORY_BYTES = 50 * 1024 * 1024 // 50MB

/**
 * LRU audio cache keyed by text+voice+speed hash.
 * Uses Map insertion order for LRU tracking:
 * on get(), delete and re-insert to move to end (most recent).
 */
export class TtsAudioCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxEntries: number
  private readonly maxMemoryBytes: number
  private currentMemoryBytes = 0

  constructor(options?: { maxEntries?: number, maxMemoryBytes?: number }) {
    this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES
    this.maxMemoryBytes = options?.maxMemoryBytes ?? DEFAULT_MAX_MEMORY_BYTES
  }

  /**
   * Build a cache key from text, voice, and speed parameters.
   */
  buildKey(text: string, voice: string, speed: number): string {
    return Sha256Hex(text, voice, String(speed))
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get a cached audio entry. Returns undefined on miss.
   * On hit, refreshes LRU position by delete+re-insert.
   */
  get(key: string): string | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Refresh LRU position
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.audioBase64
  }

  /**
   * Store audio in cache. Evicts oldest entries if at capacity.
   */
  set(key: string, audioBase64: string): void {
    // If key already exists, remove old entry first
    const existing = this.cache.get(key)
    if (existing) {
      this.currentMemoryBytes -= existing.size
      this.cache.delete(key)
    }

    const size = audioBase64.length // approximate byte size for base64 string
    const entry: CacheEntry = { audioBase64, size }

    // Evict oldest entries until we have room
    while (
      this.cache.size >= this.maxEntries
      || (this.currentMemoryBytes + size > this.maxMemoryBytes && this.cache.size > 0)
    ) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.currentMemoryBytes += size
  }

  /**
   * Remove all entries from the cache.
   */
  clear(): void {
    this.cache.clear()
    this.currentMemoryBytes = 0
  }

  get stats(): { entries: number, memoryBytes: number } {
    return {
      entries: this.cache.size,
      memoryBytes: this.currentMemoryBytes,
    }
  }

  private evictOldest(): void {
    // Map iterator yields entries in insertion order; first entry is the oldest
    const oldest = this.cache.keys().next()
    if (!oldest.done) {
      const entry = this.cache.get(oldest.value)!
      this.currentMemoryBytes -= entry.size
      this.cache.delete(oldest.value)
    }
  }
}

// Singleton instance
let cacheInstance: TtsAudioCache | null = null

export function getTtsAudioCache(): TtsAudioCache {
  if (!cacheInstance) {
    cacheInstance = new TtsAudioCache()
  }
  return cacheInstance
}

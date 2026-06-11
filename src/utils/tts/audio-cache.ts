import { Sha256Hex } from '@/utils/hash'

/**
 * LRU audio cache for TTS synthesis results.
 *
 * Caches ArrayBuffer audio data keyed by a hash of (text, voiceId, speed, provider).
 * Implements LRU eviction when capacity limits are reached.
 */
export class TTSAudioCache {
  private cache: Map<string, { buffer: ArrayBuffer, size: number }> = new Map()
  private accessOrder: string[] = []
  private readonly maxEntries: number
  private readonly maxSizeBytes: number
  private currentSizeBytes = 0

  constructor(maxEntries: number = 50, maxSizeMB: number = 50) {
    this.maxEntries = maxEntries
    this.maxSizeBytes = maxSizeMB * 1024 * 1024
  }

  /**
   * Generate a cache key from synthesis parameters.
   */
  static generateKey(text: string, voiceId: string, speed: number, provider: string): string {
    return Sha256Hex(text, voiceId, speed.toString(), provider)
  }

  /**
   * Check if an entry exists in the cache.
   */
  has(text: string, voiceId: string, speed: number, provider: string): boolean {
    const key = TTSAudioCache.generateKey(text, voiceId, speed, provider)
    return this.cache.has(key)
  }

  /**
   * Get cached audio data.
   * Returns null if not found.
   * Moves the entry to the front of the access order (MRU).
   */
  get(text: string, voiceId: string, speed: number, provider: string): ArrayBuffer | null {
    const key = TTSAudioCache.generateKey(text, voiceId, speed, provider)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Move to MRU position
    this.moveToFront(key)
    return entry.buffer
  }

  /**
   * Store audio data in the cache.
   * Evicts LRU entries if capacity is exceeded.
   */
  set(text: string, voiceId: string, speed: number, provider: string, buffer: ArrayBuffer): void {
    const key = TTSAudioCache.generateKey(text, voiceId, speed, provider)

    // If key already exists, update it
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!
      this.currentSizeBytes -= oldEntry.size
      this.cache.delete(key)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    }

    const size = buffer.byteLength

    // Evict entries until we have space
    while (
      (this.cache.size >= this.maxEntries || this.currentSizeBytes + size > this.maxSizeBytes)
      && this.accessOrder.length > 0
    ) {
      this.evictLRU()
    }

    // Store the new entry
    this.cache.set(key, { buffer, size })
    this.accessOrder.unshift(key)
    this.currentSizeBytes += size
  }

  /**
   * Remove a specific entry from the cache.
   */
  delete(text: string, voiceId: string, speed: number, provider: string): void {
    const key = TTSAudioCache.generateKey(text, voiceId, speed, provider)
    const entry = this.cache.get(key)

    if (entry) {
      this.currentSizeBytes -= entry.size
      this.cache.delete(key)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    }
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.currentSizeBytes = 0
  }

  /**
   * Get current cache statistics.
   */
  getStats(): { entries: number, sizeBytes: number, maxEntries: number, maxSizeBytes: number } {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSizeBytes,
      maxEntries: this.maxEntries,
      maxSizeBytes: this.maxSizeBytes,
    }
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    const lruKey = this.accessOrder.pop()
    if (lruKey) {
      const entry = this.cache.get(lruKey)
      if (entry) {
        this.currentSizeBytes -= entry.size
        this.cache.delete(lruKey)
      }
    }
  }

  /**
   * Move a key to the front (most recently used) of the access order.
   */
  private moveToFront(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.unshift(key)
  }
}

/** Global singleton audio cache instance */
export const ttsAudioCache = new TTSAudioCache()

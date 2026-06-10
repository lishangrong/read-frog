import { globalConfig } from '@/utils/config/config'
import { Sha256Hex } from '@/utils/hash'
import { sendMessage } from '@/utils/message'
import { translateText } from '@/utils/host/translate/translate-text'

const SUBTITLE_PRIORITY = 50 // Higher than auto page translation

/**
 * LRU cache for subtitle translations to avoid re-translating the same text.
 */
class TranslationCache {
  private cache = new Map<string, string>()
  private maxSize: number

  constructor(maxSize = 200) {
    this.maxSize = maxSize
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: string, value: string) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    else if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

const translationCache = new TranslationCache()

// Track in-flight translation requests to avoid duplicates
const pendingTranslations = new Map<string, Promise<string>>()

/**
 * Translate subtitle text, with deduplication and caching.
 */
export async function translateSubtitle(text: string): Promise<string> {
  if (!text.trim())
    return ''

  // Check cache first
  const cached = translationCache.get(text)
  if (cached !== undefined)
    return cached

  // Check if there's already a pending translation for this text
  const pending = pendingTranslations.get(text)
  if (pending)
    return pending

  const translationPromise = (async () => {
    try {
      const result = await translateText(text, { priority: SUBTITLE_PRIORITY })
      if (result) {
        translationCache.set(text, result)
      }
      return result
    }
    finally {
      pendingTranslations.delete(text)
    }
  })()

  pendingTranslations.set(text, translationPromise)
  return translationPromise
}

/**
 * Clear the subtitle translation cache.
 */
export function clearSubtitleCache() {
  translationCache.clear()
}

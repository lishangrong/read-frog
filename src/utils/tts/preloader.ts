import type { ITTSProvider, TTSProgress } from './types'
import { extractTextForTTS, splitTextIntoChunks } from './text-extractor'
import { ttsAudioCache } from './audio-cache'

/**
 * TTS Preloader.
 *
 * Pre-synthesizes and caches audio when translation results become available.
 * Reduces perceived latency when the user clicks "play" — the audio is
 * already cached and can play instantly.
 */
export class TTSPreloader {
  private provider: ITTSProvider | null = null
  private pendingRequests: Map<string, AbortController> = new Map()

  /**
   * Set the active TTS provider for preloading.
   */
  setProvider(provider: ITTSProvider): void {
    this.provider = provider
  }

  /**
   * Preload TTS audio for the given text.
   *
   * The audio is synthesized in the background and stored in the cache.
   * If a preload is already in progress for the same text, it is skipped.
   *
   * @param text - Raw text to preload (will be purified before synthesis)
   * @param voiceId - Voice to use
   * @param speed - Playback speed
   * @param providerId - Provider identifier for cache key
   */
  async preload(
    text: string,
    voiceId: string,
    speed: number,
    providerId: string,
  ): Promise<void> {
    if (!this.provider) return

    // Purify text for TTS
    const cleanText = extractTextForTTS(text)
    if (!cleanText) return

    // Check if already cached
    if (ttsAudioCache.has(cleanText, voiceId, speed, providerId)) {
      return
    }

    // Cancel any existing preload for this key
    const cacheKey = `${cleanText}|${voiceId}|${speed}|${providerId}`
    this.cancelPending(cacheKey)

    const abortController = new AbortController()
    this.pendingRequests.set(cacheKey, abortController)

    try {
      // Split long text into chunks and synthesize each
      const chunks = splitTextIntoChunks(cleanText)

      for (const chunk of chunks) {
        if (abortController.signal.aborted) break

        const audioBuffer = await this.provider.synthesize({
          text: chunk,
          voiceId,
          speed,
          model: 'tts-1',
          format: 'mp3',
        })

        if (abortController.signal.aborted) break

        // Cache each chunk
        ttsAudioCache.set(chunk, voiceId, speed, providerId, audioBuffer)
      }
    }
    catch (error) {
      // Silently fail preloading — it's an optimization, not critical
      if (!(error instanceof Error && error.message.includes('abort'))) {
        console.warn('TTS preload failed:', error)
      }
    }
    finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Get cached audio for a text, if available.
   */
  getCachedAudio(
    text: string,
    voiceId: string,
    speed: number,
    providerId: string,
  ): ArrayBuffer | null {
    const cleanText = extractTextForTTS(text)
    if (!cleanText) return null
    return ttsAudioCache.get(cleanText, voiceId, speed, providerId)
  }

  /**
   * Check if audio is cached for a text.
   */
  isCached(
    text: string,
    voiceId: string,
    speed: number,
    providerId: string,
  ): boolean {
    const cleanText = extractTextForTTS(text)
    if (!cleanText) return false
    return ttsAudioCache.has(cleanText, voiceId, speed, providerId)
  }

  /**
   * Cancel a pending preload request.
   */
  private cancelPending(cacheKey: string): void {
    const existing = this.pendingRequests.get(cacheKey)
    if (existing) {
      existing.abort()
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Cancel all pending preload requests.
   */
  cancelAll(): void {
    for (const controller of this.pendingRequests.values()) {
      controller.abort()
    }
    this.pendingRequests.clear()
  }

  /**
   * Destroy the preloader and clean up.
   */
  destroy(): void {
    this.cancelAll()
    this.provider = null
  }
}

import { sanitizeTextForTts } from './text-sanitizer'
import { splitTextIntoSegments } from './audio-controller'
import { getTtsAudioCache } from './audio-cache'
import { Sha256Hex } from '@/utils/hash'
import { sendMessage } from '@/utils/message'
import type { TtsProvider } from '@/types/config/tts'

/**
 * Preload TTS audio for text by splitting into segments
 * and caching the first few segments' audio.
 * Failures are silently ignored since preloading is best-effort.
 */
export async function preloadTtsAudio(
  text: string,
  options: {
    voice: string
    speed: number
    lang: string
    provider: TtsProvider
  },
): Promise<void> {
  // Web Speech API doesn't need preloading (no network request)
  if (options.provider === 'webSpeech') return

  const cleanText = sanitizeTextForTts(text)
  if (!cleanText) return

  const segments = splitTextIntoSegments(cleanText)
  const cache = getTtsAudioCache()

  // Only preload first 3 segments to avoid excessive requests
  const preloadCount = Math.min(segments.length, 3)
  const requestType = options.provider === 'edgeTts' ? 'edgeTts' : 'tts'

  for (let i = 0; i < preloadCount; i++) {
    const segment = segments[i]
    const key = cache.buildKey(segment, options.voice, options.speed)

    // Skip if already cached
    if (cache.has(key)) continue

    try {
      const audioBase64: string = await sendMessage('enqueueRequest', {
        type: requestType,
        params: {
          text: segment,
          voice: options.voice,
          speed: options.speed,
          lang: options.lang,
        },
        scheduleAt: Date.now(),
        hash: Sha256Hex(segment, options.voice, String(options.speed)),
        priority: 80, // Lower priority than active playback
      })

      cache.set(key, audioBase64)
    }
    catch {
      // Preload failures are non-critical, stop trying further segments
      break
    }
  }
}

import type { TTSVoice } from '@/types/config/tts'
import { getVoicesForProvider } from '../voice-catalog'
import { BaseTTSProvider } from './base-tts-provider'
import type { TTSSynthesisParams } from '../types'

/**
 * Web Speech API TTS provider.
 *
 * Uses the browser's built-in `SpeechSynthesis` API.
 * Free, no API key required, but voice quality varies by browser/OS.
 *
 * Wraps the existing `SpeechSynthesisUtterance` logic from the original TTS engine.
 */
export class WebSpeechTTSProvider extends BaseTTSProvider {
  readonly id = 'web-speech'
  readonly name = 'Web Speech'

  async synthesize(params: TTSSynthesisParams): Promise<ArrayBuffer> {
    // Web Speech API doesn't produce ArrayBuffer — it plays audio directly.
    // This method is a placeholder; the TTSEngine handles Web Speech playback
    // directly via SpeechSynthesisUtterance for real-time playback.
    //
    // For preloading/caching purposes, we return an empty buffer since
    // Web Speech cannot be cached. The engine will use direct playback instead.
    throw new Error('Web Speech API does not support audio buffer export. Use direct playback via TTSEngine.')
  }

  getSupportedVoices(): TTSVoice[] {
    const systemVoices = typeof window !== 'undefined' && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : []
    return getVoicesForProvider('web-speech', systemVoices)
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /**
   * Speak text directly using SpeechSynthesis.
   * Returns a promise that resolves when speech ends.
   */
  speak(params: TTSSynthesisParams): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not available'))
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(params.text)
      utterance.rate = params.speed
      utterance.volume = 1.0

      // Match voice by ID
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const matched = voices.find(v =>
          (v.voiceURI === params.voiceId)
          || v.name.toLowerCase().includes(params.voiceId.toLowerCase()),
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
        utterance.voice = matched
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve()
        }
        else {
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }
      }

      window.speechSynthesis.speak(utterance)
    })
  }
}

import type { TTSVoice } from '@/types/config/tts'
import { sendMessage } from '@/utils/message'
import { OPENAI_TTS_VOICES } from '../voice-catalog'
import { BaseTTSProvider } from './base-tts-provider'
import type { TTSSynthesisParams } from '../types'

/**
 * OpenAI TTS provider.
 *
 * Synthesizes text to audio using the OpenAI TTS API.
 * API calls are routed through the background script via messaging
 * to avoid CORS issues and keep API keys secure.
 *
 * Supports models: tts-1 (fast), tts-1-hd (high quality).
 * Supports voices: alloy, echo, fable, onyx, nova, shimmer, sage, coral.
 * Supports any language that the model handles.
 */
export class OpenAITTSProvider extends BaseTTSProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI TTS'

  private hasApiKey: boolean

  constructor(hasApiKey: boolean = false) {
    super()
    this.hasApiKey = hasApiKey
  }

  /**
   * Update API key availability (called when config changes).
   */
  setApiKeyAvailable(available: boolean): void {
    this.hasApiKey = available
  }

  async synthesize(params: TTSSynthesisParams): Promise<ArrayBuffer> {
    if (!this.hasApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Send synthesis request to background script
    const result = await sendMessage('ttsSynthesize', {
      text: params.text,
      voiceId: params.voiceId,
      speed: params.speed,
      model: params.model ?? 'tts-1',
      format: params.format ?? 'mp3',
    })

    // Decode base64 audio to ArrayBuffer
    return base64ToArrayBuffer(result.audio)
  }

  getSupportedVoices(): TTSVoice[] {
    return OPENAI_TTS_VOICES
  }

  isAvailable(): boolean {
    return this.hasApiKey
  }
}

/**
 * Decode a base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

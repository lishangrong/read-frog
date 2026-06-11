import type { ITTSProvider, TTSSynthesisParams } from '../types'
import type { TTSVoice } from '@/types/config/tts'

/**
 * Abstract base class for TTS providers.
 *
 * Follows the same pattern as `BaseLLMProvider` in the translation provider system.
 * Concrete providers implement `synthesize()` to convert text into audio.
 */
export abstract class BaseTTSProvider implements ITTSProvider {
  abstract readonly id: string
  abstract readonly name: string

  abstract synthesize(params: TTSSynthesisParams): Promise<ArrayBuffer>
  abstract getSupportedVoices(): TTSVoice[]
  abstract isAvailable(): boolean
}

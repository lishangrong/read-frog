import type { TTSVoice } from '@/types/config/tts'

/**
 * TTS provider interface.
 *
 * Defines the contract for all TTS backends (OpenAI, Web Speech, etc.).
 * Each provider can synthesize text into audio and report its capabilities.
 */
export interface ITTSProvider {
  /** Unique provider identifier */
  readonly id: string

  /** Human-readable provider name */
  readonly name: string

  /**
   * Synthesize text into audio.
   * @returns ArrayBuffer containing the encoded audio data
   */
  synthesize(params: TTSSynthesisParams): Promise<ArrayBuffer>

  /** Get the list of voices supported by this provider */
  getSupportedVoices(): TTSVoice[]

  /** Check if this provider is currently available (e.g., API key configured) */
  isAvailable(): boolean
}

/**
 * Parameters for a TTS synthesis request.
 */
export interface TTSSynthesisParams {
  /** Text to synthesize */
  text: string
  /** Voice identifier (provider-specific) */
  voiceId: string
  /** Playback speed multiplier (0.25 – 4.0) */
  speed: number
  /** Model identifier (e.g., 'tts-1', 'tts-1-hd') */
  model?: string
  /** Audio format (e.g., 'mp3', 'opus', 'wav') */
  format?: string
}

/**
 * Playback progress information.
 */
export interface TTSProgress {
  /** Current playback position in seconds */
  currentTime: number
  /** Total duration in seconds (0 if unknown) */
  duration: number
  /** Playback progress as a percentage (0 – 100) */
  percentage: number
}

/**
 * Supported TTS provider identifiers.
 */
export type TTSProviderId = 'web-speech' | 'openai'

/**
 * Audio chunk for streaming synthesis (future use).
 */
export interface TTSAudioChunk {
  data: ArrayBuffer
  isLast: boolean
}

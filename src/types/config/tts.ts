import { z } from 'zod'

/**
 * Available AI voice identifiers for TTS.
 * Each voice represents a distinct persona / timbre.
 */
export const ttsVoiceSchema = z.object({
  /** Stable voice identifier used in API requests */
  id: z.string(),
  /** Human-readable display name */
  name: z.string(),
  /** ISO 639-1 language code the voice speaks */
  lang: z.string(),
  /** Voice gender hint for UI grouping */
  gender: z.enum(['male', 'female', 'neutral']),
})

export type TTSVoice = z.infer<typeof ttsVoiceSchema>

/**
 * TTS provider identifiers.
 */
export const ttsProviderSchema = z.enum(['web-speech', 'openai'])
export type TTSProviderId = z.infer<typeof ttsProviderSchema>

/**
 * TTS configuration stored in the extension config.
 */
export const ttsConfigSchema = z.object({
  /** Whether TTS is enabled globally */
  enabled: z.boolean(),
  /** Playback speed multiplier (0.25 – 4.0) */
  speed: z.number().min(0.25).max(4.0),
  /** Currently selected voice id */
  voiceId: z.string(),
  /** Audio volume (0.0 – 1.0) */
  volume: z.number().min(0).max(1),
  /** TTS provider backend */
  provider: ttsProviderSchema,
  /** TTS model (e.g. 'tts-1' for fast, 'tts-1-hd' for high quality) */
  model: z.string(),
  /** Audio output format */
  format: z.string(),
  /** Whether to auto-preload TTS audio when selection translation completes */
  preloadOnTranslate: z.boolean(),
})

export type TTSConfig = z.infer<typeof ttsConfigSchema>

/**
 * Subtitle translation configuration.
 */
export const subtitleConfigSchema = z.object({
  /** Whether subtitle translation is enabled */
  enabled: z.boolean(),
  /** Auto-translate subtitles when detected */
  autoTranslate: z.boolean(),
})

export type SubtitleConfig = z.infer<typeof subtitleConfigSchema>

import { z } from 'zod'

/* ──────────────────────────────
  TTS voice and provider definitions
  ────────────────────────────── */

export const ttsVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
export type TtsVoice = typeof ttsVoices[number]

export const ttsProviders = ['webSpeech', 'openai'] as const
export type TtsProvider = typeof ttsProviders[number]

/* ──────────────────────────────
  TTS config schema
  ────────────────────────────── */

export const ttsConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(ttsProviders),
  voice: z.enum(ttsVoices),
  speed: z.number().min(0.25).max(4),
  autoPlay: z.boolean(),
})

export type TtsConfig = z.infer<typeof ttsConfigSchema>

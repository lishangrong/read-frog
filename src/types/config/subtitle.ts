import { z } from 'zod'

/* ──────────────────────────────
  Subtitle display mode and position
  ────────────────────────────── */

export const subtitleDisplayModes = ['bilingual', 'translationOnly', 'off'] as const
export type SubtitleDisplayMode = typeof subtitleDisplayModes[number]

export const subtitlePositions = ['below', 'above', 'side'] as const
export type SubtitlePosition = typeof subtitlePositions[number]

/* ──────────────────────────────
  Subtitle config schema
  ────────────────────────────── */

export const subtitleConfigSchema = z.object({
  enabled: z.boolean(),
  displayMode: z.enum(subtitleDisplayModes),
  position: z.enum(subtitlePositions),
  fontSize: z.number().min(12).max(36),
  opacity: z.number().min(0).max(1),
  autoDetect: z.boolean(),
})

export type SubtitleConfig = z.infer<typeof subtitleConfigSchema>

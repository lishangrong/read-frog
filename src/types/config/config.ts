import { z } from 'zod'

import { langCodeISO6393Schema, langLevel } from '@/types/config/languages'
import { MIN_SIDE_CONTENT_WIDTH } from '@/utils/constants/side'
import { providersConfigSchema, readConfigSchema, translateConfigSchema } from './provider'
import { subtitleConfigSchema } from './subtitle'
import { ttsConfigSchema } from './tts'

// Language schema
const languageSchema = z.object({
  detectedCode: langCodeISO6393Schema,
  sourceCode: langCodeISO6393Schema.or(z.literal('auto')),
  targetCode: langCodeISO6393Schema,
  level: langLevel,
})
// Floating button schema
const floatingButtonSchema = z.object({
  enabled: z.boolean(),
  position: z.number().min(0).max(1),
})

// side content schema
const sideContentSchema = z.object({
  width: z.number().min(MIN_SIDE_CONTENT_WIDTH),
})

// Complete config schema
export const configSchema = z.object({
  language: languageSchema,
  providersConfig: providersConfigSchema,
  read: readConfigSchema,
  translate: translateConfigSchema,
  floatingButton: floatingButtonSchema,
  sideContent: sideContentSchema,
  tts: ttsConfigSchema,
  subtitle: subtitleConfigSchema,
})

export type Config = z.infer<typeof configSchema>

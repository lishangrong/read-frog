import type { z } from 'zod'

import type { languageSchema } from '@/types/config/config'
import { configSchema } from '@/types/config/config'
import type { Config } from '@/types/config/config'
import type { providersConfigSchema, readConfigSchema, translateConfigSchema } from '@/types/config/provider'
import type { renderingModeSchema } from '@/types/config/rendering'
import type { subtitleConfigSchema, ttsConfigSchema } from '@/types/config/tts'

/**
 * Metadata descriptor for a config sub-schema.
 * Enables modular config access, validation, and UI generation.
 */
export interface ConfigFieldDescriptor<T extends z.ZodTypeAny> {
  /** Dot-path key under the root config */
  key: keyof Config
  /** The Zod schema for this sub-config */
  schema: T
  /** Human-readable label for UI */
  label: string
  /** Description of what this config section controls */
  description: string
  /** Whether changes to this section require re-initialization */
  requiresRestart: boolean
}

type ConfigFieldMap = {
  language: ConfigFieldDescriptor<typeof languageSchema>
  providersConfig: ConfigFieldDescriptor<typeof providersConfigSchema>
  read: ConfigFieldDescriptor<typeof readConfigSchema>
  translate: ConfigFieldDescriptor<typeof translateConfigSchema>
  floatingButton: ConfigFieldDescriptor<z.ZodObject<{ enabled: z.ZodBoolean, position: z.ZodNumber }>>
  sideContent: ConfigFieldDescriptor<z.ZodObject<{ width: z.ZodNumber }>>
  rendering: ConfigFieldDescriptor<z.ZodObject<{ mode: typeof renderingModeSchema }>>
  tts: ConfigFieldDescriptor<typeof ttsConfigSchema>
  subtitle: ConfigFieldDescriptor<typeof subtitleConfigSchema>
}

/**
 * Registry of all config sub-schemas with metadata.
 * This is the single source of truth for the nested schema architecture.
 * Each entry describes a modular config section with its schema and UI hints.
 */
export const configFieldRegistry: ConfigFieldMap = {
  language: {
    key: 'language',
    schema: configSchema.shape.language,
    label: 'Language',
    description: 'Source, target, and proficiency language settings',
    requiresRestart: false,
  },
  providersConfig: {
    key: 'providersConfig',
    schema: configSchema.shape.providersConfig,
    label: 'Provider Configuration',
    description: 'API keys and base URLs for LLM providers',
    requiresRestart: false,
  },
  read: {
    key: 'read',
    schema: configSchema.shape.read,
    label: 'Read Settings',
    description: 'Provider and model selection for article reading',
    requiresRestart: false,
  },
  translate: {
    key: 'translate',
    schema: configSchema.shape.translate,
    label: 'Translation Settings',
    description: 'Provider, model, and behavior settings for translation',
    requiresRestart: false,
  },
  floatingButton: {
    key: 'floatingButton',
    schema: configSchema.shape.floatingButton,
    label: 'Floating Button',
    description: 'Floating button visibility and position',
    requiresRestart: false,
  },
  sideContent: {
    key: 'sideContent',
    schema: configSchema.shape.sideContent,
    label: 'Side Panel',
    description: 'Side panel width and display settings',
    requiresRestart: false,
  },
  rendering: {
    key: 'rendering',
    schema: configSchema.shape.rendering,
    label: 'Rendering',
    description: 'Translation display mode (bilingual, translation only, etc.)',
    requiresRestart: false,
  },
  tts: {
    key: 'tts',
    schema: configSchema.shape.tts,
    label: 'Text-to-Speech',
    description: 'TTS voice, speed, and volume settings',
    requiresRestart: false,
  },
  subtitle: {
    key: 'subtitle',
    schema: configSchema.shape.subtitle,
    label: 'Subtitle',
    description: 'Subtitle translation display settings',
    requiresRestart: false,
  },
} as const

/**
 * Validate a partial config update against the root schema.
 * Returns { success: true, data } on success, or { success: false, error } on failure.
 */
export function validateConfigUpdate(
  patch: Partial<Config>,
  current: Config,
): { success: true, data: Config } | { success: false, error: z.ZodError } {
  const merged = { ...current, ...patch }
  const result = configSchema.safeParse(merged)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Validate a single config field against its sub-schema.
 */
export function validateField<K extends keyof Config>(
  key: K,
  value: Config[K],
): { success: true, data: Config[K] } | { success: false, error: z.ZodError } {
  const descriptor = configFieldRegistry[key]
  const result = descriptor.schema.safeParse(value)
  if (result.success) {
    return { success: true, data: result.data as Config[K] }
  }
  return { success: false, error: result.error }
}

/**
 * Get the sub-schema for a specific config field.
 */
export function getFieldSchema<K extends keyof Config>(key: K): ConfigFieldMap[K]['schema'] {
  return configFieldRegistry[key].schema as ConfigFieldMap[K]['schema']
}

/**
 * Get all field keys in the registry.
 */
export function getFieldKeys(): (keyof Config)[] {
  return Object.keys(configFieldRegistry) as (keyof Config)[]
}

/**
 * Get metadata for a specific config field.
 */
export function getFieldMetadata<K extends keyof Config>(key: K): ConfigFieldDescriptor<ConfigFieldMap[K]['schema']> {
  return configFieldRegistry[key] as ConfigFieldDescriptor<ConfigFieldMap[K]['schema']>
}

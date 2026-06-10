import type { Config } from '@/types/config/config'
import type { APIProviderNames } from '@/types/config/provider'
import { isLLMTranslateProvider, readProviderModels, translateProviderModels } from '@/types/config/provider'
import { hasSetAPIKey } from './provider-validation'

/* ──────────────────────────────
  Cross-field config validation
  ────────────────────────────── */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateProviderConfig(config: Config): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const { read, translate, providersConfig } = config

  // Validate read provider has API key
  if (read.provider in providersConfig) {
    if (!hasSetAPIKey(read.provider as APIProviderNames, providersConfig)) {
      warnings.push(`Read provider "${read.provider}" requires an API key`)
    }
  }

  // Validate translate provider has API key (only LLM providers)
  if (isLLMTranslateProvider(translate.provider)) {
    if (!hasSetAPIKey(translate.provider as APIProviderNames, providersConfig)) {
      warnings.push(`Translate provider "${translate.provider}" requires an API key`)
    }
  }

  // Validate selected read model exists in provider's model list or is custom
  const readModelConfig = read.models[read.provider]
  if (readModelConfig && !readModelConfig.isCustomModel) {
    const availableModels = readProviderModels[read.provider] as readonly string[]
    if (!availableModels.includes(readModelConfig.model)) {
      errors.push(`Read model "${readModelConfig.model}" is not available for provider "${read.provider}"`)
    }
  }

  // Validate selected translate model exists or is custom
  if (isLLMTranslateProvider(translate.provider)) {
    const translateModelConfig = translate.models[translate.provider]
    if (translateModelConfig && typeof translateModelConfig === 'object' && 'model' in translateModelConfig) {
      if (!translateModelConfig.isCustomModel) {
        const availableModels = translateProviderModels[translate.provider] as readonly string[]
        if (!availableModels.includes(translateModelConfig.model)) {
          errors.push(`Translate model "${translateModelConfig.model}" is not available for provider "${translate.provider}"`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

import type { APIProviderNames, TranslateProviderNames, ReadProviderNames } from '@/types/config/provider'
import type { Config } from '@/types/config/config'
import { apiProviderNames, readProviderNames, translateProviderNames } from '@/types/config/provider'
import { configSchema } from '@/types/config/config'
import {
  LANG_CODE_TO_EN_NAME,
  LANG_CODE_TO_LOCALE_NAME,
  langCodeISO6393Schema,
} from '@/types/config/languages'
import {
  API_PROVIDER_ITEMS,
  DEFAULT_CONFIG,
  TRANSLATE_PROVIDER_ITEMS,
  READ_PROVIDER_ITEMS,
} from '@/utils/constants/config'

import { useState, useCallback } from 'react'

/**
 * Onboarding wizard step identifiers.
 */
export type OnboardingStep =
  | 'welcome'
  | 'language'
  | 'translate-provider'
  | 'read-provider'
  | 'api-key'
  | 'complete'

const STEPS: OnboardingStep[] = [
  'welcome',
  'language',
  'translate-provider',
  'read-provider',
  'api-key',
  'complete',
]

/**
 * State accumulated through the onboarding wizard.
 */
export interface OnboardingState {
  /** Current step in the wizard */
  step: OnboardingStep
  /** Step index for progress calculation */
  stepIndex: number
  /** Selected source language */
  sourceCode: string
  /** Selected target language */
  targetCode: string
  /** Selected proficiency level */
  level: 'beginner' | 'intermediate' | 'advanced'
  /** Selected translation provider */
  translateProvider: TranslateProviderNames
  /** Selected read provider */
  readProvider: ReadProviderNames
  /** API keys entered per provider */
  apiKeys: Partial<Record<APIProviderNames, string>>
}

/**
 * Initial onboarding state with sensible defaults.
 */
export function createInitialOnboardingState(): OnboardingState {
  return {
    step: 'welcome',
    stepIndex: 0,
    sourceCode: 'auto',
    targetCode: DEFAULT_CONFIG.language.targetCode,
    level: DEFAULT_CONFIG.language.level,
    translateProvider: DEFAULT_CONFIG.translate.provider,
    readProvider: DEFAULT_CONFIG.read.provider,
    apiKeys: {},
  }
}

/**
 * Calculate the progress percentage for the onboarding wizard.
 */
export function getOnboardingProgress(state: OnboardingState): number {
  return ((state.stepIndex + 1) / STEPS.length) * 100
}

/**
 * Advance to the next step.
 */
export function advanceStep(state: OnboardingState): OnboardingState {
  const nextIndex = Math.min(state.stepIndex + 1, STEPS.length - 1)
  return { ...state, step: STEPS[nextIndex], stepIndex: nextIndex }
}

/**
 * Go back to the previous step.
 */
export function goBackStep(state: OnboardingState): OnboardingState {
  const prevIndex = Math.max(state.stepIndex - 1, 0)
  return { ...state, step: STEPS[prevIndex], stepIndex: prevIndex }
}

/**
 * Convert the onboarding state into a config patch to apply.
 */
export function onboardingToConfigPatch(state: OnboardingState): Partial<Config> {
  // Build providers config with API keys
  const providersConfig = { ...DEFAULT_CONFIG.providersConfig }
  for (const [provider, apiKey] of Object.entries(state.apiKeys)) {
    if (apiKey) {
      (providersConfig as any)[provider] = {
        ...providersConfig[provider as APIProviderNames],
        apiKey,
      }
    }
  }

  return {
    language: {
      detectedCode: DEFAULT_CONFIG.language.detectedCode,
      sourceCode: state.sourceCode as any,
      targetCode: state.targetCode as any,
      level: state.level,
    },
    providersConfig,
    translate: {
      ...DEFAULT_CONFIG.translate,
      provider: state.translateProvider,
    },
    read: {
      ...DEFAULT_CONFIG.read,
      provider: state.readProvider,
    },
  }
}

/**
 * Validate the onboarding state before completion.
 */
export function validateOnboardingState(state: OnboardingState): { valid: boolean, errors: string[] } {
  const patch = onboardingToConfigPatch(state)
  const merged = { ...DEFAULT_CONFIG, ...patch }
  const result = configSchema.safeParse(merged)

  if (result.success) {
    return { valid: true, errors: [] }
  }

  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  }
}

/**
 * Check if a provider needs an API key.
 */
export function providerNeedsApiKey(provider: string): boolean {
  return (apiProviderNames as readonly string[]).includes(provider)
}

/**
 * Get the list of providers that need API keys based on onboarding selections.
 */
export function getRequiredAPIProviders(state: OnboardingState): APIProviderNames[] {
  const providers = new Set<APIProviderNames>()

  if (providerNeedsApiKey(state.translateProvider)) {
    providers.add(state.translateProvider as APIProviderNames)
  }
  if (providerNeedsApiKey(state.readProvider)) {
    providers.add(state.readProvider as APIProviderNames)
  }

  return Array.from(providers)
}

/**
 * Get display info for a language code.
 */
export function getLanguageDisplay(code: string) {
  const enName = LANG_CODE_TO_EN_NAME[code as keyof typeof LANG_CODE_TO_EN_NAME] ?? code
  const localName = LANG_CODE_TO_LOCALE_NAME[code as keyof typeof LANG_CODE_TO_LOCALE_NAME] ?? code
  return { enName, localName }
}

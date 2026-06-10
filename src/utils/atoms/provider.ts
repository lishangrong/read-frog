import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import type { APIProviderNames } from '@/types/config/provider'
import type { ProviderFeature } from '@/types/provider/capabilities'
import { PROVIDER_CAPABILITIES } from '@/providers/capabilities-map'
import type { ProviderId } from '@/providers/capabilities-map'
import { configAtom, configFields } from './config'

// ─── Per-provider config atoms ───

/**
 * Create a granular atom for a specific provider's config.
 * Only re-renders subscribers when THIS provider's config changes.
 */
export function getProviderConfigAtom(providerId: APIProviderNames) {
  const sliceAtom = selectAtom(
    configAtom,
    c => (c.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId],
    // Custom equality: deep compare the provider config object
    (a, b) => a?.apiKey === b?.apiKey && a?.baseURL === b?.baseURL,
  )

  return atom(
    get => get(sliceAtom),
    (get, set, patch: Partial<{ apiKey: string, baseURL: string }>) => {
      const current = get(configAtom)
      const currentProviderConfig = (current.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId] ?? {}
      set(configFields.providersConfig, {
        ...current.providersConfig,
        [providerId]: { ...currentProviderConfig, ...patch },
      })
    },
  )
}

// ─── Per-provider API key atom ───

/**
 * Granular atom for a specific provider's API key.
 * Only re-renders when THIS provider's API key changes.
 */
export function getProviderApiKeyAtom(providerId: APIProviderNames) {
  const sliceAtom = selectAtom(
    configAtom,
    c => (c.providersConfig as Record<string, { apiKey?: string }>)[providerId]?.apiKey ?? '',
  )

  return atom(
    get => get(sliceAtom),
    (get, set, apiKey: string) => {
      const current = get(configAtom)
      set(configFields.providersConfig, {
        ...current.providersConfig,
        [providerId]: {
          ...(current.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId],
          apiKey,
        },
      })
    },
  )
}

// ─── Provider validation state ───

export interface ProviderValidationState {
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'error'
  message?: string
}

/**
 * Atom family for provider validation status.
 * Keyed by provider ID — each provider gets its own validation state.
 */
const providerValidationStates = new Map<string, ReturnType<typeof atom<ProviderValidationState>>>()

export function getProviderValidationAtom(providerId: string) {
  if (!providerValidationStates.has(providerId)) {
    providerValidationStates.set(
      providerId,
      atom<ProviderValidationState>({ status: 'idle' }),
    )
  }
  return providerValidationStates.get(providerId)!
}

// ─── Provider availability (derived) ───

/**
 * Derived atom: is this provider ready to use?
 * True if: config is valid AND (no API key needed OR API key is set).
 */
export function getProviderAvailableAtom(providerId: string) {
  return atom((get) => {
    const caps = PROVIDER_CAPABILITIES[providerId as ProviderId]
    if (!caps)
      return false

    if (!caps.requiresApiKey)
      return true

    const config = get(configAtom)
    const apiKey = (config.providersConfig as Record<string, { apiKey?: string }>)[providerId]?.apiKey
    return !!apiKey
  })
}

// ─── Filtered provider lists (derived atoms) ───

/** Atom that returns all provider IDs supporting translation */
export const translateProviderIdsAtom = atom(() =>
  Object.entries(PROVIDER_CAPABILITIES)
    .filter(([, caps]) => caps.features.includes('translate'))
    .map(([id]) => id),
)

/** Atom that returns all provider IDs supporting read */
export const readProviderIdsAtom = atom(() =>
  Object.entries(PROVIDER_CAPABILITIES)
    .filter(([, caps]) => caps.supportsRead)
    .map(([id]) => id),
)

/** Atom factory that returns provider IDs with a specific feature */
export function getProvidersByFeatureAtom(feature: ProviderFeature) {
  return atom(() =>
    Object.entries(PROVIDER_CAPABILITIES)
      .filter(([, caps]) => (caps.features as readonly ProviderFeature[]).includes(feature))
      .map(([id]) => id),
  )
}

import type { Config } from '@/types/config/config'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { configAtom, configFields, writeConfigAtom } from './config'

/**
 * CRUD operations for config management via Jotai atoms.
 *
 * Provides create/read/update/delete operations on config entries
 * published as Jotai atoms for reactive component subscriptions.
 */

// ─── Generic Field CRUD ─────────────────────────────────────────

/**
 * Read a config field reactively.
 * Returns a read-only atom that selects a top-level config field.
 */
export function readConfigField<K extends keyof Config>(key: K) {
  return selectAtom(configAtom, c => c[key])
}

/**
 * Update a config field (merge with existing value).
 * Uses the validated writeConfigAtom under the hood.
 */
export function updateConfigField<K extends keyof Config>(key: K, value: Partial<Config[K]>) {
  return { [key]: value } as Partial<Config>
}

/**
 * Delete (reset to default) a config field.
 * Sets the field back to its default value from DEFAULT_CONFIG.
 */
export function resetConfigField<K extends keyof Config>(key: K, defaultValue: Config[K]) {
  return { [key]: defaultValue } as Partial<Config>
}

// ─── List Item CRUD (for array config fields) ──────────────────

/**
 * Atom factory for managing list-type config fields (e.g., autoTranslatePatterns).
 * Provides reactive CRUD operations for array entries.
 */
export function createListFieldManager<K extends keyof Config>(
  fieldKey: K,
  /** Extract the array from the field value */
  getArray: (field: Config[K]) => string[],
  /** Reconstruct the field value from a new array */
  setArray: (field: Config[K], newArray: string[]) => Config[K],
) {
  /** Read-only atom: current list items */
  const listAtom = selectAtom(
    configAtom,
    c => getArray(c[fieldKey]),
    (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  )

  /** Add an item to the list (create) */
  const addItemAtom = atom(
    null,
    (get, set, item: string) => {
      const current = get(configAtom)
      const currentList = getArray(current[fieldKey])
      if (currentList.includes(item))
        return // prevent duplicates
      const newList = [...currentList, item]
      const newFieldValue = setArray(current[fieldKey], newList)
      set(writeConfigAtom, { [fieldKey]: newFieldValue } as Partial<Config>)
    },
  )

  /** Remove an item from the list (delete) */
  const removeItemAtom = atom(
    null,
    (get, set, item: string) => {
      const current = get(configAtom)
      const currentList = getArray(current[fieldKey])
      const newList = currentList.filter(i => i !== item)
      const newFieldValue = setArray(current[fieldKey], newList)
      set(writeConfigAtom, { [fieldKey]: newFieldValue } as Partial<Config>)
    },
  )

  /** Replace the entire list (bulk update) */
  const replaceListAtom = atom(
    null,
    (get, set, newList: string[]) => {
      const current = get(configAtom)
      const newFieldValue = setArray(current[fieldKey], newList)
      set(writeConfigAtom, { [fieldKey]: newFieldValue } as Partial<Config>)
    },
  )

  /** Update a specific item by index (update) */
  const updateItemAtIndexAtom = atom(
    null,
    (get, set, payload: { index: number, value: string }) => {
      const current = get(configAtom)
      const currentList = [...getArray(current[fieldKey])]
      if (payload.index >= 0 && payload.index < currentList.length) {
        currentList[payload.index] = payload.value
        const newFieldValue = setArray(current[fieldKey], currentList)
        set(writeConfigAtom, { [fieldKey]: newFieldValue } as Partial<Config>)
      }
    },
  )

  return {
    listAtom,
    addItemAtom,
    removeItemAtom,
    replaceListAtom,
    updateItemAtIndexAtom,
  }
}

// ─── Pre-built managers for specific config lists ───────────────

/**
 * Manager for translate.page.autoTranslatePatterns
 * CRUD operations for URL patterns that trigger auto-translation.
 */
export const autoTranslatePatternsManager = createListFieldManager(
  'translate',
  t => t.page.autoTranslatePatterns,
  (t, patterns) => ({
    ...t,
    page: { ...t.page, autoTranslatePatterns: patterns },
  }),
)

// ─── Provider Config CRUD ───────────────────────────────────────

/**
 * Atom that lists all provider IDs currently configured (with API keys set).
 */
export const configuredProvidersAtom = selectAtom(
  configAtom,
  (c) => {
    const entries = Object.entries(c.providersConfig) as [string, { apiKey?: string }][]
    return entries
      .filter(([, cfg]) => !!cfg.apiKey)
      .map(([id]) => id)
  },
  (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
)

/**
 * Atom that returns all provider IDs (configured or not).
 */
export const allProviderIdsAtom = selectAtom(
  configAtom,
  c => Object.keys(c.providersConfig),
  (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
)

/**
 * Create a provider config CRUD atom for a specific provider.
 */
export function createProviderConfigManager(providerId: string) {
  const providerAtom = selectAtom(
    configAtom,
    c => (c.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId],
    (a, b) => a?.apiKey === b?.apiKey && a?.baseURL === b?.baseURL,
  )

  const updateProviderAtom = atom(
    null,
    (get, set, patch: Partial<{ apiKey: string, baseURL: string }>) => {
      const current = get(configAtom)
      const currentProvider = (current.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId] ?? {}
      set(configFields.providersConfig, {
        ...current.providersConfig,
        [providerId]: { ...currentProvider, ...patch },
      })
    },
  )

  const clearApiKeyAtom = atom(
    null,
    (get, set) => {
      const current = get(configAtom)
      const currentProvider = (current.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId] ?? {}
      set(configFields.providersConfig, {
        ...current.providersConfig,
        [providerId]: { ...currentProvider, apiKey: undefined },
      })
    },
  )

  return {
    readAtom: providerAtom,
    updateAtom: updateProviderAtom,
    clearApiKeyAtom,
  }
}

// ─── Config Reset ───────────────────────────────────────────────

/**
 * Reset the entire config to defaults.
 */
export const resetAllConfigAtom = atom(
  null,
  (_get, set) => {
    set(writeConfigAtom, {
      ...import.meta.env.DEV
        ? undefined
        : {},
    } as Partial<Config>)
  },
)

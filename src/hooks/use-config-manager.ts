import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'

import type { Config } from '@/types/config/config'
import { configAtom, writeConfigAtom, type ConfigWriteResult } from '@/utils/atoms/config'
import {
  allProviderIdsAtom,
  autoTranslatePatternsManager,
  configuredProvidersAtom,
  createProviderConfigManager,
  readConfigField,
} from '@/utils/atoms/config-crud'
import { configFieldRegistry, getFieldKeys, getFieldMetadata, validateField } from '@/utils/config/schema-registry'

/**
 * Hook for reading and writing the full config object.
 */
export function useConfig() {
  const config = useAtomValue(configAtom)
  const writeConfig = useSetAtom(writeConfigAtom)

  const update = useCallback(async (patch: Partial<Config>): Promise<ConfigWriteResult> => {
    return writeConfig(patch)
  }, [writeConfig])

  return { config, update }
}

/**
 * Hook for reading a specific config field reactively.
 */
export function useConfigField<K extends keyof Config>(key: K) {
  const fieldAtom = readConfigField(key)
  return useAtomValue(fieldAtom)
}

/**
 * Hook for updating a specific config field with validation.
 */
export function useConfigFieldWriter<K extends keyof Config>(key: K) {
  const writeConfig = useSetAtom(writeConfigAtom)

  const update = useCallback(async (value: Partial<Config[K]>): Promise<ConfigWriteResult> => {
    return writeConfig({ [key]: value } as Partial<Config>)
  }, [writeConfig, key])

  const validate = useCallback((value: Config[K]) => {
    return validateField(key, value)
  }, [key])

  return { update, validate }
}

/**
 * Hook for managing auto-translate URL patterns (CRUD on the list).
 */
export function useAutoTranslatePatterns() {
  const patterns = useAtomValue(autoTranslatePatternsManager.listAtom)
  const addPattern = useSetAtom(autoTranslatePatternsManager.addItemAtom)
  const removePattern = useSetAtom(autoTranslatePatternsManager.removeItemAtom)
  const replacePatterns = useSetAtom(autoTranslatePatternsManager.replaceListAtom)
  const updatePattern = useSetAtom(autoTranslatePatternsManager.updateItemAtIndexAtom)

  return {
    patterns,
    addPattern: useCallback((pattern: string) => addPattern(pattern), [addPattern]),
    removePattern: useCallback((pattern: string) => removePattern(pattern), [removePattern]),
    replacePatterns: useCallback((patterns: string[]) => replacePatterns(patterns), [replacePatterns]),
    updatePattern: useCallback((index: number, value: string) => updatePattern({ index, value }), [updatePattern]),
  }
}

/**
 * Hook for managing a specific provider's config (CRUD).
 */
export function useProviderConfig(providerId: string) {
  const manager = createProviderConfigManager(providerId)
  const providerConfig = useAtomValue(manager.readAtom)
  const updateProvider = useSetAtom(manager.updateAtom)
  const clearApiKey = useSetAtom(manager.clearApiKeyAtom)

  return {
    config: providerConfig,
    update: useCallback((patch: Partial<{ apiKey: string, baseURL: string }>) => updateProvider(patch), [updateProvider]),
    clearApiKey: useCallback(() => clearApiKey(), [clearApiKey]),
  }
}

/**
 * Hook that returns the list of provider IDs with API keys configured.
 */
export function useConfiguredProviders() {
  return useAtomValue(configuredProvidersAtom)
}

/**
 * Hook that returns all provider IDs.
 */
export function useAllProviderIds() {
  return useAtomValue(allProviderIdsAtom)
}

/**
 * Hook for accessing schema registry metadata.
 */
export function useConfigSchemaInfo() {
  return {
    fields: getFieldKeys(),
    getMetadata: getFieldMetadata,
    registry: configFieldRegistry,
  }
}

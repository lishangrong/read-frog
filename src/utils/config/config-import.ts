import type { Config } from '@/types/config/config'
import { configSchema } from '@/types/config/config'
import { apiProviderNames } from '@/types/config/provider'
import deepmerge from 'deepmerge'
import { z } from 'zod'

import { CONFIG_SCHEMA_VERSION, DEFAULT_CONFIG } from '../constants/config'
import { runMigration } from './migration'

const importMetaSchema = z.object({
  meta: z.object({
    version: z.string(),
    schemaVersion: z.number().int().positive(),
    exportedAt: z.string(),
  }),
  config: z.record(z.unknown()),
})

export type ImportMode = 'overwrite' | 'merge'

export interface ImportResult {
  success: true
  config: Config
}

export interface ImportError {
  success: false
  error: string
}

export async function parseAndValidateImportFile(file: File): Promise<ImportResult | ImportError> {
  let text: string
  try {
    text = await file.text()
  }
  catch {
    return { success: false, error: 'Failed to read file' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  }
  catch {
    return { success: false, error: 'Invalid JSON format' }
  }

  const metaResult = importMetaSchema.safeParse(parsed)
  if (!metaResult.success) {
    return { success: false, error: 'Invalid configuration file format' }
  }

  const { meta, config: rawConfig } = metaResult.data

  if (meta.schemaVersion > CONFIG_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Configuration version (v${meta.schemaVersion}) is newer than current (v${CONFIG_SCHEMA_VERSION}). Please update the extension.`,
    }
  }

  let config = rawConfig as Config
  let currentVersion = meta.schemaVersion

  while (currentVersion < CONFIG_SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1
    try {
      config = await runMigration(nextVersion, config)
      currentVersion = nextVersion
    }
    catch (error) {
      return {
        success: false,
        error: `Migration to version ${nextVersion} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  const configResult = configSchema.safeParse(config)
  if (!configResult.success) {
    return { success: false, error: `Invalid configuration data: ${configResult.error.message}` }
  }

  return { success: true, config: configResult.data }
}

const overwriteMerge = (_target: unknown[], source: unknown[]) => source

export function mergeImportedConfig(current: Config, imported: Config): Config {
  const cleanedImport = structuredClone(imported)
  for (const provider of apiProviderNames) {
    const importedKey = cleanedImport.providersConfig[provider]?.apiKey
    if (importedKey === '' || importedKey === undefined) {
      const currentKey = current.providersConfig[provider]?.apiKey
      if (currentKey) {
        cleanedImport.providersConfig[provider] = {
          ...cleanedImport.providersConfig[provider],
          apiKey: currentKey,
        }
      }
    }
  }

  return deepmerge(current, cleanedImport, { arrayMerge: overwriteMerge })
}

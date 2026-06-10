import type { Config } from '@/types/config/config'
import { configSchema } from '@/types/config/config'
import deepmerge from 'deepmerge'

import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../constants/config'
import { storageAdapter } from '../atoms/storage-adapter'

const overwriteMerge = (_target: unknown[], source: unknown[]) => source

/**
 * Non-component CRUD API for config management.
 * Operates directly on storage, suitable for background scripts and other non-React contexts.
 * Changes are automatically synced to React components via configAtom.onMount's watch mechanism.
 */
export const configCRUD = {
  async read(): Promise<Config> {
    return storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
  },

  async readField<K extends keyof Config>(key: K): Promise<Config[K]> {
    const config = await storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    return config[key]
  },

  async update(patch: Partial<Config>): Promise<{ success: true } | { success: false, error: string }> {
    const current = await storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    const next = deepmerge(current, patch, { arrayMerge: overwriteMerge })
    const result = configSchema.safeParse(next)
    if (!result.success) {
      return { success: false, error: result.error.message }
    }
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true }
  },

  async reset(): Promise<{ success: true }> {
    await storageAdapter.set(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    return { success: true }
  },

  async resetField<K extends keyof Config>(key: K): Promise<{ success: true } | { success: false, error: string }> {
    const current = await storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    const next = { ...current, [key]: DEFAULT_CONFIG[key] }
    const result = configSchema.safeParse(next)
    if (!result.success) {
      return { success: false, error: result.error.message }
    }
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true }
  },
}

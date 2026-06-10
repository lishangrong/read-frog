import type { Config } from '@/types/config/config'
import deepmerge from 'deepmerge'
import { atom } from 'jotai'

import { selectAtom } from 'jotai/utils'

import { configSchema } from '@/types/config/config'
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../constants/config'
import { storageAdapter } from './storage-adapter'

export const configAtom = atom<Config>(DEFAULT_CONFIG)

const overwriteMerge = (_target: unknown[], source: unknown[]) => source

/**
 * Result type for validated config writes.
 * When validation fails, the write is rejected and an error is returned.
 */
export type ConfigWriteResult =
  | { success: true, config: Config }
  | { success: false, error: { message: string, issues: { path: string, message: string }[] } }

/**
 * Validated config write atom.
 * Deep-merges the patch into the current config, validates with Zod,
 * and rejects the write if validation fails.
 */
export const writeConfigAtom = atom(
  null,
  async (get, set, patch: Partial<Config>): Promise<ConfigWriteResult> => {
    const current = get(configAtom)
    const next = deepmerge(current, patch, { arrayMerge: overwriteMerge })

    // Strict Zod validation — reject invalid config
    const result = configSchema.safeParse(next)
    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      console.warn('[ConfigManager] Rejected invalid config write:', issues)
      return {
        success: false,
        error: { message: 'Configuration validation failed', issues },
      }
    }

    set(configAtom, result.data) // UI optimistic update
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true, config: result.data }
  },
)

/**
 * Replace the entire config atom with a new value.
 * Used by import/restore functionality. Validates before applying.
 */
export const replaceConfigAtom = atom(
  null,
  async (_get, set, newConfig: Config): Promise<ConfigWriteResult> => {
    const result = configSchema.safeParse(newConfig)
    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      console.warn('[ConfigManager] Rejected invalid config replacement:', issues)
      return {
        success: false,
        error: { message: 'Configuration validation failed', issues },
      }
    }

    set(configAtom, result.data)
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true, config: result.data }
  },
)

configAtom.onMount = (setAtom: (newValue: Config) => void) => {
  storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG).then(setAtom)
  const unwatch = storageAdapter.watch<Config>(CONFIG_STORAGE_KEY, setAtom)
  return unwatch
}

type Keys = keyof Config

export function getConfigFieldAtom<K extends Keys>(key: K) {
  const sliceAtom = selectAtom(configAtom, c => c[key])

  return atom(
    get => get(sliceAtom),
    async (_get, set, newVal: Partial<Config[K]>): Promise<ConfigWriteResult> =>
      set(writeConfigAtom, { [key]: newVal }),
  )
}

function buildConfigFields<C extends Config>(cfg: C) {
  type ValidKey = Extract<keyof C, keyof Config>
  type Map = { [K in ValidKey]: ReturnType<typeof getConfigFieldAtom<K>> }

  const res = {} as Map

  const add = <K extends ValidKey>(key: K) => {
    res[key] = getConfigFieldAtom(key)
  };

  (Object.keys(cfg) as ValidKey[]).forEach(add)
  return res
}

export const configFields = buildConfigFields(DEFAULT_CONFIG)

import type { Config } from '@/types/config/config'
import { configSchema } from '@/types/config/config'
import deepmerge from 'deepmerge'
import { atom } from 'jotai'

import { selectAtom } from 'jotai/utils'
import type { z } from 'zod'

import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../constants/config'
import { storageAdapter } from './storage-adapter'

export type WriteConfigResult =
  | { success: true }
  | { success: false, errors: z.ZodError }

export const configAtom = atom<Config>(DEFAULT_CONFIG)

const overwriteMerge = (_target: unknown[], source: unknown[]) => source

export const writeConfigAtom = atom(
  null,
  async (get, set, patch: Partial<Config>): Promise<WriteConfigResult> => {
    const next = deepmerge(get(configAtom), patch, { arrayMerge: overwriteMerge })
    const result = configSchema.safeParse(next)
    if (!result.success) {
      return { success: false, errors: result.error }
    }
    set(configAtom, result.data)
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true }
  },
)

configAtom.onMount = (setAtom: (newValue: Config) => void) => {
  storageAdapter.get<Config>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG).then((value) => {
    const result = configSchema.safeParse(value)
    setAtom(result.success ? result.data : DEFAULT_CONFIG)
  })
  const unwatch = storageAdapter.watch<Config>(CONFIG_STORAGE_KEY, (newValue) => {
    const result = configSchema.safeParse(newValue)
    if (result.success) {
      setAtom(result.data)
    }
  })
  return unwatch
}

type Keys = keyof Config

export function getConfigFieldAtom<K extends Keys>(key: K) {
  const sliceAtom = selectAtom(configAtom, c => c[key])

  return atom(
    get => get(sliceAtom),
    (_get, set, newVal: Partial<Config[K]>): Promise<WriteConfigResult> =>
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

export const resetConfigAtom = atom(
  null,
  async (_get, set): Promise<WriteConfigResult> => {
    set(configAtom, DEFAULT_CONFIG)
    await storageAdapter.set(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    return { success: true }
  },
)

export const resetConfigFieldAtom = atom(
  null,
  async (get, set, key: Keys): Promise<WriteConfigResult> => {
    const current = get(configAtom)
    const next = { ...current, [key]: DEFAULT_CONFIG[key] }
    const result = configSchema.safeParse(next)
    if (!result.success) {
      return { success: false, errors: result.error }
    }
    set(configAtom, result.data)
    await storageAdapter.set(CONFIG_STORAGE_KEY, result.data)
    return { success: true }
  },
)

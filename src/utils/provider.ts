import type { Config } from '@/types/config/config'

import type { ReadProviderNames, translateProviderModels } from '@/types/config/provider'
import { getProviderRegistryInstance } from '@/providers/registry'
import { CONFIG_STORAGE_KEY, DEFAULT_PROVIDER_CONFIG } from './constants/config'

/**
 * @deprecated Use getProviderRegistryInstance().get(provider).getLanguageModel(ctx) instead.
 * Kept for backward compatibility with read.tsx hooks.
 */
export async function getTranslateModel(provider: keyof typeof translateProviderModels, model: string) {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  const registry = getProviderRegistryInstance()
  const contract = registry.get(provider)

  if (!contract.getLanguageModel) {
    throw new Error(`Provider "${provider}" does not support language models`)
  }

  const providerConfig = config?.providersConfig?.[provider as keyof typeof config.providersConfig]
  return contract.getLanguageModel({
    apiKey: providerConfig?.apiKey ?? '',
    baseURL: providerConfig?.baseURL ?? DEFAULT_PROVIDER_CONFIG[provider as keyof typeof DEFAULT_PROVIDER_CONFIG]?.baseURL,
    model,
    isCustomModel: false,
  })
}

/**
 * @deprecated Use getProviderRegistryInstance().get(provider).getLanguageModel(ctx) instead.
 * Kept for backward compatibility with read.tsx hooks.
 */
export async function getReadModel(provider: ReadProviderNames, model: string) {
  return getTranslateModel(provider, model)
}

/**
 * @deprecated Use getProviderRegistryInstance() instead.
 * Kept for backward compatibility.
 */
export async function getProviderRegistry() {
  // This now returns our custom registry, not the Vercel AI SDK registry
  return getProviderRegistryInstance()
}

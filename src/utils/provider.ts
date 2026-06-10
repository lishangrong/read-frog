import type { Config } from '@/types/config/config'
import type { APIProviderNames, ReadProviderNames } from '@/types/config/provider'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createProviderRegistry } from 'ai'
import { CONFIG_STORAGE_KEY, DEFAULT_PROVIDER_CONFIG } from './constants/config'

type ProviderConfig = { apiKey?: string, baseURL?: string }

const PROVIDER_FACTORIES: Record<APIProviderNames, (cfg: ProviderConfig) => any> = {
  // Dedicated SDK providers
  openai: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
  deepseek: cfg => createDeepSeek({ apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
  gemini: cfg => createGoogleGenerativeAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
  claude: cfg => createAnthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
  openrouter: cfg => createOpenRouter({ apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
  // OpenAI-compatible providers
  ollama: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'ollama' }),
  groq: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'groq' }),
  mistral: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'mistral' }),
  xai: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'xai' }),
  moonshot: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'moonshot' }),
  zhipu: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'zhipu' }),
  baichuan: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'baichuan' }),
  minimax: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'minimax' }),
  stepfun: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'stepfun' }),
  lingyi: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'lingyi' }),
  qwen: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'qwen' }),
  doubao: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'doubao' }),
  hunyuan: cfg => createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, name: 'hunyuan' }),
}

function getProviderConfig(config: Config | null, provider: APIProviderNames): ProviderConfig {
  return {
    apiKey: config?.providersConfig?.[provider]?.apiKey,
    baseURL: config?.providersConfig?.[provider]?.baseURL ?? DEFAULT_PROVIDER_CONFIG[provider].baseURL,
  }
}

export async function getProviderRegistry() {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)

  const registryEntries: Record<string, any> = {}
  for (const [name, factory] of Object.entries(PROVIDER_FACTORIES)) {
    registryEntries[name] = factory(getProviderConfig(config, name as APIProviderNames))
  }

  return createProviderRegistry(registryEntries)
}

export async function getTranslateModel(provider: APIProviderNames, model: string) {
  const registry = await getProviderRegistry()
  return registry.languageModel(`${provider}:${model}`)
}

export async function getReadModel(provider: ReadProviderNames, model: string) {
  const registry = await getProviderRegistry()
  return registry.languageModel(`${provider}:${model}`)
}

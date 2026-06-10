import type { ProviderFeature } from '@/types/provider/capabilities'
import type { IProviderContract, ProviderContext } from '@/types/provider/contract'
import type { Config } from '@/types/config/config'
import type { APIProviderNames } from '@/types/config/provider'
import { PROVIDER_CAPABILITIES } from './capabilities-map'
import type { ProviderId } from './capabilities-map'

/**
 * Provider registry — factory pattern replacing the hardcoded createProviderRegistry().
 *
 * Usage:
 *   const registry = getProviderRegistryInstance()
 *   const provider = registry.get('openai')
 *   const result = await provider.translate(ctx, { text, sourceLang, targetLang })
 */
class ProviderRegistry {
  private providers = new Map<string, IProviderContract>()

  /** Register a provider implementation */
  register(provider: IProviderContract): void {
    this.providers.set(provider.id, provider)
  }

  /** Get a provider by ID, throws if not registered */
  get(providerId: string): IProviderContract {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(
        `Provider "${providerId}" is not registered. Available: ${[...this.providers.keys()].join(', ')}`,
      )
    }
    return provider
  }

  /** Check if a provider is registered */
  has(providerId: string): boolean {
    return this.providers.has(providerId)
  }

  /** Get all registered provider IDs */
  getProviderIds(): string[] {
    return [...this.providers.keys()]
  }

  /** Get all registered providers */
  getAll(): IProviderContract[] {
    return [...this.providers.values()]
  }

  /** Get providers filtered by feature */
  getProvidersWithFeature(feature: ProviderFeature): IProviderContract[] {
    return [...this.providers.values()].filter(
      p => p.capabilities.features.includes(feature),
    )
  }

  /** Get providers filtered by type */
  getProvidersByType(type: 'llm' | 'http-translate'): IProviderContract[] {
    return [...this.providers.values()].filter(
      p => p.capabilities.type === type,
    )
  }

  /**
   * Resolve ProviderContext from stored config for a given provider.
   * This is where config resolution happens — providers receive the context,
   * not raw config objects.
   */
  resolveContext(providerId: string, config: Config): ProviderContext {
    const caps = PROVIDER_CAPABILITIES[providerId as ProviderId]
    if (!caps) {
      throw new Error(`Unknown provider: ${providerId}`)
    }

    const providerConfig = (config.providersConfig as Record<string, { apiKey?: string, baseURL?: string }>)[providerId]

    // For HTTP translate providers, model config is null
    const modelConfig = (config.translate.models as Record<string, { model: string, isCustomModel: boolean, customModel?: string } | null>)[providerId]

    return {
      apiKey: providerConfig?.apiKey,
      baseURL: providerConfig?.baseURL,
      model: modelConfig?.model ?? '',
      isCustomModel: modelConfig?.isCustomModel ?? false,
      customModel: modelConfig?.customModel,
    }
  }
}

// Singleton
let _registry: ProviderRegistry | null = null

/**
 * Get the singleton ProviderRegistry instance.
 * Lazily creates and registers all providers on first call.
 */
export function getProviderRegistryInstance(): ProviderRegistry {
  if (!_registry) {
    _registry = new ProviderRegistry()
    // Dynamic import to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    registerAllProviders(_registry)
  }
  return _registry
}

/**
 * Backward-compatible async factory.
 * Replaces the old getProviderRegistry() that returned Vercel AI ProviderRegistry.
 */
export async function getProviderRegistry(): Promise<ProviderRegistry> {
  return getProviderRegistryInstance()
}

// Import all provider implementations
import { OpenAIProvider } from './llm/openai'
import { DeepSeekProvider } from './llm/deepseek'
import { OpenRouterProvider } from './llm/openrouter'
import { OllamaProvider } from './llm/ollama'
import { AnthropicProvider } from './llm/anthropic'
import { GeminiProvider } from './llm/gemini'
import { GroqProvider } from './llm/groq'
import { MistralProvider } from './llm/mistral'
import { CohereProvider } from './llm/cohere'
import { XAIProvider } from './llm/xai'
import { PerplexityProvider } from './llm/perplexity'
import { CerebrasProvider } from './llm/cerebras'
import { SambaNovaProvider } from './llm/sambanova'
import { TogetherProvider } from './llm/together'
import { FireworksProvider } from './llm/fireworks'
import { ZhipuProvider } from './llm/zhipu'
import { MoonshotProvider } from './llm/moonshot'
import { GoogleProvider } from './translate/google'
import { MicrosoftProvider } from './translate/microsoft'
import { DeepLProvider } from './translate/deepl'
import { YandexProvider } from './translate/yandex'
import { BaiduProvider } from './translate/baidu'

/**
 * Register all 22 providers into the registry.
 */
function registerAllProviders(registry: ProviderRegistry): void {
  // LLM providers
  registry.register(new OpenAIProvider())
  registry.register(new DeepSeekProvider())
  registry.register(new OpenRouterProvider())
  registry.register(new OllamaProvider())
  registry.register(new AnthropicProvider())
  registry.register(new GeminiProvider())
  registry.register(new GroqProvider())
  registry.register(new MistralProvider())
  registry.register(new CohereProvider())
  registry.register(new XAIProvider())
  registry.register(new PerplexityProvider())
  registry.register(new CerebrasProvider())
  registry.register(new SambaNovaProvider())
  registry.register(new TogetherProvider())
  registry.register(new FireworksProvider())
  registry.register(new ZhipuProvider())
  registry.register(new MoonshotProvider())

  // HTTP translate providers
  registry.register(new GoogleProvider())
  registry.register(new MicrosoftProvider())
  registry.register(new DeepLProvider())
  registry.register(new YandexProvider())
  registry.register(new BaiduProvider())
}

/**
 * Migration v7 → v8: Add 16 new providers (13 LLM + 3 HTTP translate).
 * Preserves all existing user configuration — only adds defaults for new providers.
 */
export function migrate(oldConfig: any): any {
  // New LLM providers — providersConfig defaults
  const newLLMProvidersConfig = {
    anthropic: { apiKey: undefined, baseURL: 'https://api.anthropic.com/v1' },
    gemini: { apiKey: undefined, baseURL: 'https://generativelanguage.googleapis.com/v1beta' },
    groq: { apiKey: undefined, baseURL: 'https://api.groq.com/openai/v1' },
    mistral: { apiKey: undefined, baseURL: 'https://api.mistral.ai/v1' },
    cohere: { apiKey: undefined, baseURL: 'https://api.cohere.ai/v2' },
    xai: { apiKey: undefined, baseURL: 'https://api.x.ai/v1' },
    perplexity: { apiKey: undefined, baseURL: 'https://api.perplexity.ai' },
    cerebras: { apiKey: undefined, baseURL: 'https://api.cerebras.ai/v1' },
    sambanova: { apiKey: undefined, baseURL: 'https://api.sambanova.ai/v1' },
    together: { apiKey: undefined, baseURL: 'https://api.together.xyz/v1' },
    fireworks: { apiKey: undefined, baseURL: 'https://api.fireworks.ai/inference/v1' },
    zhipu: { apiKey: undefined, baseURL: 'https://open.bigmodel.cn/api/paas/v4' },
    moonshot: { apiKey: undefined, baseURL: 'https://api.moonshot.cn/v1' },
  }

  // New HTTP translate providers — providersConfig defaults
  const newHttpProvidersConfig = {
    deepl: { apiKey: undefined, baseURL: undefined },
    yandex: { apiKey: undefined, baseURL: undefined },
    baidu: { apiKey: undefined, baseURL: undefined },
  }

  // New LLM providers — translate.models defaults
  const newTranslateLLMModels = {
    anthropic: { model: 'claude-sonnet-4-20250514', isCustomModel: false, customModel: '' },
    gemini: { model: 'gemini-2.5-flash', isCustomModel: false, customModel: '' },
    groq: { model: 'llama-3.3-70b-versatile', isCustomModel: false, customModel: '' },
    mistral: { model: 'mistral-large-latest', isCustomModel: false, customModel: '' },
    cohere: { model: 'command-r-plus', isCustomModel: false, customModel: '' },
    xai: { model: 'grok-2-latest', isCustomModel: false, customModel: '' },
    perplexity: { model: 'sonar', isCustomModel: false, customModel: '' },
    cerebras: { model: 'llama-3.3-70b', isCustomModel: false, customModel: '' },
    sambanova: { model: 'Meta-Llama-3.3-70B-Instruct', isCustomModel: false, customModel: '' },
    together: { model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', isCustomModel: false, customModel: '' },
    fireworks: { model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', isCustomModel: false, customModel: '' },
    zhipu: { model: 'glm-4-flash', isCustomModel: false, customModel: '' },
    moonshot: { model: 'moonshot-v1-8k', isCustomModel: false, customModel: '' },
  }

  // New HTTP providers — translate.models defaults (null for pure translate)
  const newTranslateHttpModels = {
    deepl: null,
    yandex: null,
    baidu: null,
  }

  // New read-capable providers — read.models defaults
  const newReadModels = {
    anthropic: { model: 'claude-sonnet-4-20250514', isCustomModel: false, customModel: '' },
    gemini: { model: 'gemini-2.5-flash', isCustomModel: false, customModel: '' },
    groq: { model: 'llama-3.3-70b-versatile', isCustomModel: false, customModel: '' },
    mistral: { model: 'mistral-large-latest', isCustomModel: false, customModel: '' },
    cohere: { model: 'command-r-plus', isCustomModel: false, customModel: '' },
    xai: { model: 'grok-2-latest', isCustomModel: false, customModel: '' },
    cerebras: { model: 'llama-3.3-70b', isCustomModel: false, customModel: '' },
    sambanova: { model: 'Meta-Llama-3.3-70B-Instruct', isCustomModel: false, customModel: '' },
    together: { model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', isCustomModel: false, customModel: '' },
    fireworks: { model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', isCustomModel: false, customModel: '' },
    zhipu: { model: 'glm-4-flash', isCustomModel: false, customModel: '' },
    moonshot: { model: 'moonshot-v1-8k', isCustomModel: false, customModel: '' },
  }

  return {
    ...oldConfig,
    providersConfig: {
      ...oldConfig.providersConfig,
      ...newLLMProvidersConfig,
      ...newHttpProvidersConfig,
    },
    read: {
      ...oldConfig.read,
      models: {
        ...oldConfig.read.models,
        ...newReadModels,
      },
    },
    translate: {
      ...oldConfig.translate,
      models: {
        ...oldConfig.translate.models,
        ...newTranslateLLMModels,
        ...newTranslateHttpModels,
      },
    },
  }
}

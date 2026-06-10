export const description = 'Add 16 new providers (13 LLM + 3 HTTP translate)'

export const configExample = {
  language: {
    detectedCode: 'eng',
    sourceCode: 'auto',
    targetCode: 'jpn',
    level: 'intermediate',
  },
  providersConfig: {
    // Original v7 providers (preserved from v7)
    openai: {
      apiKey: 'sk-1234567890',
      baseURL: 'https://api.openai.com/v1',
    },
    deepseek: {
      apiKey: undefined,
      baseURL: 'https://api.deepseek.com/v1',
    },
    openrouter: {
      apiKey: undefined,
      baseURL: 'https://openrouter.ai/api/v1',
    },
    ollama: {
      apiKey: undefined,
      baseURL: 'http://127.0.0.1:11434/v1',
    },
    // New LLM providers (added by v8 migration)
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
    // New HTTP translate providers
    deepl: { apiKey: undefined, baseURL: undefined },
    yandex: { apiKey: undefined, baseURL: undefined },
    baidu: { apiKey: undefined, baseURL: undefined },
  },
  read: {
    provider: 'openai',
    models: {
      // Original v7 models
      openai: { model: 'gpt-4o-mini', isCustomModel: true, customModel: 'gpt-4.1-nano' },
      deepseek: { model: 'deepseek-chat', isCustomModel: false, customModel: '' },
      // New LLM providers
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
    },
  },
  translate: {
    provider: 'microsoft',
    models: {
      // Original v7 models
      microsoft: null,
      google: null,
      openai: { model: 'gpt-4o-mini', isCustomModel: true, customModel: 'gpt-4.1-nano' },
      deepseek: { model: 'deepseek-chat', isCustomModel: false, customModel: '' },
      openrouter: { model: 'meta-llama/llama-4-maverick:free', isCustomModel: false, customModel: '' },
      ollama: { model: 'gemma3:1b', isCustomModel: false, customModel: '' },
      // New LLM providers
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
      // New HTTP translate providers
      deepl: null,
      yandex: null,
      baidu: null,
    },
    node: {
      enabled: true,
      hotkey: 'Control',
    },
    page: {
      range: 'main',
      autoTranslatePatterns: ['news.ycombinator.com'],
    },
  },
  floatingButton: {
    enabled: true,
    position: 0.66,
  },
  sideContent: {
    width: 400,
  },
}

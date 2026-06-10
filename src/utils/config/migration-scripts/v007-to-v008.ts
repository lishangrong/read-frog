import deepmerge from 'deepmerge'

export function migrate(oldConfig: any): any {
  // Add all new provider entries for the 14 new providers
  const newProviders = {
    gemini: { apiKey: undefined, baseURL: 'https://generativelanguage.googleapis.com/v1beta' },
    claude: { apiKey: undefined, baseURL: 'https://api.anthropic.com' },
    groq: { apiKey: undefined, baseURL: 'https://api.groq.com/openai/v1' },
    mistral: { apiKey: undefined, baseURL: 'https://api.mistral.ai/v1' },
    xai: { apiKey: undefined, baseURL: 'https://api.x.ai/v1' },
    moonshot: { apiKey: undefined, baseURL: 'https://api.moonshot.cn/v1' },
    zhipu: { apiKey: undefined, baseURL: 'https://open.bigmodel.cn/api/paas/v4' },
    baichuan: { apiKey: undefined, baseURL: 'https://api.baichuan-ai.com/v1' },
    minimax: { apiKey: undefined, baseURL: 'https://api.minimax.chat/v1' },
    stepfun: { apiKey: undefined, baseURL: 'https://api.stepfun.com/v1' },
    lingyi: { apiKey: undefined, baseURL: 'https://api.lingyiwanwu.com/v1' },
    qwen: { apiKey: undefined, baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    doubao: { apiKey: undefined, baseURL: 'https://ark.cn-beijing.volces.com/api/v3' },
    hunyuan: { apiKey: undefined, baseURL: 'https://api.hunyuan.cloud.tencent.com/v1' },
  }

  const defaultModelConfig = (model: string) => ({
    model,
    isCustomModel: false,
    customModel: '',
  })

  const newReadModels = {
    gemini: defaultModelConfig('gemini-2.5-flash'),
    claude: defaultModelConfig('claude-sonnet-4-5-20250514'),
    groq: defaultModelConfig('llama-3.3-70b-versatile'),
    mistral: defaultModelConfig('mistral-small-latest'),
    xai: defaultModelConfig('grok-3-mini'),
    moonshot: defaultModelConfig('moonshot-v1-8k'),
    zhipu: defaultModelConfig('glm-4-flash'),
    baichuan: defaultModelConfig('Baichuan4-Turbo'),
    minimax: defaultModelConfig('MiniMax-Text-01'),
    stepfun: defaultModelConfig('step-1-8k'),
    lingyi: defaultModelConfig('yi-lightning'),
    qwen: defaultModelConfig('qwen-turbo'),
    doubao: defaultModelConfig('doubao-1.5-pro-32k'),
    hunyuan: defaultModelConfig('hunyuan-turbo'),
  }

  const newTranslateModels = {
    gemini: defaultModelConfig('gemini-2.5-flash'),
    claude: defaultModelConfig('claude-sonnet-4-5-20250514'),
    groq: defaultModelConfig('llama-3.3-70b-versatile'),
    mistral: defaultModelConfig('mistral-small-latest'),
    xai: defaultModelConfig('grok-3-mini'),
    moonshot: defaultModelConfig('moonshot-v1-8k'),
    zhipu: defaultModelConfig('glm-4-flash'),
    baichuan: defaultModelConfig('Baichuan4-Turbo'),
    minimax: defaultModelConfig('MiniMax-Text-01'),
    stepfun: defaultModelConfig('step-1-8k'),
    lingyi: defaultModelConfig('yi-lightning'),
    qwen: defaultModelConfig('qwen-turbo'),
    doubao: defaultModelConfig('doubao-1.5-pro-32k'),
    hunyuan: defaultModelConfig('hunyuan-turbo'),
  }

  return deepmerge(oldConfig, {
    providersConfig: newProviders,
    read: {
      models: newReadModels,
    },
    translate: {
      models: newTranslateModels,
    },
  })
}

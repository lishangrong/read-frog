import { readProviderModels, translateProviderModels } from './provider'

/* ──────────────────────────────
  Model capabilities interface
  ────────────────────────────── */

export interface ModelCapabilities {
  streaming: boolean
  structuredOutput: boolean
  functionCalling: boolean
  vision: boolean
  maxTokens: number
  contextWindow: number
  costPer1kTokens?: { input: number, output: number }
}

/* ──────────────────────────────
  Model capabilities data
  Keyed by "provider:model" composite string
  ────────────────────────────── */

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // OpenAI
  'openai:gpt-4.1-nano': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 32768, contextWindow: 1047576 },
  'openai:gpt-4.1-mini': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 32768, contextWindow: 1047576 },
  'openai:gpt-4o-mini': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 16384, contextWindow: 128000 },
  'openai:gpt-4o': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 16384, contextWindow: 128000 },
  'openai:gpt-4.1': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 32768, contextWindow: 1047576 },

  // DeepSeek
  'deepseek:deepseek-chat': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 8192, contextWindow: 65536 },

  // Gemini
  'gemini:gemini-2.5-flash': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 65536, contextWindow: 1048576 },
  'gemini:gemini-2.5-pro': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 65536, contextWindow: 1048576 },
  'gemini:gemini-2.0-flash': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 8192, contextWindow: 1048576 },

  // Claude
  'claude:claude-sonnet-4-5-20250514': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 16384, contextWindow: 200000 },
  'claude:claude-haiku-4-5-20251001': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 8192, contextWindow: 200000 },

  // Groq
  'groq:llama-3.3-70b-versatile': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 32768, contextWindow: 128000 },
  'groq:gemma2-9b-it': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 8192, contextWindow: 8192 },

  // Mistral
  'mistral:mistral-small-latest': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 32768, contextWindow: 128000 },
  'mistral:mistral-large-latest': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 32768, contextWindow: 128000 },

  // xAI
  'xai:grok-3-mini': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 16384, contextWindow: 131072 },
  'xai:grok-3': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 16384, contextWindow: 131072 },

  // Moonshot
  'moonshot:moonshot-v1-8k': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 8192 },
  'moonshot:moonshot-v1-32k': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 32768 },

  // Zhipu
  'zhipu:glm-4-flash': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 128000 },
  'zhipu:glm-4-plus': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 128000 },

  // Baichuan
  'baichuan:Baichuan4-Turbo': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },
  'baichuan:Baichuan4-Air': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },

  // MiniMax
  'minimax:MiniMax-Text-01': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 1000000 },
  'minimax:abab6.5s-chat': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 8192 },

  // StepFun
  'stepfun:step-1-8k': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 8192 },
  'stepfun:step-2-16k': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 16384 },

  // Lingyi / Yi
  'lingyi:yi-lightning': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 16384 },
  'lingyi:yi-large': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 32768 },

  // Qwen
  'qwen:qwen-turbo': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 8192, contextWindow: 131072 },
  'qwen:qwen-plus': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 8192, contextWindow: 131072 },
  'qwen:qwen-max': { streaming: true, structuredOutput: true, functionCalling: true, vision: true, maxTokens: 8192, contextWindow: 131072 },

  // Doubao
  'doubao:doubao-1.5-pro-32k': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 32768 },
  'doubao:doubao-1.5-lite-32k': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },

  // Hunyuan
  'hunyuan:hunyuan-turbo': { streaming: true, structuredOutput: false, functionCalling: true, vision: false, maxTokens: 4096, contextWindow: 32768 },
  'hunyuan:hunyuan-lite': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },

  // OpenRouter (free models)
  'openrouter:meta-llama/llama-4-maverick:free': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 8192, contextWindow: 131072 },
  'openrouter:deepseek/deepseek-chat-v3-0324:free': { streaming: true, structuredOutput: true, functionCalling: true, vision: false, maxTokens: 8192, contextWindow: 65536 },
  'openrouter:deepseek/deepseek-prover-v2:free': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 8192, contextWindow: 65536 },

  // Ollama (local models, capabilities are approximate)
  'ollama:deepseek-r1:8b': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 65536 },
  'ollama:gemma3:1b': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 8192 },
  'ollama:qwen3:0.6b': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },
  'ollama:qwen3:8b': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 32768 },
  'ollama:gemma3:latest': { streaming: true, structuredOutput: false, functionCalling: false, vision: true, maxTokens: 4096, contextWindow: 8192 },
  'ollama:llama3.1:8b': { streaming: true, structuredOutput: false, functionCalling: false, vision: false, maxTokens: 4096, contextWindow: 131072 },
}

/* ──────────────────────────────
  Lookup functions
  ────────────────────────────── */

export function getModelCapabilities(provider: string, model: string): ModelCapabilities | undefined {
  return MODEL_CAPABILITIES[`${provider}:${model}`]
}

export function findModelsWithCapability(
  capability: keyof Omit<ModelCapabilities, 'maxTokens' | 'contextWindow' | 'costPer1kTokens'>,
): Array<{ provider: string, model: string }> {
  return Object.entries(MODEL_CAPABILITIES)
    .filter(([_, caps]) => caps[capability] === true)
    .map(([key]) => {
      const [provider, ...modelParts] = key.split(':')
      return { provider, model: modelParts.join(':') }
    })
}

export function getAllKnownModels(): Array<{ provider: string, model: string }> {
  const models: Array<{ provider: string, model: string }> = []
  for (const [provider, providerModels] of Object.entries(readProviderModels)) {
    for (const model of providerModels) {
      models.push({ provider, model })
    }
  }
  for (const [provider, providerModels] of Object.entries(translateProviderModels)) {
    for (const model of providerModels) {
      if (!models.some(m => m.provider === provider && m.model === model)) {
        models.push({ provider, model })
      }
    }
  }
  return models
}

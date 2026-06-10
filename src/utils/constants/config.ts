import type { Config } from '@/types/config/config'
import type { AllProviderNames, PageTranslateRange, ProvidersConfig, ReadModels, TranslateModels } from '@/types/config/provider'
import anthropicLogo from '@/assets/provider/anthropic.png'
import baiduLogo from '@/assets/provider/baidu.png'
import cerebrasLogo from '@/assets/provider/cerebras.png'
import cohereLogo from '@/assets/provider/cohere.png'
import deepseekLogo from '@/assets/provider/deepseek.png'
import deeplLogo from '@/assets/provider/deepl.png'
import fireworksLogo from '@/assets/provider/fireworks.png'
import geminiLogo from '@/assets/provider/gemini.png'
import googleLogo from '@/assets/provider/google.png'
import groqLogo from '@/assets/provider/groq.png'
import microsoftLogo from '@/assets/provider/microsoft.png'
import mistralLogo from '@/assets/provider/mistral.png'
import moonshotLogo from '@/assets/provider/moonshot.png'
import ollamaLogo from '@/assets/provider/ollama.png'
import openaiLogo from '@/assets/provider/openai.jpg'
import openrouterLogo from '@/assets/provider/openrouter.png'
import perplexityLogo from '@/assets/provider/perplexity.png'
import sambanovaLogo from '@/assets/provider/sambanova.png'
import togetherLogo from '@/assets/provider/together.png'
import xaiLogo from '@/assets/provider/xai.png'
import yandexLogo from '@/assets/provider/yandex.png'
import zhipuLogo from '@/assets/provider/zhipu.png'
import { apiProviderNames, pureTranslateProvider, readProviderNames, translateProviderNames } from '@/types/config/provider'
import { omit, pick } from '@/types/utils'

export const CONFIG_STORAGE_KEY = 'config'
export const CONFIG_SCHEMA_VERSION = 9

export const MIN_SIDE_CONTENT_WIDTH = 400 // px
export const DEFAULT_SIDE_CONTENT_WIDTH = 400 // px

export const DEFAULT_PROVIDER_CONFIG: ProvidersConfig = {
  openai: {
    apiKey: undefined,
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
    baseURL: 'http://localhost:11434/v1',
  },
  anthropic: {
    apiKey: undefined,
    baseURL: 'https://api.anthropic.com/v1',
  },
  gemini: {
    apiKey: undefined,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  },
  groq: {
    apiKey: undefined,
    baseURL: 'https://api.groq.com/openai/v1',
  },
  mistral: {
    apiKey: undefined,
    baseURL: 'https://api.mistral.ai/v1',
  },
  cohere: {
    apiKey: undefined,
    baseURL: 'https://api.cohere.ai/v2',
  },
  xai: {
    apiKey: undefined,
    baseURL: 'https://api.x.ai/v1',
  },
  perplexity: {
    apiKey: undefined,
    baseURL: 'https://api.perplexity.ai',
  },
  cerebras: {
    apiKey: undefined,
    baseURL: 'https://api.cerebras.ai/v1',
  },
  sambanova: {
    apiKey: undefined,
    baseURL: 'https://api.sambanova.ai/v1',
  },
  together: {
    apiKey: undefined,
    baseURL: 'https://api.together.xyz/v1',
  },
  fireworks: {
    apiKey: undefined,
    baseURL: 'https://api.fireworks.ai/inference/v1',
  },
  zhipu: {
    apiKey: undefined,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  moonshot: {
    apiKey: undefined,
    baseURL: 'https://api.moonshot.cn/v1',
  },
}

export const DEFAULT_READ_MODELS: ReadModels = {
  openai: { model: 'gpt-4.1-mini', isCustomModel: false, customModel: '' },
  deepseek: { model: 'deepseek-chat', isCustomModel: false, customModel: '' },
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

export const DEFAULT_TRANSLATE_MODELS: TranslateModels = {
  microsoft: null,
  google: null,
  openai: { model: 'gpt-4.1-mini', isCustomModel: false, customModel: '' },
  deepseek: { model: 'deepseek-chat', isCustomModel: false, customModel: '' },
  openrouter: { model: 'meta-llama/llama-4-maverick:free', isCustomModel: false, customModel: '' },
  ollama: { model: 'gemma3:1b', isCustomModel: false, customModel: '' },
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

export const DEFAULT_CONFIG: Config = {
  language: {
    detectedCode: 'eng',
    sourceCode: 'auto',
    targetCode: 'eng',
    level: 'intermediate',
  },
  providersConfig: DEFAULT_PROVIDER_CONFIG,
  read: {
    provider: 'openai',
    models: DEFAULT_READ_MODELS,
  },
  translate: {
    provider: 'microsoft',
    models: DEFAULT_TRANSLATE_MODELS,
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
    width: DEFAULT_SIDE_CONTENT_WIDTH,
  },
  rendering: {
    mode: 'bilingual',
  },
  tts: {
    enabled: true,
    speed: 1.0,
    voiceId: 'alloy',
    volume: 1.0,
  },
  subtitle: {
    enabled: true,
    autoTranslate: true,
  },
}

export const PROVIDER_ITEMS: Record<AllProviderNames, { logo: string, name: string }>
  = {
    microsoft: { logo: microsoftLogo, name: 'Microsoft Translator' },
    google: { logo: googleLogo, name: 'Google Translate' },
    openai: { logo: openaiLogo, name: 'OpenAI' },
    deepseek: { logo: deepseekLogo, name: 'DeepSeek' },
    openrouter: { logo: openrouterLogo, name: 'OpenRouter' },
    ollama: { logo: ollamaLogo, name: 'Ollama' },
    anthropic: { logo: anthropicLogo, name: 'Anthropic' },
    gemini: { logo: geminiLogo, name: 'Google Gemini' },
    groq: { logo: groqLogo, name: 'Groq' },
    mistral: { logo: mistralLogo, name: 'Mistral' },
    cohere: { logo: cohereLogo, name: 'Cohere' },
    xai: { logo: xaiLogo, name: 'xAI (Grok)' },
    perplexity: { logo: perplexityLogo, name: 'Perplexity' },
    cerebras: { logo: cerebrasLogo, name: 'Cerebras' },
    sambanova: { logo: sambanovaLogo, name: 'SambaNova' },
    together: { logo: togetherLogo, name: 'Together AI' },
    fireworks: { logo: fireworksLogo, name: 'Fireworks AI' },
    zhipu: { logo: zhipuLogo, name: 'Zhipu (GLM)' },
    moonshot: { logo: moonshotLogo, name: 'Moonshot (Kimi)' },
  }

export const TRANSLATE_PROVIDER_ITEMS = pick(
  PROVIDER_ITEMS,
  translateProviderNames,
)

export const PURE_TRANSLATE_PROVIDER_ITEMS = pick(
  TRANSLATE_PROVIDER_ITEMS,
  pureTranslateProvider,
)

export const LLM_TRANSLATE_PROVIDER_ITEMS = omit(
  TRANSLATE_PROVIDER_ITEMS,
  pureTranslateProvider,
)

export const READ_PROVIDER_ITEMS = pick(
  PROVIDER_ITEMS,
  readProviderNames,
)

export const API_PROVIDER_ITEMS = pick(
  PROVIDER_ITEMS,
  apiProviderNames,
)

export const PAGE_TRANSLATE_RANGE_ITEMS: Record<
  PageTranslateRange,
  { label: string }
> = {
  main: { label: 'Main' },
  all: { label: 'All' },
}

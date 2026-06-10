import type { Config } from '@/types/config/config'
import type { AllProviderNames, PageTranslateRange, ProvidersConfig, ReadModels, TranslateModels } from '@/types/config/provider'
import baichuanLogo from '@/assets/provider/baichuan.png'
import claudeLogo from '@/assets/provider/claude.png'
import deepseekLogo from '@/assets/provider/deepseek.png'
import doubaoLogo from '@/assets/provider/doubao.png'
import geminiLogo from '@/assets/provider/gemini.png'
import googleLogo from '@/assets/provider/google.png'
import groqLogo from '@/assets/provider/groq.png'
import hunyuanLogo from '@/assets/provider/hunyuan.png'
import lingyiLogo from '@/assets/provider/lingyi.png'
import microsoftLogo from '@/assets/provider/microsoft.png'
import minimaxLogo from '@/assets/provider/minimax.png'
import mistralLogo from '@/assets/provider/mistral.png'
import moonshotLogo from '@/assets/provider/moonshot.png'
import ollamaLogo from '@/assets/provider/ollama.png'
import openaiLogo from '@/assets/provider/openai.jpg'
import openrouterLogo from '@/assets/provider/openrouter.png'
import qwenLogo from '@/assets/provider/qwen.png'
import stepfunLogo from '@/assets/provider/stepfun.png'
import xaiLogo from '@/assets/provider/xai.png'
import zhipuLogo from '@/assets/provider/zhipu.png'
import { apiProviderNames, pureTranslateProvider, readProviderNames, translateProviderNames } from '@/types/config/provider'
import { omit, pick } from '@/types/utils'

export const CONFIG_STORAGE_KEY = 'config'
export const CONFIG_SCHEMA_VERSION = 8

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
  gemini: {
    apiKey: undefined,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  },
  claude: {
    apiKey: undefined,
    baseURL: 'https://api.anthropic.com',
  },
  groq: {
    apiKey: undefined,
    baseURL: 'https://api.groq.com/openai/v1',
  },
  mistral: {
    apiKey: undefined,
    baseURL: 'https://api.mistral.ai/v1',
  },
  xai: {
    apiKey: undefined,
    baseURL: 'https://api.x.ai/v1',
  },
  moonshot: {
    apiKey: undefined,
    baseURL: 'https://api.moonshot.cn/v1',
  },
  zhipu: {
    apiKey: undefined,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  baichuan: {
    apiKey: undefined,
    baseURL: 'https://api.baichuan-ai.com/v1',
  },
  minimax: {
    apiKey: undefined,
    baseURL: 'https://api.minimax.chat/v1',
  },
  stepfun: {
    apiKey: undefined,
    baseURL: 'https://api.stepfun.com/v1',
  },
  lingyi: {
    apiKey: undefined,
    baseURL: 'https://api.lingyiwanwu.com/v1',
  },
  qwen: {
    apiKey: undefined,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  doubao: {
    apiKey: undefined,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  hunyuan: {
    apiKey: undefined,
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
  },
}

export const DEFAULT_READ_MODELS: ReadModels = {
  openai: {
    model: 'gpt-4.1-mini',
    isCustomModel: false,
    customModel: '',
  },
  deepseek: {
    model: 'deepseek-chat',
    isCustomModel: false,
    customModel: '',
  },
  gemini: {
    model: 'gemini-2.5-flash',
    isCustomModel: false,
    customModel: '',
  },
  claude: {
    model: 'claude-sonnet-4-5-20250514',
    isCustomModel: false,
    customModel: '',
  },
  groq: {
    model: 'llama-3.3-70b-versatile',
    isCustomModel: false,
    customModel: '',
  },
  mistral: {
    model: 'mistral-small-latest',
    isCustomModel: false,
    customModel: '',
  },
  xai: {
    model: 'grok-3-mini',
    isCustomModel: false,
    customModel: '',
  },
  moonshot: {
    model: 'moonshot-v1-8k',
    isCustomModel: false,
    customModel: '',
  },
  zhipu: {
    model: 'glm-4-flash',
    isCustomModel: false,
    customModel: '',
  },
  baichuan: {
    model: 'Baichuan4-Turbo',
    isCustomModel: false,
    customModel: '',
  },
  minimax: {
    model: 'MiniMax-Text-01',
    isCustomModel: false,
    customModel: '',
  },
  stepfun: {
    model: 'step-1-8k',
    isCustomModel: false,
    customModel: '',
  },
  lingyi: {
    model: 'yi-lightning',
    isCustomModel: false,
    customModel: '',
  },
  qwen: {
    model: 'qwen-turbo',
    isCustomModel: false,
    customModel: '',
  },
  doubao: {
    model: 'doubao-1.5-pro-32k',
    isCustomModel: false,
    customModel: '',
  },
  hunyuan: {
    model: 'hunyuan-turbo',
    isCustomModel: false,
    customModel: '',
  },
}

export const DEFAULT_TRANSLATE_MODELS: TranslateModels = {
  microsoft: null,
  google: null,
  openai: {
    model: 'gpt-4.1-mini',
    isCustomModel: false,
    customModel: '',
  },
  deepseek: {
    model: 'deepseek-chat',
    isCustomModel: false,
    customModel: '',
  },
  openrouter: {
    model: 'meta-llama/llama-4-maverick:free',
    isCustomModel: false,
    customModel: '',
  },
  ollama: {
    model: 'gemma3:1b',
    isCustomModel: false,
    customModel: '',
  },
  gemini: {
    model: 'gemini-2.5-flash',
    isCustomModel: false,
    customModel: '',
  },
  claude: {
    model: 'claude-sonnet-4-5-20250514',
    isCustomModel: false,
    customModel: '',
  },
  groq: {
    model: 'llama-3.3-70b-versatile',
    isCustomModel: false,
    customModel: '',
  },
  mistral: {
    model: 'mistral-small-latest',
    isCustomModel: false,
    customModel: '',
  },
  xai: {
    model: 'grok-3-mini',
    isCustomModel: false,
    customModel: '',
  },
  moonshot: {
    model: 'moonshot-v1-8k',
    isCustomModel: false,
    customModel: '',
  },
  zhipu: {
    model: 'glm-4-flash',
    isCustomModel: false,
    customModel: '',
  },
  baichuan: {
    model: 'Baichuan4-Turbo',
    isCustomModel: false,
    customModel: '',
  },
  minimax: {
    model: 'MiniMax-Text-01',
    isCustomModel: false,
    customModel: '',
  },
  stepfun: {
    model: 'step-1-8k',
    isCustomModel: false,
    customModel: '',
  },
  lingyi: {
    model: 'yi-lightning',
    isCustomModel: false,
    customModel: '',
  },
  qwen: {
    model: 'qwen-turbo',
    isCustomModel: false,
    customModel: '',
  },
  doubao: {
    model: 'doubao-1.5-pro-32k',
    isCustomModel: false,
    customModel: '',
  },
  hunyuan: {
    model: 'hunyuan-turbo',
    isCustomModel: false,
    customModel: '',
  },
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
}

export const PROVIDER_ITEMS: Record<AllProviderNames, { logo: string, name: string }>
  = {
    microsoft: {
      logo: microsoftLogo,
      name: 'Microsoft Translator',
    },
    google: {
      logo: googleLogo,
      name: 'Google Translate',
    },
    openai: {
      logo: openaiLogo,
      name: 'OpenAI',
    },
    deepseek: {
      logo: deepseekLogo,
      name: 'DeepSeek',
    },
    openrouter: {
      logo: openrouterLogo,
      name: 'OpenRouter',
    },
    ollama: {
      logo: ollamaLogo,
      name: 'Ollama',
    },
    gemini: {
      logo: geminiLogo,
      name: 'Google Gemini',
    },
    claude: {
      logo: claudeLogo,
      name: 'Anthropic Claude',
    },
    groq: {
      logo: groqLogo,
      name: 'Groq',
    },
    mistral: {
      logo: mistralLogo,
      name: 'Mistral AI',
    },
    xai: {
      logo: xaiLogo,
      name: 'xAI Grok',
    },
    moonshot: {
      logo: moonshotLogo,
      name: 'Moonshot AI',
    },
    zhipu: {
      logo: zhipuLogo,
      name: 'Zhipu AI',
    },
    baichuan: {
      logo: baichuanLogo,
      name: 'Baichuan',
    },
    minimax: {
      logo: minimaxLogo,
      name: 'MiniMax',
    },
    stepfun: {
      logo: stepfunLogo,
      name: 'StepFun',
    },
    lingyi: {
      logo: lingyiLogo,
      name: 'Yi / Lingyi',
    },
    qwen: {
      logo: qwenLogo,
      name: 'Qwen',
    },
    doubao: {
      logo: doubaoLogo,
      name: 'Doubao',
    },
    hunyuan: {
      logo: hunyuanLogo,
      name: 'Hunyuan',
    },
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

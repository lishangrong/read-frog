export const description = 'Add TTS and subtitle config'

// v010 config: result of migrating v009 config through v009-to-v010 migration
// Adds tts and subtitle configuration sections
export const configExample: any = {
  language: {
    detectedCode: 'eng',
    sourceCode: 'auto',
    targetCode: 'jpn',
    level: 'intermediate',
  },
  providersConfig: {
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
  },
  read: {
    provider: 'openai',
    models: {
      openai: {
        model: 'gpt-4o-mini',
        isCustomModel: true,
        customModel: 'gpt-4.1-nano',
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
    },
  },
  translate: {
    provider: 'microsoft',
    models: {
      microsoft: null,
      google: null,
      openai: {
        model: 'gpt-4o-mini',
        isCustomModel: true,
        customModel: 'gpt-4.1-nano',
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
    },
    node: {
      enabled: true,
      hotkey: 'Control',
    },
    page: {
      range: 'main',
      autoTranslatePatterns: ['news.ycombinator.com'],
      displayMode: 'bilingual',
      contextAware: true,
    },
  },
  floatingButton: {
    enabled: true,
    position: 0.66,
  },
  sideContent: {
    width: 400,
  },
  tts: {
    enabled: false,
    provider: 'webSpeech',
    voice: 'alloy',
    speed: 1,
    autoPlay: false,
  },
  subtitle: {
    enabled: false,
    displayMode: 'bilingual',
    position: 'below',
    fontSize: 16,
    opacity: 0.85,
    autoDetect: true,
  },
}

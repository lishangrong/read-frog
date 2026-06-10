import type { APIProviderNames, AllProviderNames, ProvidersConfig } from '@/types/config/provider'
import type { ServiceType } from '@/types/config/service'
import type { IProviderContract } from '@/types/provider-contract'
import { apiProviderNames, isPureTranslateProvider } from '@/types/config/provider'
import { PROVIDER_SERVICE_MAP } from '@/types/config/service'

/* ──────────────────────────────
  LLM Provider Contract
  Wraps Vercel AI SDK for LLM-based
  translation via generateText
  ────────────────────────────── */

export class LLMProviderContract implements IProviderContract {
  readonly supportedServices: readonly ServiceType[]
  readonly requiresAPIKey: boolean

  constructor(
    readonly name: AllProviderNames,
    private readonly getModel: (provider: APIProviderNames, model: string) => Promise<any>,
    private readonly generateTextFn: (params: { model: any, prompt: string }) => Promise<{ text: string }>,
  ) {
    this.supportedServices = PROVIDER_SERVICE_MAP[name]
    this.requiresAPIKey = apiProviderNames.includes(name as APIProviderNames)
  }

  async translate(text: string, _fromLang: string, toLang: string): Promise<string> {
    const prompt = `Treat input as plain text input and translate it into ${toLang}, output translation ONLY. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes.\nInput:\n${text}`
    const model = await this.getModel(this.name as APIProviderNames, '')
    const result = await this.generateTextFn({ model, prompt })
    return result.text
  }

  isConfigured(providersConfig: ProvidersConfig): boolean {
    if (!this.requiresAPIKey) return true
    const key = providersConfig[this.name as APIProviderNames]?.apiKey
    return typeof key === 'string' && key.trim().length > 0
  }
}

/* ──────────────────────────────
  Pure Translate Provider Contract
  Wraps Google/Microsoft free APIs
  ────────────────────────────── */

export class PureTranslateProviderContract implements IProviderContract {
  readonly supportedServices: readonly ServiceType[] = ['translate']
  readonly requiresAPIKey = false

  constructor(
    readonly name: AllProviderNames,
    private readonly translateFn: (text: string, fromLang: string, toLang: string) => Promise<string>,
  ) {}

  async translate(text: string, fromLang: string, toLang: string): Promise<string> {
    return this.translateFn(text, fromLang, toLang)
  }

  isConfigured(_providersConfig: ProvidersConfig): boolean {
    return true
  }
}

/* ──────────────────────────────
  Contract factory
  ────────────────────────────── */

let contractCache: Map<AllProviderNames, IProviderContract> | null = null

export function getProviderContract(
  provider: AllProviderNames,
  deps?: {
    getModel?: (provider: APIProviderNames, model: string) => Promise<any>
    generateTextFn?: (params: { model: any, prompt: string }) => Promise<{ text: string }>
    googleTranslateFn?: (text: string, fromLang: string, toLang: string) => Promise<string>
    microsoftTranslateFn?: (text: string, fromLang: string, toLang: string) => Promise<string>
  },
): IProviderContract {
  if (!contractCache) {
    contractCache = new Map()
  }

  const cached = contractCache.get(provider)
  if (cached) return cached

  let contract: IProviderContract

  if (isPureTranslateProvider(provider as any)) {
    const translateFn = provider === 'google'
      ? (deps?.googleTranslateFn ?? (async () => { throw new Error('Google translate function not provided') }))
      : (deps?.microsoftTranslateFn ?? (async () => { throw new Error('Microsoft translate function not provided') }))
    contract = new PureTranslateProviderContract(provider, translateFn)
  }
  else {
    const getModel = deps?.getModel ?? (async () => { throw new Error('getModel function not provided') })
    const generateTextFn = deps?.generateTextFn ?? (async () => { throw new Error('generateText function not provided') })
    contract = new LLMProviderContract(provider, getModel, generateTextFn)
  }

  contractCache.set(provider, contract)
  return contract
}

export function clearContractCache(): void {
  contractCache = null
}

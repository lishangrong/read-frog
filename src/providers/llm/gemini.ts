import type { LanguageModel } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class GeminiProvider extends BaseLLMProvider {
  readonly id = 'gemini'
  readonly capabilities = PROVIDER_CAPABILITIES.gemini

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const google = createGoogleGenerativeAI({
      baseURL: ctx.baseURL ?? 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: ctx.apiKey ?? '',
    })
    return google(this.resolveModel(ctx))
  }
}

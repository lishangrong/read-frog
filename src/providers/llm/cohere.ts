import type { LanguageModel } from 'ai'
import { createCohere } from '@ai-sdk/cohere'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class CohereProvider extends BaseLLMProvider {
  readonly id = 'cohere'
  readonly capabilities = PROVIDER_CAPABILITIES.cohere

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const cohere = createCohere({
      baseURL: ctx.baseURL ?? 'https://api.cohere.ai/v2',
      apiKey: ctx.apiKey ?? '',
    })
    return cohere(this.resolveModel(ctx))
  }
}

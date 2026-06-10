import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class PerplexityProvider extends BaseLLMProvider {
  readonly id = 'perplexity'
  readonly capabilities = PROVIDER_CAPABILITIES.perplexity

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const perplexity = createOpenAI({
      name: 'perplexity',
      baseURL: ctx.baseURL ?? 'https://api.perplexity.ai',
      apiKey: ctx.apiKey ?? '',
    })
    return perplexity(this.resolveModel(ctx))
  }
}

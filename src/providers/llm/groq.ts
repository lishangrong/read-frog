import type { LanguageModel } from 'ai'
import { createGroq } from '@ai-sdk/groq'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class GroqProvider extends BaseLLMProvider {
  readonly id = 'groq'
  readonly capabilities = PROVIDER_CAPABILITIES.groq

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const groq = createGroq({
      baseURL: ctx.baseURL ?? 'https://api.groq.com/openai/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return groq(this.resolveModel(ctx))
  }
}

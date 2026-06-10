import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class TogetherProvider extends BaseLLMProvider {
  readonly id = 'together'
  readonly capabilities = PROVIDER_CAPABILITIES.together

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const together = createOpenAI({
      name: 'together',
      baseURL: ctx.baseURL ?? 'https://api.together.xyz/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return together(this.resolveModel(ctx))
  }
}

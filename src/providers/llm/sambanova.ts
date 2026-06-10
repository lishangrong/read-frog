import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class SambaNovaProvider extends BaseLLMProvider {
  readonly id = 'sambanova'
  readonly capabilities = PROVIDER_CAPABILITIES.sambanova

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const sambanova = createOpenAI({
      name: 'sambanova',
      baseURL: ctx.baseURL ?? 'https://api.sambanova.ai/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return sambanova(this.resolveModel(ctx))
  }
}

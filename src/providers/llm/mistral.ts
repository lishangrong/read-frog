import type { LanguageModel } from 'ai'
import { createMistral } from '@ai-sdk/mistral'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class MistralProvider extends BaseLLMProvider {
  readonly id = 'mistral'
  readonly capabilities = PROVIDER_CAPABILITIES.mistral

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const mistral = createMistral({
      baseURL: ctx.baseURL ?? 'https://api.mistral.ai/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return mistral(this.resolveModel(ctx))
  }
}

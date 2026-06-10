import type { LanguageModel } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class OpenRouterProvider extends BaseLLMProvider {
  readonly id = 'openrouter'
  readonly capabilities = PROVIDER_CAPABILITIES.openrouter

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const openrouter = createOpenRouter({
      apiKey: ctx.apiKey ?? '',
      baseURL: ctx.baseURL ?? 'https://openrouter.ai/api/v1',
    })
    return openrouter(this.resolveModel(ctx))
  }
}

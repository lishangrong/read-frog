import type { LanguageModel } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class AnthropicProvider extends BaseLLMProvider {
  readonly id = 'anthropic'
  readonly capabilities = PROVIDER_CAPABILITIES.anthropic

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const anthropic = createAnthropic({
      baseURL: ctx.baseURL ?? 'https://api.anthropic.com/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return anthropic(this.resolveModel(ctx))
  }
}

import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class CerebrasProvider extends BaseLLMProvider {
  readonly id = 'cerebras'
  readonly capabilities = PROVIDER_CAPABILITIES.cerebras

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const cerebras = createOpenAI({
      name: 'cerebras',
      baseURL: ctx.baseURL ?? 'https://api.cerebras.ai/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return cerebras(this.resolveModel(ctx))
  }
}

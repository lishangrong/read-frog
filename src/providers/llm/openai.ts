import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class OpenAIProvider extends BaseLLMProvider {
  readonly id = 'openai'
  readonly capabilities = PROVIDER_CAPABILITIES.openai

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const openai = createOpenAI({
      baseURL: ctx.baseURL ?? 'https://api.openai.com/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return openai(this.resolveModel(ctx))
  }
}

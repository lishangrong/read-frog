import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class XAIProvider extends BaseLLMProvider {
  readonly id = 'xai'
  readonly capabilities = PROVIDER_CAPABILITIES.xai

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const xai = createOpenAI({
      name: 'xai',
      baseURL: ctx.baseURL ?? 'https://api.x.ai/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return xai(this.resolveModel(ctx))
  }
}

import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class MoonshotProvider extends BaseLLMProvider {
  readonly id = 'moonshot'
  readonly capabilities = PROVIDER_CAPABILITIES.moonshot

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const moonshot = createOpenAI({
      name: 'moonshot',
      baseURL: ctx.baseURL ?? 'https://api.moonshot.cn/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return moonshot(this.resolveModel(ctx))
  }
}

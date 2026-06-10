import type { LanguageModel } from 'ai'
import { createDeepSeek } from '@ai-sdk/deepseek'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class DeepSeekProvider extends BaseLLMProvider {
  readonly id = 'deepseek'
  readonly capabilities = PROVIDER_CAPABILITIES.deepseek

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const deepseek = createDeepSeek({
      baseURL: ctx.baseURL ?? 'https://api.deepseek.com/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return deepseek(this.resolveModel(ctx))
  }
}

import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class FireworksProvider extends BaseLLMProvider {
  readonly id = 'fireworks'
  readonly capabilities = PROVIDER_CAPABILITIES.fireworks

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const fireworks = createOpenAI({
      name: 'fireworks',
      baseURL: ctx.baseURL ?? 'https://api.fireworks.ai/inference/v1',
      apiKey: ctx.apiKey ?? '',
    })
    return fireworks(this.resolveModel(ctx))
  }
}

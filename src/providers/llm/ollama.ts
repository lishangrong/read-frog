import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class OllamaProvider extends BaseLLMProvider {
  readonly id = 'ollama'
  readonly capabilities = PROVIDER_CAPABILITIES.ollama

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const ollama = createOpenAI({
      baseURL: ctx.baseURL ?? 'http://localhost:11434/v1',
      apiKey: ctx.apiKey ?? 'ollama',
    })
    return ollama(this.resolveModel(ctx))
  }
}

import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseLLMProvider } from '../base-llm-provider'

export class ZhipuProvider extends BaseLLMProvider {
  readonly id = 'zhipu'
  readonly capabilities = PROVIDER_CAPABILITIES.zhipu

  protected createLanguageModel(ctx: ProviderContext): LanguageModel {
    const zhipu = createOpenAI({
      name: 'zhipu',
      baseURL: ctx.baseURL ?? 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: ctx.apiKey ?? '',
    })
    return zhipu(this.resolveModel(ctx))
  }
}

import type { LanguageModel } from 'ai'
import { generateText } from 'ai'

import type { ModelCapabilities } from '@/types/provider/capabilities'
import type { IProviderContract, ProviderContext, TranslateRequest, TranslateResult } from '@/types/provider/contract'
import { LANG_CODE_TO_EN_NAME } from '@/types/config/languages'
import { getTranslateLinePrompt } from '@/utils/prompts/translate-line'

/**
 * Abstract base for all Vercel AI SDK-backed LLM providers.
 * Subclasses only need to implement createLanguageModel().
 *
 * translate() is implemented here:
 * 1. Creates a LanguageModel via createLanguageModel()
 * 2. Builds a translation prompt
 * 3. Calls generateText()
 * 4. Strips <think> tags (for deep-thinking models like DeepSeek)
 */
export abstract class BaseLLMProvider implements IProviderContract {
  abstract readonly id: string
  abstract readonly capabilities: ModelCapabilities

  /**
   * Subclass MUST implement this to create the Vercel AI SDK LanguageModel.
   */
  protected abstract createLanguageModel(ctx: ProviderContext): LanguageModel

  /** Public accessor for read operations (analyze/explain hooks) */
  getLanguageModel(ctx: ProviderContext): LanguageModel {
    return this.createLanguageModel(ctx)
  }

  /** Resolve the effective model string (handles custom models) */
  protected resolveModel(ctx: ProviderContext): string {
    return ctx.isCustomModel && ctx.customModel ? ctx.customModel : ctx.model
  }

  /** Translate using the LLM via generateText */
  async translate(ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult> {
    const model = this.createLanguageModel(ctx)
    const targetLangName = LANG_CODE_TO_EN_NAME[req.targetLang as keyof typeof LANG_CODE_TO_EN_NAME] ?? req.targetLang
    const prompt = getTranslateLinePrompt(targetLangName, req.text)

    const { text } = await generateText({ model, prompt })

    // Strip <think> tags (for DeepSeek-style deep thinking models)
    const [, extracted = text] = text.match(/<\/think>([\s\S]*)/) || []
    const translatedText = extracted.trim()

    return {
      translatedText,
      detectedSourceLang: req.sourceLang,
    }
  }
}

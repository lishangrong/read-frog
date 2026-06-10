import type { LangLevel } from '@/types/config/languages'
import { ISO6393_TO_6391, LANG_CODE_TO_EN_NAME } from '@/types/config/languages'
import { isPureTranslateProvider } from '@/types/config/provider'
import { globalConfig } from '@/utils/config/config'
import { Sha256Hex } from '@/utils/hash'
import { sendMessage } from '@/utils/message'
import { buildContextAwarePrompt } from './level-adaptation'
import type { TranslationContext } from './context-extractor'

/**
 * Result of a selection translation, including context-aware explanation.
 */
export interface SelectionTranslationResult {
  originalText: string
  translatedText: string
  explanation?: string
  level: LangLevel
}

/**
 * Pipeline for translating selected text with context awareness.
 *
 * For pure translate providers (Google, Microsoft, DeepL, etc.),
 * context is not used — only the selected text is translated.
 *
 * For LLM providers, the full article context is injected into the prompt
 * for domain-aware translation and level-appropriate explanations.
 */
export class SelectionTranslationPipeline {
  /**
   * Translate selected text with context awareness.
   *
   * @param context - Translation context including selected text and article info
   * @param signal - AbortSignal for cancellation
   * @returns Translation result with optional explanation
   */
  async translate(
    context: TranslationContext,
    signal?: AbortSignal,
  ): Promise<SelectionTranslationResult> {
    if (!globalConfig) {
      throw new Error('No global config for selection translation')
    }

    const provider = globalConfig.translate.provider
    const level = context.langLevel
    const cleanText = context.selectedText.replace(/\u200B/g, '').trim()

    if (signal?.aborted) {
      throw new Error('Translation cancelled')
    }

    let translatedText: string
    let explanation: string | undefined

    if (isPureTranslateProvider(provider)) {
      // Pure translate providers don't support context or explanations
      translatedText = await this.translateWithPureProvider(cleanText)
    }
    else {
      // LLM providers: use context-aware prompt
      const result = await this.translateWithLLM(cleanText, context, signal)
      translatedText = result.translatedText
      explanation = result.explanation
    }

    return {
      originalText: cleanText,
      translatedText,
      explanation,
      level,
    }
  }

  /**
   * Translate using a pure translation provider (Google, Microsoft, DeepL, etc.).
   */
  private async translateWithPureProvider(text: string): Promise<string> {
    if (!globalConfig) {
      throw new Error('No global config')
    }

    const provider = globalConfig.translate.provider
    const sourceLang = globalConfig.language.sourceCode === 'auto'
      ? 'auto'
      : (ISO6393_TO_6391[globalConfig.language.sourceCode] ?? 'auto')
    const targetLang = ISO6393_TO_6391[globalConfig.language.targetCode]

    if (!targetLang) {
      throw new Error('Invalid target language')
    }

    const translatedText = await sendMessage('translateRequest', {
      providerId: provider,
      text,
      sourceLang,
      targetLang,
      scheduleAt: Date.now(),
      hash: Sha256Hex(text, provider, sourceLang, targetLang),
    })

    const [, extracted = translatedText] = translatedText.match(/<\/think>([\s\S]*)/) || []
    return extracted.trim()
  }

  /**
   * Translate using an LLM provider with context-aware prompt.
   */
  private async translateWithLLM(
    text: string,
    context: TranslationContext,
    signal?: AbortSignal,
  ): Promise<{ translatedText: string, explanation?: string }> {
    if (!globalConfig) {
      throw new Error('No global config')
    }

    const provider = globalConfig.translate.provider
    const targetLangName = LANG_CODE_TO_EN_NAME[globalConfig.language.targetCode]
    if (!targetLangName) {
      throw new Error('Invalid target language')
    }

    const prompt = buildContextAwarePrompt(
      targetLangName,
      text,
      {
        articleTitle: context.articleTitle,
        sectionHeading: context.sectionHeading,
        surroundingParagraph: context.surroundingParagraph,
      },
      context.langLevel,
    )

    const modelString = globalConfig.translate.models[provider]?.model

    if (signal?.aborted) {
      throw new Error('Translation cancelled')
    }

    // Use the unified translateRequest for LLM providers
    // which sends the full context-aware prompt
    const result = await sendMessage('translateRequest', {
      providerId: provider,
      text: prompt,
      sourceLang: globalConfig.language.sourceCode === 'auto'
        ? 'auto'
        : (ISO6393_TO_6391[globalConfig.language.sourceCode] ?? 'auto'),
      targetLang: ISO6393_TO_6391[globalConfig.language.targetCode] ?? 'en',
      scheduleAt: Date.now(),
      hash: Sha256Hex(text, provider, 'selection', context.langLevel),
    })

    // Parse the LLM response — it may contain both translation and explanation
    return this.parseLLMResponse(result, context.langLevel)
  }

  /**
   * Parse LLM response to separate translation from explanation.
   * For beginner/intermediate levels, the response may contain additional
   * explanation after the translation.
   */
  private parseLLMResponse(
    response: string,
    level: LangLevel,
  ): { translatedText: string, explanation?: string } {
    // Strip thinking tags
    const [, extracted = response] = response.match(/<\/think>([\s\S]*)/) || []
    const cleanResponse = extracted.trim()

    if (level === 'advanced') {
      // Advanced users just get the translation
      return { translatedText: cleanResponse }
    }

    // For beginner/intermediate, try to separate translation from explanation
    // Look for common separators: "---", "Explanation:", "Notes:", etc.
    const separatorPatterns = [
      /---+\s*\n/,
      /\n\n\*?\*?(?:Explanation|Notes|Grammar|Breakdown|Analysis|Note)[:：]\*?\*?\s*\n/i,
      /\n\n(?:📝|📖|🔍|💡)\s*/i,
    ]

    for (const pattern of separatorPatterns) {
      const match = cleanResponse.match(pattern)
      if (match && match.index !== undefined) {
        return {
          translatedText: cleanResponse.slice(0, match.index).trim(),
          explanation: cleanResponse.slice(match.index + match[0].length).trim(),
        }
      }
    }

    // If no separator found, treat the whole response as translation
    return { translatedText: cleanResponse }
  }
}

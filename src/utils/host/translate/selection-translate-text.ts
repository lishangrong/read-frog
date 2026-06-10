import type { SelectionTranslation } from '@/types/selection-translation'
import { LANG_CODE_TO_EN_NAME } from '@/types/config/languages'
import { selectionTranslationSchema } from '@/types/selection-translation'
import { globalConfig } from '../../config/config'
import { Sha256Hex } from '../../hash'
import { sendMessage } from '../../message'
import { getSelectionTranslatePrompt } from '../../prompts/selection-translate'
import { TranslationPriority } from '../../request/translation-priority'

export async function selectionTranslateText(
  selectedText: string,
  context: string,
): Promise<SelectionTranslation> {
  if (!globalConfig) {
    throw new Error('No global config when selection translate')
  }

  const provider = globalConfig.translate.provider
  const modelConfig = globalConfig.translate.models[provider]
  const modelString = modelConfig?.model
  const langLevel = globalConfig.language.level
  const sourceLang = LANG_CODE_TO_EN_NAME[globalConfig.language.sourceCode] || 'auto'
  const targetLang = LANG_CODE_TO_EN_NAME[globalConfig.language.targetCode]

  if (!targetLang) {
    throw new Error('Invalid target language code')
  }

  if (!modelString) {
    // Fallback for pure translate providers: return simple translation
    const { translateText } = await import('./translate-text')
    const translation = await translateText(selectedText, { context, priority: TranslationPriority.USER_TRIGGERED })
    return { translation: translation || selectedText }
  }

  const prompt = getSelectionTranslatePrompt(
    selectedText,
    context,
    sourceLang,
    targetLang,
    langLevel,
  )

  const text = await sendMessage('enqueueRequest', {
    type: 'selectionTranslate',
    params: {
      provider,
      modelString,
      prompt,
    },
    scheduleAt: Date.now(),
    hash: Sha256Hex(selectedText, 'selection', provider, modelString, targetLang, langLevel),
    priority: TranslationPriority.USER_TRIGGERED,
  })

  // Filter out think tags from deep thinking models
  const [, extracted = text] = text.match(/<\/think>([\s\S]*)/) || []
  const cleanText = extracted.trim()

  // Try to parse as JSON
  try {
    // Extract JSON from response (may have surrounding text)
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const result = selectionTranslationSchema.safeParse(parsed)
      if (result.success) {
        return result.data
      }
    }
  }
  catch {
    // JSON parse failed, fall through to simple translation
  }

  // Fallback: treat entire response as plain translation
  return { translation: cleanText || selectedText }
}

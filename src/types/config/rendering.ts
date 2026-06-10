import { z } from 'zod'

/**
 * Rendering mode for translated content display.
 * - bilingual: Show original text and translation side by side
 * - translationOnly: Show only the translated text
 * - originalHidden: Hide original text, show only translation
 */
export const renderingModeSchema = z.enum([
  'bilingual',
  'translationOnly',
  'originalHidden',
])
export type RenderingMode = z.infer<typeof renderingModeSchema>

/**
 * Layout option for bilingual mode.
 * - inline: Original and translation on the same line (原文 翻译)
 * - blockBelow: Translation displayed below the original as a block
 */
export const bilingualLayoutSchema = z.enum(['inline', 'blockBelow'])
export type BilingualLayout = z.infer<typeof bilingualLayoutSchema>

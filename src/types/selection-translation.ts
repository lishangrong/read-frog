import { z } from 'zod'
import { syntacticCategoryAbbr } from './content'

export const wordBreakdownSchema = z.object({
  word: z.string(),
  syntacticCategory: syntacticCategoryAbbr,
  meaning: z.string(),
})

export const keyVocabularySchema = z.object({
  term: z.string(),
  explanation: z.string(),
})

export const selectionTranslationSchema = z.object({
  translation: z.string(),
  // Beginner fields
  wordBreakdown: z.array(wordBreakdownSchema).optional(),
  grammarNotes: z.string().optional(),
  // Intermediate fields
  keyVocabulary: z.array(keyVocabularySchema).optional(),
  contextNote: z.string().optional(),
  // Advanced fields
  idiomaticAlternatives: z.array(z.string()).optional(),
  registerNote: z.string().optional(),
})

export type SelectionTranslation = z.infer<typeof selectionTranslationSchema>
export type WordBreakdown = z.infer<typeof wordBreakdownSchema>
export type KeyVocabulary = z.infer<typeof keyVocabularySchema>

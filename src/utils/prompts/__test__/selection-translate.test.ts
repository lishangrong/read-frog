import { describe, expect, it } from 'vitest'
import { getSelectionTranslatePrompt } from '../selection-translate'

describe('getSelectionTranslatePrompt', () => {
  const selectedText = 'Bonjour le monde'
  const context = 'A greeting on a website'
  const sourceLang = 'French'
  const targetLang = 'English'

  describe('beginner level', () => {
    it('includes word breakdown instructions', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'beginner')
      expect(prompt).toContain('wordBreakdown')
      expect(prompt).toContain('syntacticCategory')
      expect(prompt).toContain('grammarNotes')
      expect(prompt).toContain('beginner')
    })

    it('includes the selected text', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'beginner')
      expect(prompt).toContain(selectedText)
    })

    it('includes context when provided', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'beginner')
      expect(prompt).toContain(context)
    })

    it('omits context when empty', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, '', sourceLang, targetLang, 'beginner')
      expect(prompt).not.toContain('Context:')
    })

    it('includes part-of-speech abbreviations', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'beginner')
      expect(prompt).toContain('n.')
      expect(prompt).toContain('v.')
      expect(prompt).toContain('adj.')
    })
  })

  describe('intermediate level', () => {
    it('includes key vocabulary instructions', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'intermediate')
      expect(prompt).toContain('keyVocabulary')
      expect(prompt).toContain('contextNote')
      expect(prompt).toContain('intermediate')
    })

    it('does not include beginner-specific fields', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'intermediate')
      expect(prompt).not.toContain('wordBreakdown')
      expect(prompt).not.toContain('grammarNotes')
    })
  })

  describe('advanced level', () => {
    it('includes idiomatic alternatives instructions', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'advanced')
      expect(prompt).toContain('idiomaticAlternatives')
      expect(prompt).toContain('registerNote')
      expect(prompt).toContain('advanced')
    })

    it('does not include beginner or intermediate fields', () => {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, 'advanced')
      expect(prompt).not.toContain('wordBreakdown')
      expect(prompt).not.toContain('keyVocabulary')
    })
  })

  it('includes source and target language in all levels', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, level)
      expect(prompt).toContain(sourceLang)
      expect(prompt).toContain(targetLang)
    }
  })

  it('requests JSON output in all levels', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      const prompt = getSelectionTranslatePrompt(selectedText, context, sourceLang, targetLang, level)
      expect(prompt).toContain('JSON')
    }
  })
})

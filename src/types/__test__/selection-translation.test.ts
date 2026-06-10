import { describe, expect, it } from 'vitest'
import { selectionTranslationSchema } from '../selection-translation'

describe('selectionTranslationSchema', () => {
  it('validates a minimal translation (translation only)', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Hello',
    })
    expect(result.success).toBe(true)
  })

  it('validates a beginner response with word breakdown', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Hello world',
      wordBreakdown: [
        { word: 'Hello', syntacticCategory: 'interj.', meaning: 'greeting' },
        { word: 'world', syntacticCategory: 'n.', meaning: 'the earth' },
      ],
      grammarNotes: 'Simple greeting followed by a noun',
    })
    expect(result.success).toBe(true)
  })

  it('validates an intermediate response with key vocabulary', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Translated text',
      keyVocabulary: [
        { term: 'word', explanation: 'meaning of the word' },
      ],
      contextNote: 'Formal register',
    })
    expect(result.success).toBe(true)
  })

  it('validates an advanced response with idiomatic alternatives', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Main translation',
      idiomaticAlternatives: ['alt 1', 'alt 2'],
      registerNote: 'Colloquial usage',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing translation field', () => {
    const result = selectionTranslationSchema.safeParse({
      wordBreakdown: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid wordBreakdown structure', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Hello',
      wordBreakdown: [
        { word: 'Hello' }, // missing syntacticCategory and meaning
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid syntacticCategory abbreviation', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Hello',
      wordBreakdown: [
        { word: 'Hello', syntacticCategory: 'invalid', meaning: 'greeting' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid syntacticCategory abbreviations', () => {
    const validCategories = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'det.', 'interj.', 'ph.']
    for (const cat of validCategories) {
      const result = selectionTranslationSchema.safeParse({
        translation: 'test',
        wordBreakdown: [
          { word: 'test', syntacticCategory: cat, meaning: 'test' },
        ],
      })
      expect(result.success).toBe(true)
    }
  })

  it('validates a full response with all fields', () => {
    const result = selectionTranslationSchema.safeParse({
      translation: 'Full translation',
      wordBreakdown: [{ word: 'a', syntacticCategory: 'det.', meaning: 'one' }],
      grammarNotes: 'Note',
      keyVocabulary: [{ term: 'term', explanation: 'explanation' }],
      contextNote: 'Context',
      idiomaticAlternatives: ['alt'],
      registerNote: 'Register',
    })
    expect(result.success).toBe(true)
  })
})

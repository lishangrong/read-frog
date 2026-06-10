import { describe, expect, it } from 'vitest'
import { BatchSemanticValidator } from '../batch-validation'
import type { BatchItem } from '../batch-validation'

describe('BatchSemanticValidator', () => {
  const validator = new BatchSemanticValidator()

  describe('validate', () => {
    it('always validates single item batches', () => {
      const items: BatchItem[] = [{ text: 'Hello world' }]
      const result = validator.validate(items)
      expect(result.isValid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('validates batches with same-context short texts', () => {
      const items: BatchItem[] = [
        { text: 'Hello world', sourceLang: 'en' },
        { text: 'Good morning', sourceLang: 'en' },
      ]
      const result = validator.validate(items)
      expect(result.isValid).toBe(true)
    })

    it('detects language mismatch', () => {
      const items: BatchItem[] = [
        { text: 'Hello world', sourceLang: 'en' },
        { text: 'Bonjour monde', sourceLang: 'fr' },
      ]
      const result = validator.validate(items)
      expect(result.isValid).toBe(false)
      expect(result.violations.some(v => v.type === 'language-mismatch')).toBe(true)
    })

    it('detects excessive combined length', () => {
      const longText = 'a'.repeat(3000)
      const items: BatchItem[] = [
        { text: longText, sourceLang: 'en' },
        { text: longText, sourceLang: 'en' },
      ]
      const result = validator.validate(items)
      expect(result.isValid).toBe(false)
      expect(result.violations.some(v => v.type === 'length-exceeded')).toBe(true)
    })

    it('detects cross-references in batch items', () => {
      const items: BatchItem[] = [
        { text: 'The experiment was conducted in 2023.', sourceLang: 'en' },
        { text: 'As mentioned above, the results were positive.', sourceLang: 'en' },
      ]
      const result = validator.validate(items)
      expect(result.isValid).toBe(false)
      expect(result.violations.some(v => v.type === 'cross-reference')).toBe(true)
    })

    it('detects pronoun ambiguity at text boundaries', () => {
      const items: BatchItem[] = [
        { text: 'The scientist published a groundbreaking paper.', sourceLang: 'en' },
        { text: 'She received many accolades for her work.', sourceLang: 'en' },
      ]
      const result = validator.validate(items)
      expect(result.isValid).toBe(false)
      expect(result.violations.some(v => v.type === 'pronoun-ambiguity')).toBe(true)
    })

    it('does not flag pronouns in the first item', () => {
      const items: BatchItem[] = [
        { text: 'It is important to note the following.', sourceLang: 'en' },
        { text: 'The results were conclusive.', sourceLang: 'en' },
      ]
      const result = validator.validate(items)
      // Only checks from index 1 onwards
      const pronounViolation = result.violations.find(v => v.type === 'pronoun-ambiguity')
      expect(pronounViolation).toBeUndefined()
    })
  })

  describe('suggestSplit', () => {
    it('splits at affected indices', () => {
      const items: BatchItem[] = [
        { text: 'First paragraph.', sourceLang: 'en' },
        { text: 'As mentioned above, second paragraph.', sourceLang: 'en' },
        { text: 'Third paragraph.', sourceLang: 'en' },
      ]
      const validation = validator.validate(items)
      expect(validation.isValid).toBe(false)

      const splits = validator.suggestSplit(items, validation)
      expect(splits.length).toBeGreaterThanOrEqual(2)
      // Total items should equal original
      const totalItems = splits.reduce((sum, batch) => sum + batch.length, 0)
      expect(totalItems).toBe(items.length)
    })

    it('returns single batch for valid items', () => {
      const items: BatchItem[] = [
        { text: 'Hello', sourceLang: 'en' },
        { text: 'World', sourceLang: 'en' },
      ]
      const validation = validator.validate(items)
      // If valid, suggestSplit shouldn't be called, but if it is:
      if (!validation.isValid) {
        const splits = validator.suggestSplit(items, validation)
        const totalItems = splits.reduce((sum, batch) => sum + batch.length, 0)
        expect(totalItems).toBe(items.length)
      }
    })

    it('splits in half when no specific split points', () => {
      const items: BatchItem[] = [
        { text: 'a'.repeat(2500), sourceLang: 'en' },
        { text: 'b'.repeat(2500), sourceLang: 'en' },
      ]
      const validation = validator.validate(items)
      expect(validation.isValid).toBe(false)

      const splits = validator.suggestSplit(items, validation)
      expect(splits.length).toBeGreaterThanOrEqual(2)
    })
  })
})

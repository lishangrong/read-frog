import { describe, expect, it } from 'vitest'
import { canBatchTogether, splitIntoBatches } from '../batch-validator'

describe('canBatchTogether', () => {
  it('returns true for a single text', () => {
    expect(canBatchTogether(['Hello'])).toBe(true)
  })

  it('returns true for empty array', () => {
    expect(canBatchTogether([])).toBe(true)
  })

  it('returns true for same-script texts', () => {
    expect(canBatchTogether(['Hello world', 'Good morning'])).toBe(true)
  })

  it('returns true for CJK texts', () => {
    expect(canBatchTogether(['你好世界', '早上好'])).toBe(true)
  })

  it('returns false for mixed scripts', () => {
    expect(canBatchTogether(['你好世界', 'Привет мир'])).toBe(false)
  })

  it('returns false when total chars exceed limit', () => {
    const longText = 'a'.repeat(3000)
    expect(canBatchTogether([longText, longText])).toBe(false)
  })

  it('returns true for texts within char limit', () => {
    const text = 'Hello world'
    expect(canBatchTogether([text, text, text])).toBe(true)
  })
})

describe('splitIntoBatches', () => {
  it('returns empty array for empty input', () => {
    expect(splitIntoBatches([], 10)).toEqual([])
  })

  it('groups all texts into one batch when within limits', () => {
    const texts = ['Hello', 'World', 'Test']
    const batches = splitIntoBatches(texts, 10)
    expect(batches).toHaveLength(1)
    expect(batches[0]).toEqual(texts)
  })

  it('splits by max batch size', () => {
    const texts = ['a', 'b', 'c', 'd', 'e']
    const batches = splitIntoBatches(texts, 2)
    expect(batches.length).toBeGreaterThanOrEqual(2)
    // Total texts across all batches should equal input
    const totalTexts = batches.reduce((sum, b) => sum + b.length, 0)
    expect(totalTexts).toBe(5)
  })

  it('groups by script family', () => {
    const texts = ['Hello world', '你好世界', 'Good morning', '早上好']
    const batches = splitIntoBatches(texts, 10)
    // Should create at least 2 batches: Latin and CJK
    expect(batches.length).toBeGreaterThanOrEqual(2)
    // Each batch should be homogeneous
    for (const batch of batches) {
      expect(canBatchTogether(batch)).toBe(true)
    }
  })

  it('respects character limit per batch', () => {
    const texts = Array.from({ length: 5 }, () => 'a'.repeat(1500))
    const batches = splitIntoBatches(texts, 10)
    // Each batch should stay under char limit
    expect(batches.length).toBeGreaterThan(1)
  })

  it('handles single text', () => {
    const batches = splitIntoBatches(['Hello'], 10)
    expect(batches).toEqual([['Hello']])
  })
})

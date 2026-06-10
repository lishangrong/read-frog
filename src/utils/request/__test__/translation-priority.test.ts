// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { TranslationPriority, computePriority } from '../translation-priority'

describe('TranslationPriority', () => {
  it('has correct priority ordering (lower = higher priority)', () => {
    expect(TranslationPriority.USER_TRIGGERED).toBeLessThan(TranslationPriority.VISIBLE_AUTO)
    expect(TranslationPriority.VISIBLE_AUTO).toBeLessThan(TranslationPriority.PRELOAD_AUTO)
    expect(TranslationPriority.PRELOAD_AUTO).toBeLessThan(TranslationPriority.BACKGROUND_AUTO)
  })

  it('has specific numeric values', () => {
    expect(TranslationPriority.USER_TRIGGERED).toBe(0)
    expect(TranslationPriority.VISIBLE_AUTO).toBe(1)
    expect(TranslationPriority.PRELOAD_AUTO).toBe(2)
    expect(TranslationPriority.BACKGROUND_AUTO).toBe(3)
  })
})

describe('computePriority', () => {
  it('returns USER_TRIGGERED for user source', () => {
    expect(computePriority('user')).toBe(TranslationPriority.USER_TRIGGERED)
  })

  it('returns USER_TRIGGERED for user source even with element', () => {
    const el = document.createElement('div')
    expect(computePriority('user', el)).toBe(TranslationPriority.USER_TRIGGERED)
  })

  it('returns VISIBLE_AUTO for page source without element', () => {
    expect(computePriority('page')).toBe(TranslationPriority.VISIBLE_AUTO)
  })

  it('returns VISIBLE_AUTO for element in viewport', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 100, bottom: 200, left: 0, right: 100 }),
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    expect(computePriority('page', el)).toBe(TranslationPriority.VISIBLE_AUTO)
  })

  it('returns BACKGROUND_AUTO for element fully off-screen below', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 1000, bottom: 1100, left: 0, right: 100 }),
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    expect(computePriority('page', el)).toBe(TranslationPriority.BACKGROUND_AUTO)
  })

  it('returns BACKGROUND_AUTO for element fully off-screen above', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: -200, bottom: -100, left: 0, right: 100 }),
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    expect(computePriority('page', el)).toBe(TranslationPriority.BACKGROUND_AUTO)
  })
})

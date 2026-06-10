// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { extractTextWithPlaceholders, hasPlaceholders, reinsertPlaceholders } from '../html-preservation'

describe('extractTextWithPlaceholders', () => {
  it('extracts text from plain text nodes without placeholders', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello world'
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('Hello world')
    expect(result.placeholders.size).toBe(0)
  })

  it('replaces inline tags with numbered placeholders', () => {
    const div = document.createElement('div')
    div.innerHTML = 'Hello <strong>world</strong> and <em>universe</em>'
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('Hello <<1>> and <<2>>')
    expect(result.placeholders.size).toBe(2)
    expect(result.placeholders.get(1)).toBe('<strong>world</strong>')
    expect(result.placeholders.get(2)).toBe('<em>universe</em>')
  })

  it('handles nested inline tags', () => {
    const div = document.createElement('div')
    div.innerHTML = 'Text <a href="https://example.com"><strong>link</strong></a> end'
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('Text <<1>> end')
    expect(result.placeholders.get(1)).toContain('<a')
    expect(result.placeholders.get(1)).toContain('link')
  })

  it('keeps text from non-preservable elements', () => {
    const div = document.createElement('div')
    div.innerHTML = 'Hello <div>inner block</div> end'
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('Hello inner block end')
    expect(result.placeholders.size).toBe(0)
  })

  it('handles multiple preservable tag types', () => {
    const div = document.createElement('div')
    div.innerHTML = '<b>bold</b> <i>italic</i> <code>code</code>'
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('<<1>> <<2>> <<3>>')
    expect(result.placeholders.size).toBe(3)
  })

  it('handles empty element', () => {
    const div = document.createElement('div')
    const result = extractTextWithPlaceholders(div)
    expect(result.plainText).toBe('')
    expect(result.placeholders.size).toBe(0)
  })
})

describe('hasPlaceholders', () => {
  it('returns true when text contains placeholders', () => {
    expect(hasPlaceholders('Hello <<1>> world')).toBe(true)
  })

  it('returns false when text has no placeholders', () => {
    expect(hasPlaceholders('Hello world')).toBe(false)
  })

  it('returns false for partial marker syntax', () => {
    expect(hasPlaceholders('Hello <<abc>> world')).toBe(false)
    expect(hasPlaceholders('Hello << 1 >> world')).toBe(false)
  })
})

describe('reinsertPlaceholders', () => {
  it('replaces placeholders with original HTML', () => {
    const placeholders = new Map([[1, '<strong>world</strong>']])
    const result = reinsertPlaceholders('Hola <<1>>', placeholders)
    expect(result).toBe('Hola <strong>world</strong>')
  })

  it('handles multiple placeholders', () => {
    const placeholders = new Map([
      [1, '<strong>bold</strong>'],
      [2, '<em>italic</em>'],
    ])
    const result = reinsertPlaceholders('<<2>> and <<1>>', placeholders)
    expect(result).toBe('<em>italic</em> and <strong>bold</strong>')
  })

  it('appends unused placeholders at end', () => {
    const placeholders = new Map([
      [1, '<strong>bold</strong>'],
      [2, '<em>italic</em>'],
    ])
    const result = reinsertPlaceholders('Only <<1>> here', placeholders)
    expect(result).toBe('Only <strong>bold</strong> here <em>italic</em>')
  })

  it('removes unknown placeholder markers', () => {
    const placeholders = new Map([[1, '<b>x</b>']])
    const result = reinsertPlaceholders('<<1>> and <<99>>', placeholders)
    expect(result).toBe('<b>x</b> and ')
  })

  it('handles text with no placeholders', () => {
    const placeholders = new Map([[1, '<b>x</b>']])
    const result = reinsertPlaceholders('Plain text', placeholders)
    expect(result).toBe('Plain text <b>x</b>')
  })
})

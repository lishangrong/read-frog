// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { sanitizeTranslationHTML } from '../html-sanitizer'

describe('sanitizeTranslationHTML', () => {
  it('preserves allowed tags', () => {
    const html = '<b>bold</b> <i>italic</i> <em>emphasis</em> <strong>strong</strong>'
    const result = sanitizeTranslationHTML(html)
    expect(result).toContain('<b>bold</b>')
    expect(result).toContain('<i>italic</i>')
    expect(result).toContain('<em>emphasis</em>')
    expect(result).toContain('<strong>strong</strong>')
  })

  it('preserves code and span tags', () => {
    const result = sanitizeTranslationHTML('<code>const x</code> <span>text</span>')
    expect(result).toContain('<code>const x</code>')
    expect(result).toContain('<span>text</span>')
  })

  it('preserves anchor tags with safe attributes', () => {
    const result = sanitizeTranslationHTML('<a href="https://example.com" title="link">click</a>')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('title="link"')
    expect(result).toContain('click')
  })

  it('strips script tags', () => {
    const result = sanitizeTranslationHTML('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('</script>')
  })

  it('strips event handler attributes', () => {
    const result = sanitizeTranslationHTML('<b onmouseover="alert(1)">text</b>')
    expect(result).not.toContain('onmouseover')
    expect(result).toContain('<b>text</b>')
  })

  it('strips javascript: URIs in href', () => {
    const result = sanitizeTranslationHTML('<a href="javascript:alert(1)">click</a>')
    expect(result).not.toContain('javascript:')
  })

  it('strips disallowed tags but keeps text content', () => {
    const result = sanitizeTranslationHTML('<div>kept text</div> <p>also kept</p>')
    expect(result).not.toContain('<div>')
    expect(result).not.toContain('<p>')
    expect(result).toContain('kept text')
    expect(result).toContain('also kept')
  })

  it('escapes plain text to prevent injection', () => {
    const result = sanitizeTranslationHTML('Hello <world> & "quotes"')
    expect(result).not.toContain('<world>')
    expect(result).toContain('&amp;')
  })

  it('handles nested tags', () => {
    const result = sanitizeTranslationHTML('<b><i>nested</i></b>')
    expect(result).toBe('<b><i>nested</i></b>')
  })

  it('handles empty input', () => {
    expect(sanitizeTranslationHTML('')).toBe('')
  })

  it('preserves br tags', () => {
    const result = sanitizeTranslationHTML('line1<br>line2')
    expect(result).toContain('<br>')
  })
})

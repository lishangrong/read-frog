import { describe, expect, it } from 'vitest'
import { sanitizeTextForTts } from '../text-sanitizer'

describe('sanitizeTextForTts', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeTextForTts('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('should replace block-level closing tags with spaces', () => {
    expect(sanitizeTextForTts('<p>First</p><p>Second</p>')).toBe('First Second')
  })

  it('should replace <br> with space', () => {
    expect(sanitizeTextForTts('Line one<br>Line two')).toBe('Line one Line two')
    expect(sanitizeTextForTts('Line one<br/>Line two')).toBe('Line one Line two')
  })

  it('should remove zero-width characters', () => {
    expect(sanitizeTextForTts('Hello\u200BWorld')).toBe('HelloWorld')
    expect(sanitizeTextForTts('He\u200Cllo\u200D')).toBe('Hello')
    expect(sanitizeTextForTts('\uFEFFStart')).toBe('Start')
  })

  it('should remove soft hyphens', () => {
    expect(sanitizeTextForTts('in\u00ADter\u00ADna\u00ADtion\u00ADal')).toBe('international')
  })

  it('should remove control characters but preserve newlines and tabs', () => {
    expect(sanitizeTextForTts('Hello\x00World')).toBe('HelloWorld')
    expect(sanitizeTextForTts('A\x01B\x02C')).toBe('ABC')
  })

  it('should collapse whitespace', () => {
    expect(sanitizeTextForTts('Hello   world')).toBe('Hello world')
    expect(sanitizeTextForTts('Hello\n\n\nworld')).toBe('Hello world')
    expect(sanitizeTextForTts('  Hello  \t  world  ')).toBe('Hello world')
  })

  it('should decode HTML entities', () => {
    expect(sanitizeTextForTts('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'')
    expect(sanitizeTextForTts('Hello&nbsp;world')).toBe('Hello world')
  })

  it('should handle empty input', () => {
    expect(sanitizeTextForTts('')).toBe('')
    expect(sanitizeTextForTts('   ')).toBe('')
  })

  it('should handle complex HTML', () => {
    const html = `
      <div class="content">
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
        <script>alert('xss')</script>
        <ul><li>Item 1</li><li>Item 2</li></ul>
      </div>
    `
    const result = sanitizeTextForTts(html)
    expect(result).toContain('Title')
    expect(result).toContain('Paragraph with bold and italic.')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('<')
  })

  it('should handle text with no HTML', () => {
    expect(sanitizeTextForTts('Just plain text')).toBe('Just plain text')
  })

  it('should handle mixed zero-width and HTML', () => {
    expect(sanitizeTextForTts('<span>\u200BHello\u200B</span>')).toBe('Hello')
  })
})

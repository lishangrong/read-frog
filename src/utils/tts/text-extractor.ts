/**
 * Text extraction and purification utilities for TTS.
 *
 * Provides functions to strip HTML tags, decode entities, remove special
 * characters, and split long text into chunks suitable for TTS synthesis.
 */

/** Zero-width and invisible Unicode characters to strip */
const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g

/** HTML entity map for common entities */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': '\'',
  '&apos;': '\'',
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&bull;': '•',
}

/** Numeric HTML entity pattern (decimal and hex) */
const NUMERIC_ENTITY_PATTERN = /&#(x?)([\da-f]+);/gi

/**
 * Strip HTML tags and decode HTML entities from a string.
 *
 * @param html - Raw HTML string
 * @returns Plain text with tags removed and entities decoded
 */
export function stripHtml(html: string): string {
  if (!html) return ''

  let text = html
    // Remove script and style blocks entirely (including content)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Replace <br>, <p>, <div>, <li> etc. with newlines
    .replace(/<\s*\/?\s*(br|p|div|h[1-6]|li|tr|blockquote|section|article)\b[^>]*>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode named HTML entities
    .replace(/&[a-z]+;/gi, (match) => HTML_ENTITY_MAP[match] ?? match)
    // Decode numeric HTML entities
    .replace(NUMERIC_ENTITY_PATTERN, (_match, hex, num) => {
      const codePoint = hex ? Number.parseInt(num, 16) : Number.parseInt(num, 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : ''
    })
    // Strip zero-width characters
    .replace(ZERO_WIDTH_CHARS, '')

  return text
}

/**
 * Purify text for TTS consumption.
 *
 * Performs additional cleaning after stripHtml:
 * - Removes markdown-like syntax
 * - Collapses excessive whitespace
 * - Strips URLs
 * - Removes emoji and special symbols that TTS cannot read
 *
 * @param text - Raw text (may contain markdown, URLs, etc.)
 * @returns Clean text suitable for speech synthesis
 */
export function purifyForTTS(text: string): string {
  if (!text) return ''

  let purified = text
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove markdown bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove markdown horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove markdown list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove markdown blockquote markers
    .replace(/^\s*>\s+/gm, '')
    // Remove excessive punctuation (keep max 2 consecutive)
    .replace(/([.!?])\1{2,}/g, '$1$1')
    // Collapse multiple spaces into one
    .replace(/[ \t]+/g, ' ')
    // Collapse multiple newlines into max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()

  return purified
}

/**
 * Find the last index matching a regex pattern in a string.
 * Returns -1 if not found.
 */
function findLastIndex(str: string, pattern: RegExp): number {
  let lastIndex = -1
  let match: RegExpExecArray | null
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  while ((match = re.exec(str)) !== null) {
    lastIndex = match.index
  }
  return lastIndex
}

/**
 * Split text into chunks that respect a maximum length, breaking at sentence
 * boundaries where possible.
 *
 * @param text - Text to split
 * @param maxLength - Maximum characters per chunk (default: 4096, OpenAI TTS limit)
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, maxLength: number = 4096): string[] {
  if (!text || text.length <= maxLength) {
    return [text]
  }

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining)
      break
    }

    // Try to break at a sentence boundary within the limit
    const searchRange = remaining.slice(0, maxLength)
    const sentenceBreak = searchRange.search(/[.!?。！？]\s*$/)
    if (sentenceBreak > maxLength * 0.5) {
      chunks.push(remaining.slice(0, sentenceBreak + 1).trim())
      remaining = remaining.slice(sentenceBreak + 1).trim()
      continue
    }

    // Try to break at a paragraph boundary
    const paragraphBreak = searchRange.lastIndexOf('\n\n')
    if (paragraphBreak > maxLength * 0.3) {
      chunks.push(remaining.slice(0, paragraphBreak).trim())
      remaining = remaining.slice(paragraphBreak).trim()
      continue
    }

    // Try to break at a comma/semicolon
    const commaBreak = findLastIndex(searchRange, /[，,;；]/)
    if (commaBreak > maxLength * 0.5) {
      chunks.push(remaining.slice(0, commaBreak + 1).trim())
      remaining = remaining.slice(commaBreak + 1).trim()
      continue
    }

    // Try to break at any whitespace
    const spaceBreak = findLastIndex(searchRange, /\s/)
    if (spaceBreak > maxLength * 0.5) {
      chunks.push(remaining.slice(0, spaceBreak).trim())
      remaining = remaining.slice(spaceBreak).trim()
      continue
    }

    // Last resort: hard break at maxLength
    chunks.push(remaining.slice(0, maxLength).trim())
    remaining = remaining.slice(maxLength).trim()
  }

  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Extract pure text from a translation result or raw HTML string,
 * combining stripHtml and purifyForTTS into a single convenience function.
 *
 * @param input - Raw text or HTML to process
 * @returns Clean text ready for TTS
 */
export function extractTextForTTS(input: string): string {
  return purifyForTTS(stripHtml(input))
}

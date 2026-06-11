/**
 * Text sanitization utilities for TTS consumption.
 * Strips HTML tags, zero-width characters, control characters,
 * and normalizes whitespace to produce clean plaintext.
 */

const SKIP_ELEMENTS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'MATH'])

/**
 * Strip HTML tags from a string, replacing block-level closing tags
 * and <br> with spaces to preserve word boundaries.
 */
function stripHtmlTags(text: string): string {
  return text
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/blockquote)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
}

/**
 * Remove zero-width and invisible Unicode characters.
 */
function removeZeroWidthChars(text: string): string {
  return text.replace(/[\u200B-\u200D\uFEFF\u00AD\u200E\u200F\u2060\u2061-\u2064]/g, '')
}

/**
 * Remove C0/C1 control characters except newline (\n) and tab (\t).
 */
function removeControlChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
}

/**
 * Decode common HTML entities.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&nbsp;/g, ' ')
}

/**
 * Collapse multiple whitespace characters (including newlines) into a single space.
 */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ')
}

/**
 * Sanitize arbitrary text for TTS consumption.
 * Pipeline: stripHtmlTags -> decodeEntities -> removeZeroWidth -> removeControl -> collapse -> trim
 */
export function sanitizeTextForTts(input: string): string {
  if (!input) return ''

  let text = input
  text = stripHtmlTags(text)
  text = decodeHtmlEntities(text)
  text = removeZeroWidthChars(text)
  text = removeControlChars(text)
  text = collapseWhitespace(text)
  text = text.trim()

  return text
}

/**
 * Recursively extract plaintext from a DOM node,
 * skipping script/style/noscript elements.
 */
export function extractTextFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const element = node as Element
  if (SKIP_ELEMENTS.has(element.tagName)) {
    return ''
  }

  const parts: string[] = []
  for (const child of element.childNodes) {
    parts.push(extractTextFromNode(child))
  }

  return sanitizeTextForTts(parts.join(' '))
}

/**
 * Extract and sanitize text from a browser Selection object.
 */
export function sanitizeSelectionText(selection: Selection): string {
  return sanitizeTextForTts(selection.toString())
}

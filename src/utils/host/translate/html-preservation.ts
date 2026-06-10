/* ──────────────────────────────
  HTML Preservation
  Extracts text from HTML nodes while replacing
  inline formatting tags with numbered placeholders.
  After translation, restores original HTML tags
  at the placeholder positions.
  ────────────────────────────── */

/** Tags that are considered inline formatting and should be preserved */
const PRESERVABLE_INLINE_TAGS = new Set([
  'B', 'I', 'EM', 'STRONG', 'A', 'CODE', 'SPAN', 'SUB', 'SUP', 'U', 'S', 'MARK',
])

export interface PlaceholderResult {
  plainText: string
  placeholders: Map<number, string>
}

/**
 * Extract text from an HTML element, replacing inline formatting tags
 * with numbered placeholders like <<1>>, <<2>>.
 * Only operates on direct children — does not recurse into nested structures.
 */
export function extractTextWithPlaceholders(node: HTMLElement): PlaceholderResult {
  const placeholders = new Map<number, string>()
  let plainText = ''
  let counter = 1

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      plainText += child.textContent || ''
    }
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      if (PRESERVABLE_INLINE_TAGS.has(el.tagName)) {
        const id = counter++
        placeholders.set(id, el.outerHTML)
        plainText += `<<${id}>>`
      }
      else {
        // Non-preservable element: just take its text content
        plainText += el.textContent || ''
      }
    }
  }

  return { plainText, placeholders }
}

/**
 * Check if text contains any placeholder markers.
 */
export function hasPlaceholders(text: string): boolean {
  return /<<\d+>>/.test(text)
}

/**
 * Reinsert original HTML tags at placeholder positions in translated text.
 * If a placeholder is missing from the translation, append its content at the end.
 */
export function reinsertPlaceholders(
  translatedText: string,
  placeholders: Map<number, string>,
): string {
  let result = translatedText
  const usedIds = new Set<number>()

  // Replace all found placeholders
  result = result.replace(/<<(\d+)>>/g, (_, idStr) => {
    const id = Number.parseInt(idStr, 10)
    const original = placeholders.get(id)
    if (original) {
      usedIds.add(id)
      return original
    }
    return '' // Unknown placeholder, remove it
  })

  // Append any unused placeholders at the end
  for (const [id, html] of placeholders) {
    if (!usedIds.has(id)) {
      result += ` ${html}`
    }
  }

  return result
}

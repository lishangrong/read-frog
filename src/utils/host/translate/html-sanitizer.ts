/* ──────────────────────────────
  HTML Sanitizer
  Sanitizes HTML from translation output to prevent
  XSS attacks while preserving safe formatting tags.
  ────────────────────────────── */

/** Tags that are safe to keep in translated HTML output */
const ALLOWED_TAGS = new Set([
  'B', 'I', 'EM', 'STRONG', 'A', 'CODE', 'SPAN', 'SUB', 'SUP', 'U', 'S', 'MARK', 'BR',
])

/** Attributes that are safe to keep (per tag) */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'target']),
  SPAN: new Set(['class', 'style']),
}

/**
 * Sanitize HTML string by only keeping whitelisted tags and attributes.
 * Strips all other tags and their attributes to prevent XSS.
 */
export function sanitizeTranslationHTML(html: string): string {
  // Use DOMParser for safe parsing (does not execute scripts)
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body

  return sanitizeNode(body)
}

function sanitizeNode(node: Node): string {
  let result = ''

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += escapeHTML(child.textContent || '')
    }
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tagName = el.tagName.toUpperCase()

      if (ALLOWED_TAGS.has(tagName)) {
        const attrs = sanitizeAttributes(el, tagName)
        const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''

        if (tagName === 'BR') {
          result += '<br>'
        }
        else {
          result += `<${tagName.toLowerCase()}${attrStr}>${sanitizeNode(el)}</${tagName.toLowerCase()}>`
        }
      }
      else {
        // Strip the tag but keep its text content (sanitized)
        result += sanitizeNode(el)
      }
    }
  }

  return result
}

function sanitizeAttributes(el: HTMLElement, tagName: string): string[] {
  const allowedAttrs = ALLOWED_ATTRIBUTES[tagName]
  if (!allowedAttrs) return []

  const result: string[] = []
  for (const attr of el.attributes) {
    if (!allowedAttrs.has(attr.name.toLowerCase())) continue

    let value = attr.value
    // Prevent javascript: URIs in href
    if (attr.name === 'href' && /^\s*javascript\s*:/i.test(value)) {
      continue
    }

    result.push(`${attr.name}="${escapeAttribute(value)}"`)
  }

  return result
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

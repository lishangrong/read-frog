import type { TransNode } from '@/types/dom'
import { isHTMLElement, isShallowBlockHTMLElement, isTextNode } from './filter'

/**
 * Extract surrounding context from the DOM around a given node.
 * Walks up to the nearest block-level parent and extracts text from it
 * and its immediate sibling blocks to provide sentence-level context.
 */
export function extractSurroundingContext(node: TransNode, maxChars: number = 500): string {
  const blockParent = findNearestBlockParent(node)
  if (!blockParent) {
    return ''
  }

  const parts: string[] = []
  let totalLength = 0

  // Collect text from the block parent and its siblings
  const parent = blockParent.parentElement
  if (!parent) {
    return truncateText(blockParent.textContent?.trim() || '', maxChars)
  }

  const siblings = Array.from(parent.children)
  const blockIndex = siblings.indexOf(blockParent)

  // Include previous sibling block for context (if exists)
  if (blockIndex > 0) {
    const prevSibling = siblings[blockIndex - 1]
    if (isHTMLElement(prevSibling)) {
      const text = prevSibling.textContent?.trim() || ''
      if (text) {
        parts.push(text)
        totalLength += text.length
      }
    }
  }

  // Include the block parent itself
  const blockText = blockParent.textContent?.trim() || ''
  if (blockText) {
    parts.push(blockText)
    totalLength += blockText.length
  }

  // Include next sibling block for context (if exists and we haven't exceeded limit)
  if (blockIndex < siblings.length - 1 && totalLength < maxChars) {
    const nextSibling = siblings[blockIndex + 1]
    if (isHTMLElement(nextSibling)) {
      const text = nextSibling.textContent?.trim() || ''
      if (text) {
        parts.push(text)
      }
    }
  }

  return truncateText(parts.join(' '), maxChars)
}

/**
 * Extract lightweight article-level context from the page.
 * Returns the page title + first paragraph of main content, if available.
 */
export function extractArticleContext(root: HTMLElement = document.body): string | null {
  const title = document.title?.trim()
  const mainContent = root.querySelector('article, main, [role="main"]')
  const firstParagraph = (mainContent || root).querySelector('p')
  const paragraphText = firstParagraph?.textContent?.trim()

  if (!title && !paragraphText) {
    return null
  }

  const parts: string[] = []
  if (title) parts.push(title)
  if (paragraphText) parts.push(paragraphText)
  return truncateText(parts.join(' — '), 300)
}

function findNearestBlockParent(node: TransNode): HTMLElement | null {
  let current: Node | null = isTextNode(node) ? node.parentNode : node

  while (current && isHTMLElement(current)) {
    if (isShallowBlockHTMLElement(current)) {
      return current
    }
    current = current.parentNode
  }

  return null
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }
  // Truncate at the last space before maxChars to avoid cutting words
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > maxChars * 0.7 ? truncated.slice(0, lastSpace) + '...' : truncated + '...'
}

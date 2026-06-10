import type { LangLevel } from '@/types/config/languages'
import { globalConfig } from '@/utils/config/config'

/**
 * Translation context extracted from the page DOM.
 * Provides surrounding context for accurate translation.
 */
export interface TranslationContext {
  /** The selected text to translate */
  selectedText: string
  /** Full text of the paragraph containing the selection */
  surroundingParagraph: string
  /** Article title (<h1> or <title>) */
  articleTitle: string | null
  /** First ~500 words of the article body */
  articleExcerpt: string
  /** Nearest heading (h1-h6) ancestor or preceding sibling */
  sectionHeading: string | null
  /** Current page domain */
  domain: string
  /** User's language proficiency level */
  langLevel: LangLevel
}

/** Maximum characters to extract for article excerpt */
const MAX_EXCERPT_CHARS = 2000

/** Heading tag names to detect */
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

/**
 * Extracts context from the page DOM to support context-aware translation.
 * Leverages existing DOM labels from walkAndLabelElement for article body detection.
 */
export class ContextExtractor {
  /**
   * Extract translation context from the selection's surrounding DOM.
   *
   * @param anchorNode - The selection anchor node (start of selection)
   * @param focusNode - The selection focus node (end of selection)
   * @param selectedText - The selected text
   * @returns Translation context with article information
   */
  extract(anchorNode: Node, focusNode: Node, selectedText: string): TranslationContext {
    const langLevel = globalConfig?.language.level ?? 'intermediate'

    return {
      selectedText,
      surroundingParagraph: this.extractSurroundingParagraph(anchorNode, focusNode),
      articleTitle: this.extractArticleTitle(),
      articleExcerpt: this.extractArticleExcerpt(),
      sectionHeading: this.extractSectionHeading(anchorNode),
      domain: window.location.hostname,
      langLevel,
    }
  }

  /**
   * Extract the full text of the paragraph(s) containing the selection.
   */
  private extractSurroundingParagraph(anchorNode: Node, focusNode: Node): string {
    // Find the common ancestor of the selection
    const commonAncestor = this.findCommonAncestor(anchorNode, focusNode)
    if (!commonAncestor) {
      return ''
    }

    // Walk up to find a block-level container (paragraph, article, section, div)
    let container = commonAncestor
    while (container && !this.isBlockContainer(container)) {
      container = container.parentElement as Node
    }

    if (!container) {
      return ''
    }

    return (container.textContent || '').trim().slice(0, 1000)
  }

  /**
   * Extract the article title from the page.
   * Tries: <h1>, <meta property="og:title">, <title>
   */
  private extractArticleTitle(): string | null {
    // Try <h1> first
    const h1 = document.querySelector('h1')
    if (h1?.textContent?.trim()) {
      return h1.textContent.trim()
    }

    // Try Open Graph meta tag
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle?.getAttribute('content')) {
      return ogTitle.getAttribute('content')!
    }

    // Fall back to <title>
    const title = document.querySelector('title')
    if (title?.textContent?.trim()) {
      return title.textContent.trim()
    }

    return null
  }

  /**
   * Extract the first ~500 words of the article body.
   * Uses Readability-labeled elements or falls back to <article> / <main> / <body>.
   */
  private extractArticleExcerpt(): string {
    // Try to find article content using common containers
    const articleSelectors = [
      'article',
      '[data-read-frog-paragraph]', // Use existing labels
      'main',
      '[role="main"]',
      '.article-body',
      '.post-content',
      '.entry-content',
    ]

    for (const selector of articleSelectors) {
      const element = document.querySelector(selector)
      if (element?.textContent?.trim()) {
        const text = element.textContent.trim()
        if (text.length > 100) {
          return text.slice(0, MAX_EXCERPT_CHARS)
        }
      }
    }

    // Fall back to body text
    const bodyText = document.body?.textContent?.trim() || ''
    return bodyText.slice(0, MAX_EXCERPT_CHARS)
  }

  /**
   * Extract the nearest section heading for the selected text.
   * Looks for h1-h6 ancestors and preceding siblings.
   */
  private extractSectionHeading(node: Node): string | null {
    let current: Node | null = node

    while (current) {
      if (current instanceof HTMLElement) {
        // Check if this element is a heading
        if (HEADING_TAGS.has(current.tagName)) {
          return current.textContent?.trim() || null
        }

        // Check preceding siblings for headings
        let sibling = current.previousElementSibling
        while (sibling) {
          if (HEADING_TAGS.has(sibling.tagName)) {
            return sibling.textContent?.trim() || null
          }
          sibling = sibling.previousElementSibling
        }
      }

      current = current.parentNode
    }

    return null
  }

  /**
   * Find the common ancestor of two nodes.
   */
  private findCommonAncestor(node1: Node, node2: Node): Node | null {
    const ancestors1 = this.getAncestors(node1)
    const ancestors2 = new Set(this.getAncestors(node2))

    for (const ancestor of ancestors1) {
      if (ancestors2.has(ancestor)) {
        return ancestor
      }
    }

    return null
  }

  /**
   * Get all ancestors of a node from the node itself to the root.
   */
  private getAncestors(node: Node): Node[] {
    const ancestors: Node[] = []
    let current: Node | null = node
    while (current) {
      ancestors.push(current)
      current = current.parentNode
    }
    return ancestors
  }

  /**
   * Check if a node is a block-level container suitable for paragraph extraction.
   */
  private isBlockContainer(node: Node): boolean {
    if (!(node instanceof HTMLElement)) {
      return false
    }

    const blockTags = new Set([
      'P', 'ARTICLE', 'SECTION', 'DIV', 'BLOCKQUOTE',
      'LI', 'TD', 'TH', 'DD', 'FIGCAPTION',
    ])

    return blockTags.has(node.tagName)
  }
}

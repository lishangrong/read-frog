/**
 * HTML Structure Preserver
 *
 * Extracts inline tag positions from original HTML fragments and re-applies
 * them to translated text, ensuring bilingual mode alignment.
 *
 * Uses a word-alignment heuristic (punctuation, capitalization, word count ratio)
 * to map original tag positions to translated text positions.
 */

/** Position of a tag boundary relative to text content */
export interface TagPosition {
  /** Character offset in the flattened text where this tag boundary occurs */
  textOffset: number
  /** Tag name (e.g., 'b', 'em', 'a') */
  tagName: string
  /** Whether this is a closing tag */
  isClosing: boolean
  /** Attributes for opening tags (e.g., href for <a>) */
  attributes?: Record<string, string>
  /** Unique index for matching open/close pairs */
  pairIndex: number
}

/** Structure map extracted from original HTML */
export interface StructureMap {
  /** All tag positions in the original text */
  tagPositions: TagPosition[]
  /** The original plain text content */
  plainText: string
  /** Number of inline tags found */
  tagCount: number
}

/** Result of applying structure to translated text */
export interface StructureResult {
  /** The translated text with inline tags re-inserted */
  html: string
  /** Whether the structure was fully preserved or degraded */
  degraded: boolean
}

/** Inline tags that should be preserved in translation */
const PRESERVED_INLINE_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL',
  'MARK', 'SMALL', 'SUB', 'SUP', 'CODE', 'ABBR', 'CITE',
  'A', 'SPAN',
])

export class HTMLStructurePreserver {
  private nextPairIndex = 0

  /**
   * Extract tag positions from an HTML fragment.
   * Walks the DOM tree and records where inline tags open/close
   * relative to the plain text content.
   */
  static extractStructure(htmlFragment: string): StructureMap {
    const preserver = new HTMLStructurePreserver()
    return preserver.extract(htmlFragment)
  }

  /**
   * Re-insert inline tags into translated text at aligned positions.
   */
  static applyStructure(
    translatedText: string,
    structureMap: StructureMap,
  ): StructureResult {
    if (structureMap.tagCount === 0) {
      return { html: translatedText, degraded: false }
    }

    const alignedPositions = HTMLStructurePreserver.alignPositions(
      structureMap.plainText,
      translatedText,
      structureMap.tagPositions,
    )

    if (!alignedPositions) {
      // Degraded: wrap entire translation in a single span
      return {
        html: `<span>${HTMLStructurePreserver.escapeHtml(translatedText)}</span>`,
        degraded: true,
      }
    }

    return {
      html: HTMLStructurePreserver.insertTags(translatedText, alignedPositions),
      degraded: false,
    }
  }

  /**
   * Validate that the resulting HTML has the correct tag structure.
   */
  static validate(html: string, expectedTagCount: number): boolean {
    const openTagCount = (html.match(/<[a-zA-Z]/g) || []).length
    const closeTagCount = (html.match(/<\//g) || []).length
    // Each inline tag has one open and one close
    return openTagCount === expectedTagCount && closeTagCount === expectedTagCount
  }

  // --- Private implementation ---

  private extract(htmlFragment: string): StructureMap {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${htmlFragment}</div>`, 'text/html')
    const root = doc.body.firstElementChild

    if (!root) {
      return { tagPositions: [], plainText: htmlFragment, tagCount: 0 }
    }

    const tagPositions: TagPosition[] = []
    let plainText = ''

    this.walkNode(root, tagPositions, () => plainText.length)
    plainText = root.textContent || ''

    return {
      tagPositions,
      plainText,
      tagCount: tagPositions.filter(t => !t.isClosing).length,
    }
  }

  private walkNode(
    node: Node,
    positions: TagPosition[],
    getCurrentOffset: () => number,
  ): void {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        // Text nodes don't create tag positions; offset advances by text length
        continue
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element
        const tagName = element.tagName

        if (PRESERVED_INLINE_TAGS.has(tagName)) {
          const pairIndex = this.nextPairIndex++
          const offset = getCurrentOffset()

          // Record opening tag
          const attributes: Record<string, string> = {}
          for (const attr of Array.from(element.attributes)) {
            attributes[attr.name] = attr.value
          }

          positions.push({
            textOffset: offset,
            tagName: tagName.toLowerCase(),
            isClosing: false,
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
            pairIndex,
          })

          // Walk children to get text offset after this element's content
          this.walkNode(element, positions, getCurrentOffset)

          // Record closing tag
          positions.push({
            textOffset: getCurrentOffset(),
            tagName: tagName.toLowerCase(),
            isClosing: true,
            pairIndex,
          })
        }
        else {
          // Non-preserved tags: walk into children but don't record positions
          this.walkNode(element, positions, getCurrentOffset)
        }
      }
    }
  }

  /**
   * Align tag positions from original text to translated text.
   * Uses word-count ratio to proportionally map positions.
   * Returns null if alignment is not possible.
   */
  private static alignPositions(
    originalText: string,
    translatedText: string,
    tagPositions: TagPosition[],
  ): TagPosition[] | null {
    const originalWords = originalText.split(/\s+/).filter(Boolean)
    const translatedWords = translatedText.split(/\s+/).filter(Boolean)

    if (originalWords.length === 0) {
      return null
    }

    // Word-count ratio for proportional mapping
    const ratio = translatedWords.length / originalWords.length

    // Build word-to-character-offset maps
    const originalWordOffsets = HTMLStructurePreserver.buildWordOffsets(originalText)
    const translatedWordOffsets = HTMLStructurePreserver.buildWordOffsets(translatedText)

    return tagPositions.map((pos) => {
      // Find which word index this tag offset falls at
      const wordIndex = HTMLStructurePreserver.offsetToWordIndex(
        pos.textOffset,
        originalWordOffsets,
      )

      // Map to translated word index proportionally
      const translatedWordIndex = Math.min(
        Math.round(wordIndex * ratio),
        translatedWords.length,
      )

      // Convert back to character offset
      const translatedOffset = translatedWordIndex < translatedWordOffsets.length
        ? translatedWordOffsets[translatedWordIndex].start
        : translatedText.length

      return {
        ...pos,
        textOffset: translatedOffset,
      }
    })
  }

  /**
   * Build an array of { start, end } character offsets for each word in text.
   */
  private static buildWordOffsets(text: string): Array<{ start: number, end: number }> {
    const offsets: Array<{ start: number, end: number }> = []
    const regex = /\S+/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      offsets.push({ start: match.index, end: match.index + match[0].length })
    }

    return offsets
  }

  /**
   * Convert a character offset to the nearest word index.
   */
  private static offsetToWordIndex(
    offset: number,
    wordOffsets: Array<{ start: number, end: number }>,
  ): number {
    for (let i = 0; i < wordOffsets.length; i++) {
      if (offset <= wordOffsets[i].start) {
        return i
      }
    }
    return wordOffsets.length
  }

  /**
   * Insert tags at aligned positions into translated text.
   */
  private static insertTags(
    text: string,
    positions: TagPosition[],
  ): string {
    // Sort by offset descending so insertions don't shift later offsets
    const sorted = [...positions].sort((a, b) => b.textOffset - a.textOffset)

    let result = text
    for (const pos of sorted) {
      const offset = Math.min(pos.textOffset, result.length)

      if (pos.isClosing) {
        result = result.slice(0, offset) + `</${pos.tagName}>` + result.slice(offset)
      }
      else {
        const attrStr = pos.attributes
          ? Object.entries(pos.attributes)
              .map(([k, v]) => ` ${k}="${HTMLStructurePreserver.escapeHtml(v)}"`)
              .join('')
          : ''
        result = result.slice(0, offset) + `<${pos.tagName}${attrStr}>` + result.slice(offset)
      }
    }

    return result
  }

  /**
   * Escape HTML special characters.
   */
  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}

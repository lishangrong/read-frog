/**
 * Batch Semantic Validator
 *
 * Validates that merging texts into a single batch translation request
 * won't compromise translation quality. Uses heuristic checks (no LLM calls)
 * to determine if texts can be safely batched together.
 */

export interface BatchItem {
  /** The text to translate */
  text: string
  /** Source language code */
  sourceLang?: string
  /** DOM context: parent element identifier or path for proximity checks */
  domContext?: {
    parentTag?: string
    parentId?: string
    sectionId?: string
    containerPath?: string
  }
}

export type SemanticViolationType =
  | 'context-loss'
  | 'pronoun-ambiguity'
  | 'cross-reference'
  | 'structural-mismatch'
  | 'length-exceeded'
  | 'language-mismatch'

export interface SemanticViolation {
  type: SemanticViolationType
  affectedIndices: number[]
  message: string
}

export interface BatchValidationResult {
  isValid: boolean
  violations: SemanticViolation[]
}

/** Cross-reference patterns in multiple languages */
const CROSS_REFERENCE_PATTERNS = [
  /\b(see above|see below|as mentioned|as noted|as stated|refer to|previously mentioned|aforementioned)\b/gi,
  /\b(同上|如下|如上所述|如前所述|参见|前述|上文|下文)\b/g,
  /\b(上記|下記|前述|後述|上述|下述|先に述べた)\b/g,
  /\b(voir ci-dessus|voir ci-dessous|comme mentionné|précédemment)\b/gi,
  /\b(siehe oben|siehe unten|wie erwähnt|wie bereits|zuvor erwähnt)\b/gi,
]

/** Pronoun patterns that may cause ambiguity across text boundaries */
const PRONOUN_PATTERNS = [
  /^\s*(it|this|that|these|those|they|them|he|she|we|us|him|her|its|their)\b/i,
  /^\s*(这|那|它|他|她|我们|他们|它们|她们|此|其)\b/,
  /^\s*(これ|それ|あれ|彼|彼女|我々|それら)\b/,
]

/** Max combined character count for a batch (rough token estimate) */
const MAX_BATCH_CHARS = 4000

export class BatchSemanticValidator {
  /**
   * Validate that a batch of texts can be safely translated together
   * without compromising semantic integrity.
   */
  validate(items: BatchItem[]): BatchValidationResult {
    if (items.length <= 1) {
      return { isValid: true, violations: [] }
    }

    const violations: SemanticViolation[] = []

    // Check 1: Language consistency
    const langMismatch = this.checkLanguageConsistency(items)
    if (langMismatch) {
      violations.push(langMismatch)
    }

    // Check 2: Combined length
    const lengthViolation = this.checkCombinedLength(items)
    if (lengthViolation) {
      violations.push(lengthViolation)
    }

    // Check 3: Cross-references between texts
    const crossRefViolation = this.checkCrossReferences(items)
    if (crossRefViolation) {
      violations.push(crossRefViolation)
    }

    // Check 4: Pronoun chains across boundaries
    const pronounViolation = this.checkPronounChains(items)
    if (pronounViolation) {
      violations.push(pronounViolation)
    }

    // Check 5: DOM proximity (structural coherence)
    const structureViolation = this.checkDOMProximity(items)
    if (structureViolation) {
      violations.push(structureViolation)
    }

    return {
      isValid: violations.length === 0,
      violations,
    }
  }

  /**
   * If validation fails, suggest optimal split points to divide
   * the batch into semantically coherent sub-batches.
   */
  suggestSplit(items: BatchItem[], result: BatchValidationResult): BatchItem[][] {
    if (items.length <= 1) {
      return [items]
    }

    // Collect indices where splits should occur
    const splitIndices = new Set<number>()

    for (const violation of result.violations) {
      if (violation.affectedIndices.length > 0) {
        // Split before the first affected index
        const firstAffected = Math.min(...violation.affectedIndices)
        if (firstAffected > 0) {
          splitIndices.add(firstAffected)
        }
      }
    }

    // If no specific split points, split in half
    if (splitIndices.size === 0) {
      splitIndices.add(Math.ceil(items.length / 2))
    }

    // Convert to sorted array and create sub-batches
    const splits = Array.from(splitIndices).sort((a, b) => a - b)
    const subBatches: BatchItem[][] = []
    let start = 0

    for (const splitAt of splits) {
      if (splitAt > start && splitAt < items.length) {
        subBatches.push(items.slice(start, splitAt))
        start = splitAt
      }
    }

    // Add remaining items
    if (start < items.length) {
      subBatches.push(items.slice(start))
    }

    return subBatches
  }

  private checkLanguageConsistency(items: BatchItem[]): SemanticViolation | null {
    const langs = new Set(items.map(i => i.sourceLang).filter(Boolean))
    if (langs.size > 1) {
      return {
        type: 'language-mismatch',
        affectedIndices: items.map((_, i) => i),
        message: `Batch contains texts from multiple source languages: ${Array.from(langs).join(', ')}`,
      }
    }
    return null
  }

  private checkCombinedLength(items: BatchItem[]): SemanticViolation | null {
    const totalLength = items.reduce((sum, item) => sum + item.text.length, 0)
    if (totalLength > MAX_BATCH_CHARS) {
      return {
        type: 'length-exceeded',
        affectedIndices: items.map((_, i) => i),
        message: `Combined text length (${totalLength} chars) exceeds maximum (${MAX_BATCH_CHARS} chars)`,
      }
    }
    return null
  }

  private checkCrossReferences(items: BatchItem[]): SemanticViolation | null {
    const affectedIndices: number[] = []

    for (let i = 1; i < items.length; i++) {
      const text = items[i].text
      for (const pattern of CROSS_REFERENCE_PATTERNS) {
        pattern.lastIndex = 0
        if (pattern.test(text)) {
          affectedIndices.push(i)
          break
        }
      }
    }

    if (affectedIndices.length > 0) {
      return {
        type: 'cross-reference',
        affectedIndices,
        message: `Texts at indices [${affectedIndices.join(', ')}] contain cross-references that may lose context when batched`,
      }
    }
    return null
  }

  private checkPronounChains(items: BatchItem[]): SemanticViolation | null {
    const affectedIndices: number[] = []

    for (let i = 1; i < items.length; i++) {
      const text = items[i].text
      for (const pattern of PRONOUN_PATTERNS) {
        pattern.lastIndex = 0
        if (pattern.test(text)) {
          affectedIndices.push(i)
          break
        }
      }
    }

    if (affectedIndices.length > 0) {
      return {
        type: 'pronoun-ambiguity',
        affectedIndices,
        message: `Texts at indices [${affectedIndices.join(', ')}] start with pronouns that may be ambiguous without preceding context`,
      }
    }
    return null
  }

  private checkDOMProximity(items: BatchItem[]): SemanticViolation | null {
    // Only check if DOM context is provided
    const itemsWithContext = items.filter(i => i.domContext?.containerPath)
    if (itemsWithContext.length < 2) {
      return null
    }

    // Check if all items share the same container
    const containers = new Set(itemsWithContext.map(i => i.domContext!.containerPath))
    if (containers.size > 1) {
      // Items from different containers — check if they share at least a section
      const sections = new Set(itemsWithContext.map(i => i.domContext!.sectionId).filter(Boolean))
      if (sections.size > 1) {
        const affectedIndices: number[] = []
        let lastPath = itemsWithContext[0].domContext!.containerPath!
        for (let i = 1; i < itemsWithContext.length; i++) {
          const currentPath = itemsWithContext[i].domContext!.containerPath!
          if (currentPath !== lastPath) {
            affectedIndices.push(i)
            lastPath = currentPath
          }
        }

        if (affectedIndices.length > 0) {
          return {
            type: 'structural-mismatch',
            affectedIndices,
            message: `Texts come from different DOM containers, which may reduce translation coherence`,
          }
        }
      }
    }

    return null
  }
}

/**
 * Batch Alignment Verifier
 *
 * Verifies that the output from batch translation correctly aligns
 * with the input texts. Detects dropped, merged, or misaligned translations.
 */

export interface AlignedPair {
  input: string
  output: string
}

export class BatchAlignmentVerifier {
  /**
   * Verify that batch translation outputs align correctly with inputs.
   *
   * @param inputs - Original text strings sent for translation
   * @param outputs - Translated text strings received from provider
   * @param separatorToken - Token used to separate items in the batch prompt (e.g., numbering)
   * @returns Array of aligned input-output pairs
   * @throws Error if alignment validation fails
   */
  static verify(
    inputs: string[],
    outputs: string[],
    separatorToken: string = '',
  ): AlignedPair[] {
    // Check 1: Count must match
    if (outputs.length !== inputs.length) {
      throw new BatchAlignmentError(
        `Batch output count mismatch: expected ${inputs.length} outputs, got ${outputs.length}`,
        inputs.length,
        outputs.length,
      )
    }

    // Check 2: No empty outputs (unless input was also empty)
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].trim() && !outputs[i].trim()) {
        throw new BatchAlignmentError(
          `Empty translation for non-empty input at index ${i}`,
          inputs.length,
          outputs.length,
        )
      }
    }

    // Check 3: Verify alignment using sentence count heuristic
    const aligned: AlignedPair[] = []
    for (let i = 0; i < inputs.length; i++) {
      const inputSentenceCount = BatchAlignmentVerifier.countSentences(inputs[i])
      const outputSentenceCount = BatchAlignmentVerifier.countSentences(outputs[i])

      // Allow some flexibility: output sentence count should be within
      // a reasonable range of input sentence count (±50% or at least ±1)
      const minExpected = Math.max(1, Math.floor(inputSentenceCount * 0.5))
      const maxExpected = Math.ceil(inputSentenceCount * 1.5) + 1

      if (outputSentenceCount < minExpected || outputSentenceCount > maxExpected) {
        // This is a warning, not a hard failure — sentence splitting varies by language
        console.warn(
          `Batch alignment warning: input[${i}] has ${inputSentenceCount} sentences, `
          + `output[${i}] has ${outputSentenceCount} sentences (expected ${minExpected}-${maxExpected})`,
        )
      }

      aligned.push({ input: inputs[i], output: outputs[i] })
    }

    // Check 4: Keyword overlap verification
    // Verify that key terms from input appear in some form in the output
    // (This is a lightweight check — full semantic verification would require an LLM)
    for (let i = 0; i < inputs.length; i++) {
      const inputNumbers = BatchAlignmentVerifier.extractNumbers(inputs[i])
      const outputNumbers = BatchAlignmentVerifier.extractNumbers(outputs[i])

      // Numbers should generally be preserved in translation
      if (inputNumbers.length > 0) {
        const missingNumbers = inputNumbers.filter(n => !outputNumbers.includes(n))
        if (missingNumbers.length > inputNumbers.length * 0.5) {
          console.warn(
            `Batch alignment warning: input[${i}] has numbers [${inputNumbers.join(', ')}] `
            + `but output[${i}] is missing [${missingNumbers.join(', ')}]`,
          )
        }
      }
    }

    return aligned
  }

  /**
   * Count approximate number of sentences in a text.
   */
  private static countSentences(text: string): number {
    // Match sentence-ending punctuation followed by space or end of string
    const matches = text.match(/[.!?。！？]+[\s"')\]]*(?=\s|$)/g)
    return matches ? matches.length : 1
  }

  /**
   * Extract numeric values from text (for number preservation check).
   */
  private static extractNumbers(text: string): string[] {
    const matches = text.match(/\b\d+(?:[.,]\d+)*\b/g)
    return matches || []
  }
}

/**
 * Error thrown when batch alignment verification fails.
 */
export class BatchAlignmentError extends Error {
  constructor(
    message: string,
    public expectedCount: number,
    public actualCount: number,
  ) {
    super(message)
    this.name = 'BatchAlignmentError'
  }
}

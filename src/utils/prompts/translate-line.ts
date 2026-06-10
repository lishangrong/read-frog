export function getTranslateLinePrompt(targetLang: string, input: string, hasPlaceholders: boolean = false) {
  const placeholderInstruction = hasPlaceholders
    ? ' Preserve all numbered markers like <<1>>, <<2>> in their correct positions within the translation.'
    : ''
  return `Treat input as plain text input and translate it into ${targetLang}, output translation ONLY.${placeholderInstruction} If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes.
Input:
${input}
`
}

export function getTranslateLinePromptWithContext(
  targetLang: string,
  input: string,
  context: string,
  terms?: string[],
  hasPlaceholders: boolean = false,
) {
  const termsPart = terms && terms.length > 0
    ? `\nDomain terms: ${terms.join(', ')}`
    : ''
  const placeholderInstruction = hasPlaceholders
    ? ' Preserve all numbered markers like <<1>>, <<2>> in their correct positions within the translation.'
    : ''

  return `Context: ${context}${termsPart}
Translate the following text into ${targetLang}, output translation ONLY.${placeholderInstruction} Use the context above to ensure accurate and domain-appropriate translation. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes.
Input:
${input}
`
}

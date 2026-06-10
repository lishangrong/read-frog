import type { LangLevel } from '@/types/config/languages'

/**
 * Language-level-specific prompt instructions for selection translation.
 * Controls the detail level of explanations based on user proficiency.
 */

export interface LevelInstructions {
  /** Suffix appended to the system prompt for level-specific behavior */
  systemPromptSuffix: string
  /** Level of explanation detail */
  explanationDetail: 'minimal' | 'moderate' | 'detailed'
  /** Whether to include grammar breakdown */
  includeGrammarNotes: boolean
  /** Whether to include pronunciation hints */
  includePronunciation: boolean
  /** Depth of vocabulary explanation */
  vocabularyDepth: 'basic' | 'intermediate' | 'comprehensive'
}

const BEGINNER_INSTRUCTIONS: LevelInstructions = {
  systemPromptSuffix: `You are helping a beginner language learner. After providing the translation, include:
1. A word-by-word breakdown of the original text (word, part of speech, meaning)
2. Key grammar points explained simply
3. Pronunciation hints for difficult words
4. Common usage examples for key vocabulary
Keep explanations clear and encouraging.`,
  explanationDetail: 'detailed',
  includeGrammarNotes: true,
  includePronunciation: true,
  vocabularyDepth: 'comprehensive',
}

const INTERMEDIATE_INSTRUCTIONS: LevelInstructions = {
  systemPromptSuffix: `You are helping an intermediate language learner. After providing the translation, include:
1. Brief notes on key phrases or idioms
2. Grammar points that differ from common patterns
3. Nuanced vocabulary usage where relevant
Focus on building deeper understanding without over-explaining basics.`,
  explanationDetail: 'moderate',
  includeGrammarNotes: true,
  includePronunciation: false,
  vocabularyDepth: 'intermediate',
}

const ADVANCED_INSTRUCTIONS: LevelInstructions = {
  systemPromptSuffix: `You are helping an advanced language learner. Provide a precise translation with:
1. Cultural or contextual nuances that affect meaning
2. Register/tone observations
Only explain genuinely subtle or unusual usage. Keep it concise.`,
  explanationDetail: 'minimal',
  includeGrammarNotes: false,
  includePronunciation: false,
  vocabularyDepth: 'basic',
}

/**
 * Get language-level-specific prompt instructions for selection translation.
 */
export function getLevelInstructions(level: LangLevel): LevelInstructions {
  switch (level) {
    case 'beginner':
      return BEGINNER_INSTRUCTIONS
    case 'intermediate':
      return INTERMEDIATE_INSTRUCTIONS
    case 'advanced':
      return ADVANCED_INSTRUCTIONS
    default:
      return INTERMEDIATE_INSTRUCTIONS
  }
}

/**
 * Build a context-aware translation prompt that includes article context
 * and language-level instructions.
 */
export function buildContextAwarePrompt(
  targetLang: string,
  selectedText: string,
  context: {
    articleTitle: string | null
    sectionHeading: string | null
    surroundingParagraph: string
  },
  level: LangLevel,
): string {
  const instructions = getLevelInstructions(level)
  const contextParts: string[] = []

  if (context.articleTitle) {
    contextParts.push(`Article title: "${context.articleTitle}"`)
  }
  if (context.sectionHeading) {
    contextParts.push(`Section: "${context.sectionHeading}"`)
  }
  if (context.surroundingParagraph && context.surroundingParagraph !== selectedText) {
    contextParts.push(`Surrounding context: "${context.surroundingParagraph}"`)
  }

  const contextBlock = contextParts.length > 0
    ? `\nContext for accurate translation:\n${contextParts.join('\n')}\n`
    : ''

  return `${instructions.systemPromptSuffix}

Translate the following text into ${targetLang}.${contextBlock}

Text to translate:
${selectedText}
`
}

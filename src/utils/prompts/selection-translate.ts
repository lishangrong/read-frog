import type { LangLevel } from '@/types/config/languages'

export function getSelectionTranslatePrompt(
  selectedText: string,
  context: string,
  sourceLang: string,
  targetLang: string,
  langLevel: LangLevel,
): string {
  const contextPart = context ? `\nContext: ${context}` : ''

  switch (langLevel) {
    case 'beginner':
      return `You are a language teacher helping a beginner learner.${contextPart}
Translate the following ${sourceLang} text into ${targetLang} and provide a detailed word-by-word breakdown.

Output a JSON object with this exact structure:
{
  "translation": "the translated text",
  "wordBreakdown": [
    { "word": "original word", "syntacticCategory": "n.", "meaning": "meaning in ${targetLang}" }
  ],
  "grammarNotes": "brief grammar explanation in ${targetLang}"
}

Use standard part-of-speech abbreviations: n., v., adj., adv., prep., conj., pron., det., interj., ph.
Only output the JSON object, nothing else.

Text: ${selectedText}`

    case 'intermediate':
      return `You are a language teacher helping an intermediate learner.${contextPart}
Translate the following ${sourceLang} text into ${targetLang} and highlight key vocabulary.

Output a JSON object with this exact structure:
{
  "translation": "the translated text",
  "keyVocabulary": [
    { "term": "important word/phrase", "explanation": "explanation in ${targetLang}" }
  ],
  "contextNote": "brief note about usage context or register in ${targetLang}"
}

Select 2-5 vocabulary items that an intermediate learner would benefit from knowing.
Only output the JSON object, nothing else.

Text: ${selectedText}`

    case 'advanced':
      return `You are a language expert helping an advanced learner.${contextPart}
Translate the following ${sourceLang} text into ${targetLang} and provide idiomatic alternatives.

Output a JSON object with this exact structure:
{
  "translation": "the translated text",
  "idiomaticAlternatives": ["alternative translation 1", "alternative translation 2"],
  "registerNote": "note about formality level, collocations, or subtle nuances in ${targetLang}"
}

Provide 1-3 idiomatic alternatives that capture different nuances.
Only output the JSON object, nothing else.

Text: ${selectedText}`
  }
}

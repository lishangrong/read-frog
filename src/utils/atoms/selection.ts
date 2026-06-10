import { atom } from 'jotai'

/**
 * Result of a selection translation.
 */
export interface SelectionTranslationResult {
  /** The original selected text */
  originalText: string
  /** The translated text */
  translatedText: string
  /** Optional explanation (varies by language level) */
  explanation?: string
  /** Language level used for the explanation */
  level: 'beginner' | 'intermediate' | 'advanced'
}

/** Atom holding the current selection translation result */
export const selectionResultAtom = atom<SelectionTranslationResult | null>(null)

/** Whether the selection popup is currently visible */
export const selectionPopupVisibleAtom = atom(false)

/** Position of the selection popup */
export const selectionPositionAtom = atom<{ x: number, y: number } | null>(null)

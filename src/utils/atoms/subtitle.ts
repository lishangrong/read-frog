import { atom } from 'jotai'

/**
 * Represents a single subtitle cue with timing and content.
 */
export interface SubtitleCue {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Original text content */
  originalText: string
  /** Translated text content (empty if not yet translated) */
  translatedText: string
  /** Index in the subtitle track */
  index: number
}

/**
 * Current state of subtitle translation.
 */
export type SubtitleTranslationState =
  | 'idle'
  | 'detecting'
  | 'translating'
  | 'active'
  | 'error'

/** Whether the subtitle overlay is visible */
export const subtitleOverlayVisibleAtom = atom(false)

/** The current subtitle cue being displayed */
export const currentSubtitleCueAtom = atom<SubtitleCue | null>(null)

/** List of all subtitle cues for the current video */
export const subtitleCuesAtom = atom<SubtitleCue[]>([])

/** Current subtitle translation state */
export const subtitleTranslationStateAtom = atom<SubtitleTranslationState>('idle')

/** Whether we detected a supported video player on the page */
export const videoPlayerDetectedAtom = atom(false)

/** The video element currently being monitored */
export const activeVideoElementAtom = atom<HTMLVideoElement | null>(null)

/** Error message for subtitle translation failures */
export const subtitleErrorAtom = atom<string | null>(null)

/**
 * Derived atom: returns the current translated subtitle text,
 * falling back to original text if no translation available.
 */
export const displaySubtitleTextAtom = atom((get) => {
  const cue = get(currentSubtitleCueAtom)
  if (!cue)
    return null
  return cue.translatedText || cue.originalText
})

import { atom, createStore } from 'jotai'

export const store = createStore()

export const isSideOpenAtom = atom(false)

export const progressAtom = atom({
  completed: 0,
  total: 0,
})

// Translation port atom for browser.runtime.connect
export const translationPortAtom = atom<Browser.runtime.Port | null>(null)
export const enablePageTranslationAtom = atom(false)

// Subtitle state
export const subtitleEnabledAtom = atom(false)

// TTS state
export const ttsPlaybackStateAtom = atom<'idle' | 'playing' | 'paused'>('idle')
export const ttsCurrentTextAtom = atom<string>('')

export const readStateAtom = atom<
  'extracting' | 'analyzing' | 'continue?' | 'explaining' | undefined
>(undefined)

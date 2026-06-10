import type { RenderingMode } from '@/types/config/rendering'
import { atom } from 'jotai'
import { configAtom, getConfigFieldAtom, writeConfigAtom } from './config'

/**
 * Atom for reading/writing the rendering mode.
 * Reading: returns current rendering mode from config.
 * Writing: updates config.rendering.mode.
 */
const renderingConfigAtom = getConfigFieldAtom('rendering')

export const renderingModeAtom = atom<RenderingMode, [RenderingMode], void>(
  (get) => {
    const rendering = get(configAtom).rendering
    return rendering?.mode ?? 'bilingual'
  },
  (_get, set, mode: RenderingMode) => {
    set(writeConfigAtom, { rendering: { mode } })
  },
)

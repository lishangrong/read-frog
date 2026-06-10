import { useAtom, useAtomValue } from 'jotai'
import { Languages, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { configFields } from '@/utils/atoms/config'
import { ttsPlaybackStateAtom, ttsSpeedAtom, ttsTextAtom, ttsVoiceIdAtom } from '@/utils/atoms/tts'

/**
 * Offset from the selection rect where the button is rendered (px).
 */
const BUTTON_OFFSET_X = 8
const BUTTON_OFFSET_Y = -40
const VIEWPORT_MARGIN = 12

/**
 * Minimum mouse movement (px) to dismiss the button after a click.
 */
const DISMISS_THRESHOLD = 4

interface SelectionPosition {
  x: number
  y: number
  text: string
}

/**
 * Floating translate button that dynamically appears near selected text.
 *
 * - Listens for `selectionchange` events on the host document.
 * - Shows a compact action bar (translate + TTS) at a suitable position
 *   relative to the selection bounding rect.
 * - Auto-hides when the selection is cleared.
 * - Uses `pointer-events: auto` so it can be interacted with inside the
 *   shadow-DOM overlay that sits on top of the page.
 */
export default function SelectionFloatingButton() {
  const [pos, setPos] = useState<SelectionPosition | null>(null)
  const ttsConfig = useAtomValue(configFields.tts)
  const [playbackState, setPlaybackState] = useAtom(ttsPlaybackStateAtom)
  const [ttsText, setTtsText] = useAtom(ttsTextAtom)
  const [ttsSpeed, setTtsSpeed] = useAtom(ttsSpeedAtom)
  const [ttsVoiceId] = useAtom(ttsVoiceIdAtom)

  /** Ref to track whether the user has started dragging after mousedown. */
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Clamp the button position inside the viewport so it never overflows.
   */
  const clampPosition = useCallback((x: number, y: number, btnWidth: number, btnHeight: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      x: Math.max(VIEWPORT_MARGIN, Math.min(x, vw - btnWidth - VIEWPORT_MARGIN)),
      y: Math.max(VIEWPORT_MARGIN, Math.min(y, vh - btnHeight - VIEWPORT_MARGIN)),
    }
  }, [])

  /**
   * Respond to selection changes: show/hide the floating button.
   */
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()

      if (!sel || sel.isCollapsed) {
        // Schedule hide with a short delay so the user can click the button
        if (dismissTimerRef.current)
          clearTimeout(dismissTimerRef.current)

        dismissTimerRef.current = setTimeout(() => {
          setPos(null)
        }, 200)
        return
      }

      const text = sel.toString().trim()
      if (!text || text.length < 1 || text.length > 2000) {
        setPos(null)
        return
      }

      // Clear any pending dismiss
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // Estimate button bar width (2 icons + padding) ≈ 90px, height ≈ 32px
      const btnWidth = 90
      const btnHeight = 32

      let targetX = rect.right + BUTTON_OFFSET_X
      let targetY = rect.top + BUTTON_OFFSET_Y

      // If the button would overflow the right side, place it on the left
      if (targetX + btnWidth > window.innerWidth - VIEWPORT_MARGIN) {
        targetX = rect.left - btnWidth - BUTTON_OFFSET_X
      }

      const clamped = clampPosition(targetX, targetY, btnWidth, btnHeight)

      setPos({ x: clamped.x, y: clamped.y, text })
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (dismissTimerRef.current)
        clearTimeout(dismissTimerRef.current)
    }
  }, [clampPosition])

  /**
   * Hide the button when the user clicks outside the selection.
   */
  useEffect(() => {
    if (!pos)
      return

    const handleClickOutside = (e: MouseEvent) => {
      // Only dismiss if the click is not on our button (handled by stopPropagation)
      const target = e.target as HTMLElement
      if (target.closest('[data-selection-floating-button]'))
        return

      // Check if the click is far from the selection
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const dx = Math.abs(e.clientX - (rect.left + rect.width / 2))
        const dy = Math.abs(e.clientY - (rect.top + rect.height / 2))
        if (dx < DISMISS_THRESHOLD && dy < DISMISS_THRESHOLD)
          return
      }

      setPos(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pos])

  /**
   * Trigger translation of the selected text via the host content script.
   */
  const handleTranslate = useCallback(() => {
    if (!pos)
      return

    // Dispatch a custom event that the host.content SelectionManager listens for
    const event = new CustomEvent('read-frog:translate-selection', {
      detail: { text: pos.text },
    })
    document.dispatchEvent(event)
    setPos(null)
  }, [pos])

  /**
   * Trigger TTS playback of the selected text.
   */
  const handleSpeak = useCallback(() => {
    if (!pos)
      return

    setTtsText(pos.text)
    setPlaybackState('loading')

    // Dispatch a custom event that the TTS controller listens for
    const event = new CustomEvent('read-frog:speak-selection', {
      detail: {
        text: pos.text,
        speed: ttsSpeed,
        voiceId: ttsVoiceId,
      },
    })
    document.dispatchEvent(event)
    setPos(null)
  }, [pos, ttsSpeed, ttsVoiceId, setTtsText, setPlaybackState])

  if (!pos || !ttsConfig.enabled)
    return null

  return (
    <div
      data-selection-floating-button
      className="fixed z-[2147483647] flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white px-1 py-0.5 shadow-lg transition-opacity duration-150 dark:border-neutral-700 dark:bg-neutral-900"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        animation: 'read-frog-fade-in 0.15s ease-out',
      }}
    >
      {/* Translate button */}
      <button
        type="button"
        title="Translate selection"
        className="flex cursor-pointer items-center justify-center rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-primary dark:text-neutral-400 dark:hover:bg-neutral-800"
        onClick={(e) => {
          e.stopPropagation()
          handleTranslate()
        }}
      >
        <Languages className="h-4 w-4" strokeWidth={1.8} />
      </button>

      {/* TTS button */}
      <button
        type="button"
        title="Read aloud"
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors',
          playbackState === 'playing'
            ? 'text-primary'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary dark:text-neutral-400 dark:hover:bg-neutral-800',
        )}
        onClick={(e) => {
          e.stopPropagation()
          handleSpeak()
        }}
      >
        <Volume2 className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  )
}

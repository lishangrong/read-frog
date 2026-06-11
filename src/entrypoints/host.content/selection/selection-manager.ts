import { ContextExtractor } from './context-extractor'
import { SelectionTranslationPipeline } from './selection-pipeline'
import { SelectionPopup } from './selection-popup'

/** Maximum selection length to trigger translation */
const MAX_SELECTION_LENGTH = 2000

/** Minimum selection length to trigger translation */
const MIN_SELECTION_LENGTH = 1

/** Debounce delay for selection changes */
const DEBOUNCE_MS = 300

/**
 * Manages text selection events and triggers context-aware translation.
 *
 * Listens for mouseup events to detect text selections, extracts
 * article context, translates via the selection pipeline, and
 * displays results in a floating popup.
 *
 * Supports cancellation of in-flight requests when the user
 * changes their selection (via AbortController).
 */
export class SelectionManager {
  private contextExtractor: ContextExtractor
  private pipeline: SelectionTranslationPipeline
  private popup: SelectionPopup
  private abortController: AbortController | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private isInitialized: boolean = false

  constructor() {
    this.contextExtractor = new ContextExtractor()
    this.pipeline = new SelectionTranslationPipeline()
    this.popup = new SelectionPopup()
  }

  /**
   * Initialize the selection manager.
   * Registers event listeners for text selection.
   */
  init(): void {
    if (this.isInitialized)
      return

    this.isInitialized = true
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('keydown', this.onKeyDown)
  }

  /**
   * Destroy the selection manager.
   * Cleans up event listeners and cancels pending requests.
   */
  destroy(): void {
    if (!this.isInitialized)
      return

    this.isInitialized = false
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('keydown', this.onKeyDown)

    this.abortController?.abort()
    this.abortController = null

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.popup.hide()
  }

  /**
   * Handle mouseup event — check for text selection.
   */
  private onMouseUp = (e: MouseEvent): void => {
    // Ignore right-click
    if (e.button === 2)
      return

    // Debounce rapid clicks
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.handleSelection(e)
    }, DEBOUNCE_MS)
  }

  /**
   * Handle keydown — dismiss popup on Escape.
   */
  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.popup.hide()
      this.abortController?.abort()
      this.abortController = null
    }
  }

  /**
   * Process the current text selection.
   */
  private async handleSelection(e: MouseEvent): Promise<void> {
    const selection = window.getSelection()

    // No selection or collapsed (just a cursor)
    if (!selection || selection.isCollapsed) {
      return
    }

    const selectedText = selection.toString().trim()

    // Validate selection
    if (
      !selectedText
      || selectedText.length < MIN_SELECTION_LENGTH
      || selectedText.length > MAX_SELECTION_LENGTH
    ) {
      return
    }

    // Cancel previous in-flight request
    this.abortController?.abort()
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      // Extract context from the page
      const context = this.contextExtractor.extract(
        selection.anchorNode!,
        selection.focusNode!,
        selectedText,
      )

      // Translate with context
      const result = await this.pipeline.translate(context, signal)

      // Check if still valid (not cancelled by new selection)
      if (signal.aborted)
        return

      // Calculate popup position from selection range
      const position = this.getSelectionPosition(selection)
      if (position) {
        this.popup.show(position, result)

        // Trigger TTS preloading for the translated text
        // The TTS engine will pick up this event and preload audio
        const preloadEvent = new CustomEvent('read-frog:tts-preload', {
          detail: {
            text: result.translatedText,
          },
        })
        document.dispatchEvent(preloadEvent)
      }
    }
    catch (error) {
      // Ignore cancellation errors
      if (error instanceof Error && error.message.includes('cancelled')) {
        return
      }
      console.error('Selection translation failed:', error)
    }
  }

  /**
   * Calculate the screen position for the popup based on the selection.
   */
  private getSelectionPosition(selection: Selection): { x: number, y: number } | null {
    const range = selection.getRangeAt(0)
    if (!range)
      return null

    const rect = range.getBoundingClientRect()

    return {
      x: rect.left,
      y: rect.bottom,
    }
  }
}

import type { SelectionTranslationResult } from './selection-pipeline'

/** Offset from the selection position for the popup */
const POPUP_OFFSET_Y = 8
const POPUP_MARGIN = 12
const POPUP_MAX_WIDTH = 400
const POPUP_Z_INDEX = 2147483647

/**
 * Selection popup that displays translation results in a floating panel.
 * Uses shadow DOM for style isolation (following the existing pattern).
 */
export class SelectionPopup {
  private container: HTMLDivElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private dismissHandler: ((e: MouseEvent) => void) | null = null

  /**
   * Show the popup with translation results at the specified position.
   *
   * @param position - { x, y } coordinates near the selection
   * @param result - Translation result to display
   */
  show(position: { x: number, y: number }, result: SelectionTranslationResult): void {
    this.hide() // Remove any existing popup first

    this.container = document.createElement('div')
    this.container.className = 'read-frog-selection-popup-host'
    this.container.style.cssText = `
      position: fixed;
      z-index: ${POPUP_Z_INDEX};
      display: block;
    `

    this.shadowRoot = this.container.attachShadow({ mode: 'open' })

    // Inject styles into shadow DOM
    const style = document.createElement('style')
    style.textContent = this.getStyles()
    this.shadowRoot.appendChild(style)

    // Build popup content
    const popup = this.buildPopupContent(result)
    this.shadowRoot.appendChild(popup)

    // Position the popup
    this.positionPopup(position)

    document.body.appendChild(this.container)

    // Add dismiss handler
    this.dismissHandler = (e: MouseEvent) => {
      if (this.container && !this.container.contains(e.target as Node)) {
        this.hide()
      }
    }
    // Delay to avoid immediate dismissal from the same click
    setTimeout(() => {
      if (this.dismissHandler) {
        document.addEventListener('mousedown', this.dismissHandler)
      }
    }, 100)
  }

  /**
   * Hide and remove the popup.
   */
  hide(): void {
    if (this.dismissHandler) {
      document.removeEventListener('mousedown', this.dismissHandler)
      this.dismissHandler = null
    }

    if (this.container) {
      this.container.remove()
      this.container = null
      this.shadowRoot = null
    }
  }

  /**
   * Reposition the popup to new coordinates.
   */
  reposition(position: { x: number, y: number }): void {
    if (!this.container)
      return
    this.positionPopup(position)
  }

  /**
   * Check if the popup is currently visible.
   */
  isVisible(): boolean {
    return this.container !== null
  }

  /**
   * Build the popup DOM content.
   */
  private buildPopupContent(result: SelectionTranslationResult): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'selection-popup'

    // Header row with translation text and speak button
    const headerRow = document.createElement('div')
    headerRow.className = 'header-row'

    // Translation text
    const translationEl = document.createElement('div')
    translationEl.className = 'translation-text'
    translationEl.textContent = result.translatedText
    headerRow.appendChild(translationEl)

    // Speak button
    const speakBtn = document.createElement('button')
    speakBtn.className = 'speak-button'
    speakBtn.title = 'Read aloud'
    speakBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`
    speakBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      // Dispatch event for TTS engine to speak the translated text
      const event = new CustomEvent('read-frog:speak-selection', {
        detail: { text: result.translatedText },
      })
      document.dispatchEvent(event)
    })
    headerRow.appendChild(speakBtn)

    wrapper.appendChild(headerRow)

    // Explanation (if present — varies by language level)
    if (result.explanation) {
      const divider = document.createElement('hr')
      divider.className = 'divider'
      wrapper.appendChild(divider)

      const explanationEl = document.createElement('div')
      explanationEl.className = 'explanation-text'
      explanationEl.textContent = result.explanation
      wrapper.appendChild(explanationEl)
    }

    // Level badge
    const levelBadge = document.createElement('span')
    levelBadge.className = 'level-badge'
    levelBadge.textContent = result.level
    wrapper.appendChild(levelBadge)

    return wrapper
  }

  /**
   * Position the popup near the selection, keeping it within the viewport.
   */
  private positionPopup(position: { x: number, y: number }): void {
    if (!this.container)
      return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Default: show below and to the right of the selection
    let left = position.x
    let top = position.y + POPUP_OFFSET_Y

    // Ensure popup doesn't overflow right edge
    if (left + POPUP_MAX_WIDTH > viewportWidth - POPUP_MARGIN) {
      left = viewportWidth - POPUP_MAX_WIDTH - POPUP_MARGIN
    }

    // Ensure popup doesn't overflow left edge
    if (left < POPUP_MARGIN) {
      left = POPUP_MARGIN
    }

    // If popup would overflow bottom, show above selection instead
    // (Estimate popup height ~200px; actual height depends on content)
    const estimatedHeight = 200
    if (top + estimatedHeight > viewportHeight - POPUP_MARGIN) {
      top = position.y - estimatedHeight - POPUP_OFFSET_Y
    }

    this.container.style.left = `${left}px`
    this.container.style.top = `${top}px`
    this.container.style.maxWidth = `${POPUP_MAX_WIDTH}px`
  }

  /**
   * Get the CSS styles for the popup (injected into shadow DOM).
   */
  private getStyles(): string {
    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1a1a1a;
      }

      .selection-popup {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        padding: 12px 16px;
        max-width: 400px;
        position: relative;
      }

      .translation-text {
        font-size: 15px;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
        word-break: break-word;
        flex: 1;
      }

      .header-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .speak-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: #f1f5f9;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
      }

      .speak-button:hover {
        background: #e2e8f0;
        color: #1e293b;
      }

      .speak-button:active {
        transform: scale(0.95);
      }

      .divider {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 8px 0;
      }

      .explanation-text {
        font-size: 13px;
        color: #4a5568;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 300px;
        overflow-y: auto;
      }

      .level-badge {
        display: inline-block;
        font-size: 11px;
        color: #718096;
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 1px 6px;
        margin-top: 8px;
        text-transform: capitalize;
      }

      @media (prefers-color-scheme: dark) {
        .selection-popup {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .translation-text {
          color: #f1f5f9;
        }

        .speak-button {
          background: #334155;
          color: #94a3b8;
        }

        .speak-button:hover {
          background: #475569;
          color: #f1f5f9;
        }

        .divider {
          border-top-color: #334155;
        }

        .explanation-text {
          color: #94a3b8;
        }

        .level-badge {
          color: #94a3b8;
          background: #0f172a;
          border-color: #334155;
        }
      }
    `
  }
}

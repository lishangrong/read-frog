import { isEditable } from '@/utils/host/dom/filter'
import { extractSurroundingContext } from '@/utils/host/dom/context-extraction'
import { isHTMLElement, isTextNode } from '@/utils/host/dom/filter'
import { selectionTranslateText } from '@/utils/host/translate/selection-translate-text'
import { showSelectionPopup, dismissSelectionPopup, isPopupActive } from '@/utils/host/translate/selection-popup-manager'
import { globalConfig } from '@/utils/config/config'
import { isPureTranslateProvider } from '@/types/config/provider'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function registerSelectionTranslationTrigger() {
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('keydown', handleKeyDown)
}

function handleMouseUp(e: MouseEvent) {
  // Ignore right-clicks and clicks inside popup
  if (e.button !== 0) return
  if ((e.target as HTMLElement)?.closest?.('.read-frog-selection-popup-host')) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processSelection()
  }, 150)
}

function handleMouseDown(e: MouseEvent) {
  // Dismiss popup when clicking outside of it
  if (isPopupActive() && !(e.target as HTMLElement)?.closest?.('.read-frog-selection-popup-host')) {
    dismissSelectionPopup()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    dismissSelectionPopup()
  }
}

function processSelection() {
  if (!globalConfig) return

  // Selection translation requires LLM provider for detailed output,
  // but also works with pure translate providers (simple translation)
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    return
  }

  const selectedText = selection.toString().trim()
  if (selectedText.length < 2 || selectedText.length > 5000) {
    return
  }

  // Don't trigger in editable elements
  const anchorNode = selection.anchorNode
  if (anchorNode) {
    const element = isHTMLElement(anchorNode) ? anchorNode : anchorNode.parentElement
    if (element && isEditable(element as HTMLElement)) {
      return
    }
  }

  // Don't trigger inside translation wrappers
  const anchorElement = isHTMLElement(anchorNode!) ? anchorNode : anchorNode?.parentElement
  if (anchorElement && (anchorElement as HTMLElement)?.closest?.('.read-frog-translated-content-wrapper')) {
    return
  }

  // Get position from selection range
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  // Extract surrounding context
  const contextNode = anchorNode && (isTextNode(anchorNode) ? anchorNode : anchorNode)
  const context = contextNode ? extractSurroundingContext(contextNode as any) : ''

  // Start translation and show popup
  const translationPromise = selectionTranslateText(selectedText, context)

  showSelectionPopup(
    selectedText,
    { x: rect.left, y: rect.top, bottom: rect.bottom },
    translationPromise,
  )
}

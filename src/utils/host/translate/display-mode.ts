import type { DisplayMode } from '@/types/config/provider'
import { CONTENT_WRAPPER_CLASS, DISPLAY_MODE_ATTRIBUTE } from '@/utils/constants/dom-labels'
import { deepQueryTopLevelSelector } from '../dom/traversal'
import { isHTMLElement } from '../dom/filter'

/**
 * Apply a display mode to all existing translation wrappers without re-translating.
 * Queries all `.read-frog-translated-content-wrapper` elements and updates their
 * `data-read-frog-display-mode` attribute.
 */
export function applyDisplayMode(mode: DisplayMode, root: Document | ShadowRoot = document): void {
  const isWrapper = (node: Node) =>
    isHTMLElement(node) && node.classList.contains(CONTENT_WRAPPER_CLASS)

  const wrappers = deepQueryTopLevelSelector(root, isWrapper)
  for (const wrapper of wrappers) {
    wrapper.setAttribute(DISPLAY_MODE_ATTRIBUTE, mode)
  }
}

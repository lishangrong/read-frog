import type { TransNode } from '@/types/dom'

/**
 * Strategy interface for rendering translated content in different modes.
 *
 * Each strategy controls how the original and translated text are
 * displayed in the DOM. Strategies are stateless — they receive all
 * necessary data through method parameters.
 */
export interface IRenderStrategy {
  /**
   * Render translation for a single node.
   * @param originalNode - The original DOM node (HTMLElement or Text)
   * @param translatedText - The translated text content
   * @param originalText - The original text content (for bilingual/hidden modes)
   * @param ownerDoc - The owner document for creating DOM elements
   * @returns The wrapper element containing the rendered translation
   */
  renderNode(
    originalNode: TransNode,
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement

  /**
   * Render translation for a group of consecutive inline nodes.
   * @param nodes - The group of consecutive inline nodes
   * @param translatedText - The combined translated text
   * @param originalText - The combined original text
   * @param ownerDoc - The owner document for creating DOM elements
   * @returns The wrapper element containing the rendered translation
   */
  renderNodeGroup(
    nodes: TransNode[],
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement

  /**
   * Revert a previously rendered translation back to original state.
   * Removes the wrapper element from the DOM.
   * @param wrapperNode - The wrapper element to revert
   */
  revert(wrapperNode: HTMLElement): void
}

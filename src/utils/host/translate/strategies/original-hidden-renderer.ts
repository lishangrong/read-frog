import type { TransNode } from '@/types/dom'
import {
  BLOCK_CONTENT_CLASS,
  CONTENT_WRAPPER_CLASS,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  ORIGINAL_HIDDEN_CLASS,
  ORIGINAL_TEXT_ATTRIBUTE,
  RENDER_MODE_ATTRIBUTE,
  TRANSLATED_TEXT_ATTRIBUTE,
} from '@/utils/constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '@/utils/constants/dom-tags'
import { isBlockTransNode, isHTMLElement, isInlineTransNode } from '../../dom/filter'
import type { IRenderStrategy } from '../render-strategy'

/**
 * Original-hidden rendering strategy.
 * Hides the original text via CSS and shows only the translation.
 *
 * The original text span is kept in the DOM with `display: none`,
 * enabling instant switch back to bilingual mode without re-translation.
 */
export class OriginalHiddenRenderer implements IRenderStrategy {
  renderNode(
    originalNode: TransNode,
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement {
    const wrapper = this.createWrapper(ownerDoc, originalText, translatedText)
    const isForceInline = isHTMLElement(originalNode)
      && FORCE_INLINE_TRANSLATION_TAGS.has(originalNode.tagName)

    if (isForceInline || isInlineTransNode(originalNode)) {
      this.appendInlineContent(wrapper, ownerDoc, originalText, translatedText)
    }
    else if (isBlockTransNode(originalNode)) {
      this.appendBlockContent(wrapper, ownerDoc, originalText, translatedText)
    }

    return wrapper
  }

  renderNodeGroup(
    _nodes: TransNode[],
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement {
    const wrapper = this.createWrapper(ownerDoc, originalText, translatedText)
    this.appendInlineContent(wrapper, ownerDoc, originalText, translatedText)
    return wrapper
  }

  revert(wrapperNode: HTMLElement): void {
    wrapperNode.remove()
  }

  private createWrapper(
    ownerDoc: Document,
    originalText: string,
    translatedText: string,
  ): HTMLElement {
    const wrapper = ownerDoc.createElement('span')
    wrapper.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    wrapper.setAttribute(RENDER_MODE_ATTRIBUTE, 'originalHidden')
    wrapper.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, originalText)
    wrapper.setAttribute(TRANSLATED_TEXT_ATTRIBUTE, translatedText)
    return wrapper
  }

  private appendInlineContent(
    wrapper: HTMLElement,
    ownerDoc: Document,
    originalText: string,
    translatedText: string,
  ): void {
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    wrapper.appendChild(spaceNode)

    // Hidden original text
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} ${ORIGINAL_HIDDEN_CLASS}`
    originalSpan.textContent = originalText
    originalSpan.style.display = 'none'
    wrapper.appendChild(originalSpan)

    // Visible translation
    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }

  private appendBlockContent(
    wrapper: HTMLElement,
    ownerDoc: Document,
    originalText: string,
    translatedText: string,
  ): void {
    // Hidden original text
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} ${ORIGINAL_HIDDEN_CLASS}`
    originalSpan.textContent = originalText
    originalSpan.style.display = 'none'
    wrapper.appendChild(originalSpan)

    const brNode = ownerDoc.createElement('br')
    wrapper.appendChild(brNode)

    // Visible translation
    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
}

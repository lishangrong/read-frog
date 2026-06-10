import type { TransNode } from '@/types/dom'
import {
  BILINGUAL_WRAPPER_CLASS,
  BLOCK_CONTENT_CLASS,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  ORIGINAL_TEXT_ATTRIBUTE,
  ORIGINAL_TEXT_CLASS,
  RENDER_MODE_ATTRIBUTE,
  TRANSLATED_TEXT_ATTRIBUTE,
  TRANSLATED_TEXT_CLASS,
} from '@/utils/constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '@/utils/constants/dom-tags'
import { isHTMLElement, isInlineTransNode } from '../../dom/filter'
import type { IRenderStrategy } from '../render-strategy'

/**
 * Bilingual rendering strategy.
 * Shows both original text and translation side by side.
 *
 * For inline nodes: [original text] [translation]
 * For block nodes: [original text]<br>[translation]
 */
export class BilingualRenderer implements IRenderStrategy {
  renderNode(
    originalNode: TransNode,
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement {
    const wrapper = this.createWrapper(ownerDoc, originalText, translatedText)
    const isInline = isInlineTransNode(originalNode)
    const isForceInline = isHTMLElement(originalNode)
      && FORCE_INLINE_TRANSLATION_TAGS.has(originalNode.tagName)

    if (isForceInline || isInline) {
      this.appendInlineContent(wrapper, ownerDoc, originalText, translatedText)
    }
    else {
      this.appendBlockContent(wrapper, ownerDoc, originalText, translatedText)
    }

    return wrapper
  }

  renderNodeGroup(
    nodes: TransNode[],
    translatedText: string,
    originalText: string,
    ownerDoc: Document,
  ): HTMLElement {
    const wrapper = this.createWrapper(ownerDoc, originalText, translatedText)
    // Consecutive inline nodes always render as inline
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
    wrapper.className = `${NOTRANSLATE_CLASS} ${BILINGUAL_WRAPPER_CLASS}`
    wrapper.setAttribute(RENDER_MODE_ATTRIBUTE, 'bilingual')
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
    // Space separator between original and translation
    const separator = ownerDoc.createElement('span')
    separator.textContent = '  '
    wrapper.appendChild(separator)

    // Original text span
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} ${ORIGINAL_TEXT_CLASS}`
    originalSpan.textContent = originalText
    wrapper.appendChild(originalSpan)

    // Space between original and translation
    const midSpace = ownerDoc.createElement('span')
    midSpace.textContent = ' '
    wrapper.appendChild(midSpace)

    // Translation span
    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS} ${TRANSLATED_TEXT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }

  private appendBlockContent(
    wrapper: HTMLElement,
    ownerDoc: Document,
    originalText: string,
    translatedText: string,
  ): void {
    // Original text span
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} ${ORIGINAL_TEXT_CLASS}`
    originalSpan.textContent = originalText
    wrapper.appendChild(originalSpan)

    // Line break
    const br = ownerDoc.createElement('br')
    wrapper.appendChild(br)

    // Translation span
    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS} ${TRANSLATED_TEXT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
}

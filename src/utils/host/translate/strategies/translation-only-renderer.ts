import type { TransNode } from '@/types/dom'
import {
  BLOCK_CONTENT_CLASS,
  CONTENT_WRAPPER_CLASS,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  ORIGINAL_TEXT_ATTRIBUTE,
  RENDER_MODE_ATTRIBUTE,
  TRANSLATED_TEXT_ATTRIBUTE,
} from '@/utils/constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '@/utils/constants/dom-tags'
import { isBlockTransNode, isHTMLElement, isInlineTransNode } from '../../dom/filter'
import type { IRenderStrategy } from '../render-strategy'

/**
 * Translation-only rendering strategy.
 * Shows only the translated text, original text is not displayed.
 *
 * This mirrors the existing translateNode behavior.
 */
export class TranslationOnlyRenderer implements IRenderStrategy {
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
      this.appendInlineContent(wrapper, ownerDoc, translatedText)
    }
    else if (isBlockTransNode(originalNode)) {
      this.appendBlockContent(wrapper, ownerDoc, translatedText)
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
    this.appendInlineContent(wrapper, ownerDoc, translatedText)
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
    wrapper.setAttribute(RENDER_MODE_ATTRIBUTE, 'translationOnly')
    wrapper.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, originalText)
    wrapper.setAttribute(TRANSLATED_TEXT_ATTRIBUTE, translatedText)
    return wrapper
  }

  private appendInlineContent(
    wrapper: HTMLElement,
    ownerDoc: Document,
    translatedText: string,
  ): void {
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    wrapper.appendChild(spaceNode)

    const translatedNode = ownerDoc.createElement('span')
    translatedNode.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
    translatedNode.textContent = translatedText
    wrapper.appendChild(translatedNode)
  }

  private appendBlockContent(
    wrapper: HTMLElement,
    ownerDoc: Document,
    translatedText: string,
  ): void {
    const brNode = ownerDoc.createElement('br')
    wrapper.appendChild(brNode)

    const translatedNode = ownerDoc.createElement('span')
    translatedNode.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
    translatedNode.textContent = translatedText
    wrapper.appendChild(translatedNode)
  }
}

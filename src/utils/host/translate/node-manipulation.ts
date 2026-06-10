import type { Point, TransNode } from '@/types/dom'
import React from 'react'
import textSmallCSS from '@/assets/tailwind/text-small.css?inline'
import themeCSS from '@/assets/tailwind/theme.css?inline'
import { TranslationError } from '@/components/tranlation-error'
import { createReactShadowHost, removeReactShadowHost } from '@/utils/react-shadow-host/create-shadow-host'
import { globalConfig } from '../../config/config'
import {
  BLOCK_CONTENT_CLASS,
  CONSECUTIVE_INLINE_END_ATTRIBUTE,
  CONTENT_WRAPPER_CLASS,
  DISPLAY_MODE_ATTRIBUTE,
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  ORIGINAL_CONTENT_CLASS,
  REACT_SHADOW_HOST_CLASS,
  TRANSLATION_ERROR_CONTAINER_CLASS,
} from '../../constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '../../constants/dom-tags'
import { logger } from '../../logger'
import { extractSurroundingContext } from '../dom/context-extraction'
import { isBlockTransNode, isHTMLElement, isInlineTransNode, isTextNode } from '../dom/filter'
import { injectStylesIntoDocument } from '../dom/style'
import {
  deepQueryTopLevelSelector,
  extractTextContent,
  findNearestBlockNodeAt,
  translateWalkedElement,
  unwrapDeepestOnlyHTMLChild,
  walkAndLabelElement,
} from '../dom/traversal'

import { extractTextWithPlaceholders, reinsertPlaceholders } from './html-preservation'
import { sanitizeTranslationHTML } from './html-sanitizer'
import { translateText } from './translate-text'

const translatingNodes = new Set<HTMLElement | Text>()

/**
 * Get the document that owns the given node
 */
function getOwnerDocument(node: Node): Document {
  return node.ownerDocument || document
}

export async function hideOrShowNodeTranslation(point: Point) {
  if (!globalConfig)
    return

  const node = findNearestBlockNodeAt(point)

  if (!node || !isHTMLElement(node) || !node.textContent?.trim())
    return

  const id = crypto.randomUUID()
  walkAndLabelElement(node, id)
  await translateWalkedElement(node, id, true)
}

export async function hideOrShowPageTranslation(toggle: boolean = false) {
  const id = crypto.randomUUID()

  walkAndLabelElement(document.body, id)
  await translateWalkedElement(document.body, id, toggle)
}

export function removeAllTranslatedWrapperNodes(
  root: Document | ShadowRoot = document,
) {
  const isTranslatedWrapperNode = (node: Node) => {
    return isHTMLElement(node) && node.classList.contains(NOTRANSLATE_CLASS) && node.classList.contains(CONTENT_WRAPPER_CLASS)
  }
  const translatedNodes = deepQueryTopLevelSelector(root, isTranslatedWrapperNode)
  translatedNodes.forEach((node) => {
    // Restore original content before removing wrapper
    restoreOriginalContent(node)
    const translationShadowHost = node.querySelector(`.${REACT_SHADOW_HOST_CLASS}`)
    if (translationShadowHost && isHTMLElement(translationShadowHost)) {
      removeReactShadowHost(translationShadowHost)
    }
    node.remove()
  })
}

/**
 * Translate the node
 * @param node - The node to translate
 * @param toggle - Whether to toggle the translation, if true, the translation will be removed if it already exists
 */
export async function translateNode(node: TransNode, toggle: boolean = false, priority?: number) {
  try {
    // prevent duplicate translation
    if (translatingNodes.has(node))
      return
    translatingNodes.add(node)

    const targetNode
      = isHTMLElement(node) ? unwrapDeepestOnlyHTMLChild(node) : node

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      restoreOriginalContent(existedTranslatedWrapper)
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    // Extract text with placeholders for HTML preservation (HTMLElement only)
    let textContent: string
    let placeholders: Map<number, string> | undefined
    if (isHTMLElement(targetNode)) {
      const extracted = extractTextWithPlaceholders(targetNode)
      if (extracted.placeholders.size > 0) {
        textContent = extracted.plainText
        placeholders = extracted.placeholders
      }
      else {
        textContent = extractTextContent(targetNode)
      }
    }
    else {
      textContent = extractTextContent(targetNode)
    }
    if (!textContent)
      return

    // Extract context for context-aware translation
    const context = globalConfig?.translate.page.contextAware
      ? extractSurroundingContext(targetNode)
      : undefined

    // Use the node's owner document instead of main document
    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)

    const displayMode = globalConfig?.translate.page.displayMode || 'bilingual'
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    translatedWrapperNode.setAttribute(DISPLAY_MODE_ATTRIBUTE, displayMode)

    // Wrap original content inside the wrapper for display mode switching
    const originalWrapper = ownerDoc.createElement('span')
    originalWrapper.className = ORIGINAL_CONTENT_CLASS

    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'

    if (isTextNode(targetNode)) {
      // Insert wrapper at text node position, move text node into originalWrapper
      targetNode.parentNode?.insertBefore(translatedWrapperNode, targetNode)
      originalWrapper.appendChild(targetNode)
      translatedWrapperNode.appendChild(originalWrapper)
      translatedWrapperNode.appendChild(spinner)
    }
    else {
      // Move element's children into originalWrapper
      while (targetNode.firstChild) {
        originalWrapper.appendChild(targetNode.firstChild)
      }
      translatedWrapperNode.appendChild(originalWrapper)
      translatedWrapperNode.appendChild(spinner)
      targetNode.appendChild(translatedWrapperNode)
    }

    const translatedText = await getTranslatedTextAndRemoveSpinner(node, textContent, spinner, translatedWrapperNode, context, priority, placeholders)

    if (!translatedText)
      return

    insertTranslatedNodeIntoWrapper(
      translatedWrapperNode,
      targetNode,
      translatedText,
      !!placeholders,
    )
  }
  finally {
    translatingNodes.delete(node)
  }
}

export async function translateConsecutiveInlineNodes(nodes: TransNode[], toggle: boolean = false, priority?: number) {
  try {
    // if translatingNodes has all nodes, return
    if (nodes.every(node => translatingNodes.has(node))) {
      return
    }
    nodes.forEach(node => translatingNodes.add(node))

    const targetNode = nodes[nodes.length - 1]

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      restoreOriginalContent(existedTranslatedWrapper)
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    const textContent = nodes.map(node => extractTextContent(node)).join(' ')
    if (!textContent)
      return

    // Extract context for context-aware translation
    const context = globalConfig?.translate.page.contextAware
      ? extractSurroundingContext(targetNode)
      : undefined

    // Use the node's owner document instead of main document
    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)

    const displayMode = globalConfig?.translate.page.displayMode || 'bilingual'
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    translatedWrapperNode.setAttribute(DISPLAY_MODE_ATTRIBUTE, displayMode)

    // Wrap original nodes inside the wrapper for display mode switching
    const originalWrapper = ownerDoc.createElement('span')
    originalWrapper.className = ORIGINAL_CONTENT_CLASS

    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'

    // Insert wrapper after the last node, then move all nodes into originalWrapper
    targetNode.parentNode?.insertBefore(translatedWrapperNode, targetNode.nextSibling)
    for (const n of nodes) {
      originalWrapper.appendChild(n)
    }
    translatedWrapperNode.insertBefore(originalWrapper, translatedWrapperNode.firstChild)
    translatedWrapperNode.appendChild(spinner)

    const translatedText = await getTranslatedTextAndRemoveSpinner(nodes, textContent, spinner, translatedWrapperNode, context, priority)

    if (!translatedText)
      return

    insertTranslatedNodeIntoWrapper(
      translatedWrapperNode,
      targetNode,
      translatedText,
    )
  }
  catch (error) {
    logger.error(error)
  }
  finally {
    nodes.forEach(node => translatingNodes.delete(node))
  }
}

function findExistedTranslatedWrapper(node: TransNode) {
  if (isTextNode(node) || (isHTMLElement(node) && node.hasAttribute(CONSECUTIVE_INLINE_END_ATTRIBUTE))) {
    // Check if node is inside an original-content wrapper (new structure)
    const parent = node.parentElement
    if (parent?.classList.contains(ORIGINAL_CONTENT_CLASS)) {
      const wrapper = parent.parentElement
      if (wrapper?.classList.contains(CONTENT_WRAPPER_CLASS)) {
        return wrapper
      }
    }
    // Legacy: check next sibling
    if (
      node.nextSibling && isHTMLElement(node.nextSibling)
      && node.nextSibling.classList.contains(NOTRANSLATE_CLASS)
    ) {
      return node.nextSibling
    }
  }
  else if (isHTMLElement(node)) {
    return node.querySelector(`:scope > .${NOTRANSLATE_CLASS}`)
  }
  return null
}

/**
 * Restore original content from a wrapper back to its parent before removal.
 */
function restoreOriginalContent(wrapper: HTMLElement) {
  const originalSpan = wrapper.querySelector(`.${ORIGINAL_CONTENT_CLASS}`)
  if (!originalSpan) return

  const parent = wrapper.parentNode
  if (!parent) return

  // Move original children back before the wrapper
  while (originalSpan.firstChild) {
    parent.insertBefore(originalSpan.firstChild, wrapper)
  }
}

function insertTranslatedNodeIntoWrapper(
  translatedWrapperNode: HTMLElement,
  targetNode: TransNode,
  translatedText: string,
  containsHTML: boolean = false,
) {
  // Use the wrapper's owner document
  const ownerDoc = getOwnerDocument(translatedWrapperNode)
  const translatedNode = ownerDoc.createElement('span')
  const isForceInlineTranslationElement
    = isHTMLElement(targetNode)
      && FORCE_INLINE_TRANSLATION_TAGS.has(targetNode.tagName)

  if (isForceInlineTranslationElement || isInlineTransNode(targetNode)) {
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    translatedWrapperNode.appendChild(spaceNode)
    translatedNode.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
  }
  else if (isBlockTransNode(targetNode)) {
    const brNode = ownerDoc.createElement('br')
    translatedWrapperNode.appendChild(brNode)
    translatedNode.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
  }
  else {
    // not inline or block, maybe notranslate
    return
  }

  if (containsHTML) {
    translatedNode.innerHTML = sanitizeTranslationHTML(translatedText)
  }
  else {
    translatedNode.textContent = translatedText
  }
  translatedWrapperNode.appendChild(translatedNode)
}

async function getTranslatedTextAndRemoveSpinner(
  node: TransNode | TransNode[],
  textContent: string,
  spinner: HTMLElement,
  translatedWrapperNode: HTMLElement,
  context?: string,
  priority?: number,
  placeholders?: Map<number, string>,
) {
  let translatedText: string | undefined
  const hasPlaceholderMarkers = !!placeholders && placeholders.size > 0

  try {
    translatedText = await translateText(textContent, { context, priority, hasPlaceholders: hasPlaceholderMarkers })

    // Reinsert original HTML at placeholder positions
    if (translatedText && hasPlaceholderMarkers) {
      translatedText = reinsertPlaceholders(translatedText, placeholders)
    }
  }
  catch (error) {
    spinner.remove()

    const errorComponent = React.createElement(TranslationError, {
      node,
      error: error as Error,
    })

    const container = createReactShadowHost(
      errorComponent,
      {
        className: TRANSLATION_ERROR_CONTAINER_CLASS,
        position: 'inline',
        inheritStyles: false,
        cssContent: [themeCSS, textSmallCSS],
        style: {
          verticalAlign: 'middle',
        },
      },
    )

    translatedWrapperNode.appendChild(container)
  }
  finally {
    if (spinner.parentNode) {
      spinner.remove()
    }
  }

  return translatedText
}

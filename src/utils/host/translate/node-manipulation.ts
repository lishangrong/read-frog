import type { RenderingMode } from '@/types/config/rendering'
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
  INLINE_CONTENT_CLASS,
  NOTRANSLATE_CLASS,
  ORIGINAL_TEXT_ATTRIBUTE,
  REACT_SHADOW_HOST_CLASS,
  RENDER_MODE_ATTRIBUTE,
  TRANSLATED_TEXT_ATTRIBUTE,
  TRANSLATION_ERROR_CONTAINER_CLASS,
} from '../../constants/dom-labels'
import { FORCE_INLINE_TRANSLATION_TAGS } from '../../constants/dom-tags'
import { logger } from '../../logger'
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
import type { IRenderStrategy } from './render-strategy'
import { createRenderStrategy } from './strategies'

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
    const translationShadowHost = node.querySelector(`.${REACT_SHADOW_HOST_CLASS}`)
    if (translationShadowHost && isHTMLElement(translationShadowHost)) {
      // TODO: test if this works or not
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
export async function translateNode(node: TransNode, toggle: boolean = false) {
  try {
    // prevent duplicate translation
    if (translatingNodes.has(node))
      return
    translatingNodes.add(node)

    const targetNode
      = isHTMLElement(node) ? unwrapDeepestOnlyHTMLChild(node) : node

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    const textContent = extractTextContent(targetNode)
    if (!textContent)
      return

    // Use the node's owner document instead of main document
    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'
    translatedWrapperNode.appendChild(spinner)

    if (isTextNode(targetNode)) {
      targetNode.parentNode?.insertBefore(
        translatedWrapperNode,
        targetNode.nextSibling,
      )
    }
    else {
      targetNode.appendChild(translatedWrapperNode)
    }

    const translatedText = await getTranslatedTextAndRemoveSpinner(node, textContent, spinner, translatedWrapperNode)

    if (!translatedText)
      return

    insertTranslatedNodeIntoWrapper(
      translatedWrapperNode,
      targetNode,
      translatedText,
    )
  }
  finally {
    translatingNodes.delete(node)
  }
}

export async function translateConsecutiveInlineNodes(nodes: TransNode[], toggle: boolean = false) {
  try {
    // if translatingNodes has all nodes, return
    if (nodes.every(node => translatingNodes.has(node))) {
      return
    }
    nodes.forEach(node => translatingNodes.add(node))

    const targetNode = nodes[nodes.length - 1]

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    const textContent = nodes.map(node => extractTextContent(node)).join(' ')
    if (!textContent)
      return

    // Use the node's owner document instead of main document
    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'
    translatedWrapperNode.appendChild(spinner)

    targetNode.parentNode?.insertBefore(
      translatedWrapperNode,
      targetNode.nextSibling,
    )

    const translatedText = await getTranslatedTextAndRemoveSpinner(nodes, textContent, spinner, translatedWrapperNode)

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
  if (isTextNode(node) || node.hasAttribute(CONSECUTIVE_INLINE_END_ATTRIBUTE)) {
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

function insertTranslatedNodeIntoWrapper(
  translatedWrapperNode: HTMLElement,
  targetNode: TransNode,
  translatedText: string,
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

  translatedNode.textContent = translatedText
  translatedWrapperNode.appendChild(translatedNode)
}

async function getTranslatedTextAndRemoveSpinner(node: TransNode | TransNode[], textContent: string, spinner: HTMLElement, translatedWrapperNode: HTMLElement) {
  let translatedText: string | undefined

  try {
    translatedText = await translateText(textContent)
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

/**
 * Translate a single node using a render strategy.
 * The strategy controls how original and translated text are displayed.
 */
export async function translateNodeWithMode(
  node: TransNode,
  strategy: IRenderStrategy,
  toggle: boolean = false,
): Promise<void> {
  try {
    if (translatingNodes.has(node))
      return
    translatingNodes.add(node)

    const targetNode
      = isHTMLElement(node) ? unwrapDeepestOnlyHTMLChild(node) : node

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    const textContent = extractTextContent(targetNode)
    if (!textContent)
      return

    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)

    // Create wrapper with spinner
    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'
    translatedWrapperNode.appendChild(spinner)

    if (isTextNode(targetNode)) {
      targetNode.parentNode?.insertBefore(
        translatedWrapperNode,
        targetNode.nextSibling,
      )
    }
    else {
      targetNode.appendChild(translatedWrapperNode)
    }

    let translatedText: string | undefined
    try {
      translatedText = await translateText(textContent)
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
          style: { verticalAlign: 'middle' },
        },
      )
      translatedWrapperNode.appendChild(container)
      return
    }
    finally {
      if (spinner.parentNode) {
        spinner.remove()
      }
    }

    if (!translatedText)
      return

    // Use strategy to render the translation
    const rendered = strategy.renderNode(targetNode, translatedText, textContent, ownerDoc)
    translatedWrapperNode.replaceWith(rendered)
  }
  finally {
    translatingNodes.delete(node)
  }
}

/**
 * Translate consecutive inline nodes using a render strategy.
 */
export async function translateConsecutiveInlineNodesWithMode(
  nodes: TransNode[],
  strategy: IRenderStrategy,
  toggle: boolean = false,
): Promise<void> {
  try {
    if (nodes.every(node => translatingNodes.has(node))) {
      return
    }
    nodes.forEach(node => translatingNodes.add(node))

    const targetNode = nodes[nodes.length - 1]

    const existedTranslatedWrapper = findExistedTranslatedWrapper(targetNode)
    if (existedTranslatedWrapper) {
      existedTranslatedWrapper.remove()
      if (toggle) {
        return
      }
    }

    const textContent = nodes.map(node => extractTextContent(node)).join(' ')
    if (!textContent)
      return

    const ownerDoc = getOwnerDocument(targetNode)
    injectStylesIntoDocument(ownerDoc)

    const translatedWrapperNode = ownerDoc.createElement('span')
    translatedWrapperNode.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    const spinner = ownerDoc.createElement('span')
    spinner.className = 'read-frog-spinner'
    translatedWrapperNode.appendChild(spinner)

    targetNode.parentNode?.insertBefore(
      translatedWrapperNode,
      targetNode.nextSibling,
    )

    let translatedText: string | undefined
    try {
      translatedText = await translateText(textContent)
    }
    catch (error) {
      spinner.remove()
      const errorComponent = React.createElement(TranslationError, {
        node: nodes,
        error: error as Error,
      })
      const container = createReactShadowHost(
        errorComponent,
        {
          className: TRANSLATION_ERROR_CONTAINER_CLASS,
          position: 'inline',
          inheritStyles: false,
          cssContent: [themeCSS, textSmallCSS],
          style: { verticalAlign: 'middle' },
        },
      )
      translatedWrapperNode.appendChild(container)
      return
    }
    finally {
      if (spinner.parentNode) {
        spinner.remove()
      }
    }

    if (!translatedText)
      return

    const originalText = textContent
    const rendered = strategy.renderNodeGroup(nodes, translatedText, originalText, ownerDoc)
    translatedWrapperNode.replaceWith(rendered)
  }
  catch (error) {
    logger.error(error)
  }
  finally {
    nodes.forEach(node => translatingNodes.delete(node))
  }
}

/**
 * Switch the rendering mode for all currently translated nodes on the page.
 * Re-renders existing translations using the new strategy without re-calling the API.
 * Uses original and translated text stored in data attributes.
 */
export function switchRenderingMode(newMode: RenderingMode): void {
  const newStrategy = createRenderStrategy(newMode)

  // Find all translated wrapper elements that have render mode info
  const wrappers = deepQueryTopLevelSelector(
    document,
    (el) => isHTMLElement(el) && el.classList.contains(CONTENT_WRAPPER_CLASS)
      && el.hasAttribute(RENDER_MODE_ATTRIBUTE),
  )

  wrappers.forEach((wrapper) => {
    const originalText = wrapper.getAttribute(ORIGINAL_TEXT_ATTRIBUTE)
    const translatedText = wrapper.getAttribute(TRANSLATED_TEXT_ATTRIBUTE)
    const parentNode = wrapper.parentNode

    if (!originalText || !translatedText || !parentNode)
      return

    const ownerDoc = wrapper.ownerDocument || document

    // Determine if this was inline or block based on content classes
    const hasBlockContent = wrapper.querySelector(`.${BLOCK_CONTENT_CLASS}`) !== null

    // Build new wrapper content based on new mode
    const newWrapper = ownerDoc.createElement('span')
    newWrapper.className = `${NOTRANSLATE_CLASS} ${CONTENT_WRAPPER_CLASS}`
    newWrapper.setAttribute(RENDER_MODE_ATTRIBUTE, newMode)
    newWrapper.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, originalText)
    newWrapper.setAttribute(TRANSLATED_TEXT_ATTRIBUTE, translatedText)

    if (hasBlockContent) {
      appendBlockBilingualContent(newWrapper, ownerDoc, originalText, translatedText, newMode)
    }
    else {
      appendInlineBilingualContent(newWrapper, ownerDoc, originalText, translatedText, newMode)
    }

    // Swap in-place
    parentNode.replaceChild(newWrapper, wrapper)
  })
}

function appendInlineBilingualContent(
  wrapper: HTMLElement,
  ownerDoc: Document,
  originalText: string,
  translatedText: string,
  mode: RenderingMode,
): void {
  if (mode === 'bilingual') {
    const separator = ownerDoc.createElement('span')
    separator.textContent = '  '
    wrapper.appendChild(separator)

    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} read-frog-original-text`
    originalSpan.textContent = originalText
    wrapper.appendChild(originalSpan)

    const midSpace = ownerDoc.createElement('span')
    midSpace.textContent = ' '
    wrapper.appendChild(midSpace)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS} read-frog-translated-text`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
  else if (mode === 'translationOnly') {
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    wrapper.appendChild(spaceNode)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
  else {
    // originalHidden
    const spaceNode = ownerDoc.createElement('span')
    spaceNode.textContent = '  '
    wrapper.appendChild(spaceNode)

    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} read-frog-original-hidden`
    originalSpan.textContent = originalText
    originalSpan.style.display = 'none'
    wrapper.appendChild(originalSpan)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${INLINE_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
}

function appendBlockBilingualContent(
  wrapper: HTMLElement,
  ownerDoc: Document,
  originalText: string,
  translatedText: string,
  mode: RenderingMode,
): void {
  if (mode === 'bilingual') {
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} read-frog-original-text`
    originalSpan.textContent = originalText
    wrapper.appendChild(originalSpan)

    const br = ownerDoc.createElement('br')
    wrapper.appendChild(br)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS} read-frog-translated-text`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
  else if (mode === 'translationOnly') {
    const brNode = ownerDoc.createElement('br')
    wrapper.appendChild(brNode)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
  else {
    // originalHidden
    const originalSpan = ownerDoc.createElement('span')
    originalSpan.className = `${NOTRANSLATE_CLASS} read-frog-original-hidden`
    originalSpan.textContent = originalText
    originalSpan.style.display = 'none'
    wrapper.appendChild(originalSpan)

    const brNode = ownerDoc.createElement('br')
    wrapper.appendChild(brNode)

    const translatedSpan = ownerDoc.createElement('span')
    translatedSpan.className = `${NOTRANSLATE_CLASS} ${BLOCK_CONTENT_CLASS}`
    translatedSpan.textContent = translatedText
    wrapper.appendChild(translatedSpan)
  }
}

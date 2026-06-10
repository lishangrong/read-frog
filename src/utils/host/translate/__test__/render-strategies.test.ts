/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { BilingualRenderer } from '../strategies/bilingual-renderer'
import { OriginalHiddenRenderer } from '../strategies/original-hidden-renderer'
import { TranslationOnlyRenderer } from '../strategies/translation-only-renderer'
import { createRenderStrategy } from '../strategies'

describe('render strategies', () => {
  describe('createRenderStrategy', () => {
    it('creates bilingual renderer for bilingual mode', () => {
      const strategy = createRenderStrategy('bilingual')
      expect(strategy).toBeInstanceOf(BilingualRenderer)
    })

    it('creates translation-only renderer for translationOnly mode', () => {
      const strategy = createRenderStrategy('translationOnly')
      expect(strategy).toBeInstanceOf(TranslationOnlyRenderer)
    })

    it('creates original-hidden renderer for originalHidden mode', () => {
      const strategy = createRenderStrategy('originalHidden')
      expect(strategy).toBeInstanceOf(OriginalHiddenRenderer)
    })

    it('defaults to bilingual for unknown mode', () => {
      const strategy = createRenderStrategy('unknown' as any)
      expect(strategy).toBeInstanceOf(BilingualRenderer)
    })
  })

  describe('BilingualRenderer', () => {
    const renderer = new BilingualRenderer()

    it('renders inline node with original and translation', () => {
      const textNode = document.createTextNode('Hello world')
      const result = renderer.renderNode(textNode, '你好世界', 'Hello world', document)

      expect(result.getAttribute('data-rf-render-mode')).toBe('bilingual')
      expect(result.getAttribute('data-rf-original')).toBe('Hello world')
      expect(result.getAttribute('data-rf-translated')).toBe('你好世界')

      // Should contain original text span and translation span
      const spans = result.querySelectorAll('span')
      const texts = Array.from(spans).map(s => s.textContent)
      expect(texts).toContain('Hello world')
      expect(texts).toContain('你好世界')
    })

    it('renders block node with original above and translation below', () => {
      const div = document.createElement('div')
      div.style.display = 'block'
      div.textContent = 'Hello world'

      // Add to DOM so getComputedStyle works
      document.body.appendChild(div)

      const result = renderer.renderNode(div, '你好世界', 'Hello world', document)

      // Should have a <br> separating original and translation
      const br = result.querySelector('br')
      expect(br).not.toBeNull()

      document.body.removeChild(div)
    })

    it('revert removes the wrapper element', () => {
      const wrapper = document.createElement('span')
      wrapper.setAttribute('data-rf-render-mode', 'bilingual')
      document.body.appendChild(wrapper)

      renderer.revert(wrapper)
      expect(document.body.contains(wrapper)).toBe(false)
    })

    it('renderNodeGroup creates inline bilingual wrapper', () => {
      const node1 = document.createTextNode('Hello ')
      const node2 = document.createTextNode('world')
      const result = renderer.renderNodeGroup(
        [node1, node2],
        '你好世界',
        'Hello world',
        document,
      )

      expect(result.getAttribute('data-rf-render-mode')).toBe('bilingual')
      expect(result.getAttribute('data-rf-original')).toBe('Hello world')
    })
  })

  describe('TranslationOnlyRenderer', () => {
    const renderer = new TranslationOnlyRenderer()

    it('renders only translated text for inline node', () => {
      const textNode = document.createTextNode('Hello world')
      const result = renderer.renderNode(textNode, '你好世界', 'Hello world', document)

      expect(result.getAttribute('data-rf-render-mode')).toBe('translationOnly')
      expect(result.getAttribute('data-rf-original')).toBe('Hello world')
      expect(result.getAttribute('data-rf-translated')).toBe('你好世界')

      // Should NOT contain original text as visible element
      expect(result.textContent).toContain('你好世界')
    })

    it('renderNodeGroup creates translation-only wrapper', () => {
      const nodes = [document.createTextNode('Hello '), document.createTextNode('world')]
      const result = renderer.renderNodeGroup(nodes, '你好世界', 'Hello world', document)

      expect(result.getAttribute('data-rf-render-mode')).toBe('translationOnly')
    })
  })

  describe('OriginalHiddenRenderer', () => {
    const renderer = new OriginalHiddenRenderer()

    it('renders with hidden original text', () => {
      const textNode = document.createTextNode('Hello world')
      const result = renderer.renderNode(textNode, '你好世界', 'Hello world', document)

      expect(result.getAttribute('data-rf-render-mode')).toBe('originalHidden')

      // Find the hidden original text span
      const hiddenSpan = result.querySelector('.read-frog-original-hidden') as HTMLElement
      expect(hiddenSpan).not.toBeNull()
      expect(hiddenSpan.style.display).toBe('none')
      expect(hiddenSpan.textContent).toBe('Hello world')
    })

    it('shows translated text visibly', () => {
      const textNode = document.createTextNode('Hello world')
      const result = renderer.renderNode(textNode, '你好世界', 'Hello world', document)

      // Find visible translation span
      const translationSpan = result.querySelector('.read-frog-translated-inline-content')
      expect(translationSpan).not.toBeNull()
      expect(translationSpan?.textContent).toBe('你好世界')
    })
  })
})

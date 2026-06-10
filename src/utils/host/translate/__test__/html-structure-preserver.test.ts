/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { HTMLStructurePreserver } from '../html-structure-preserver'

describe('HTMLStructurePreserver', () => {
  describe('extractStructure', () => {
    it('extracts structure from plain text (no tags)', () => {
      const result = HTMLStructurePreserver.extractStructure('Hello world')
      expect(result.tagCount).toBe(0)
      expect(result.plainText).toBe('Hello world')
      expect(result.tagPositions).toHaveLength(0)
    })

    it('extracts bold tag positions', () => {
      const result = HTMLStructurePreserver.extractStructure('Hello <b>beautiful</b> world')
      expect(result.tagCount).toBe(1)
      expect(result.plainText).toBe('Hello beautiful world')

      const openTag = result.tagPositions.find(t => !t.isClosing)
      const closeTag = result.tagPositions.find(t => t.isClosing)

      expect(openTag?.tagName).toBe('b')
      expect(closeTag?.tagName).toBe('b')
      expect(openTag?.pairIndex).toBe(closeTag?.pairIndex)
    })

    it('extracts nested inline tags', () => {
      const result = HTMLStructurePreserver.extractStructure('Hello <em><b>world</b></em>')
      expect(result.tagCount).toBe(2)
      expect(result.plainText).toBe('Hello world')

      const tagNames = result.tagPositions.filter(t => !t.isClosing).map(t => t.tagName)
      expect(tagNames).toContain('em')
      expect(tagNames).toContain('b')
    })

    it('extracts link attributes', () => {
      const result = HTMLStructurePreserver.extractStructure('Click <a href="https://example.com">here</a> please')
      expect(result.tagCount).toBe(1)

      const openTag = result.tagPositions.find(t => !t.isClosing)
      expect(openTag?.tagName).toBe('a')
      expect(openTag?.attributes?.href).toBe('https://example.com')
    })

    it('ignores non-inline tags', () => {
      const result = HTMLStructurePreserver.extractStructure('<div>Hello</div> <span>world</span>')
      // div is not preserved, span is
      const tagNames = result.tagPositions.filter(t => !t.isClosing).map(t => t.tagName)
      expect(tagNames).not.toContain('div')
      expect(tagNames).toContain('span')
    })
  })

  describe('applyStructure', () => {
    it('returns plain text when no tags in original', () => {
      const structureMap = {
        tagPositions: [],
        plainText: 'Hello world',
        tagCount: 0,
      }

      const result = HTMLStructurePreserver.applyStructure('你好世界', structureMap)
      expect(result.html).toBe('你好世界')
      expect(result.degraded).toBe(false)
    })

    it('applies bold tag to translated text', () => {
      const structureMap = HTMLStructurePreserver.extractStructure('Hello <b>beautiful</b> world')
      const result = HTMLStructurePreserver.applyStructure('你好 美丽 世界', structureMap)

      expect(result.degraded).toBe(false)
      expect(result.html).toContain('<b>')
      expect(result.html).toContain('</b>')
    })

    it('preserves link href in translated text', () => {
      const structureMap = HTMLStructurePreserver.extractStructure('Click <a href="https://example.com">here</a> please')
      const result = HTMLStructurePreserver.applyStructure('点击 这里 请', structureMap)

      expect(result.degraded).toBe(false)
      expect(result.html).toContain('href="https://example.com"')
    })

    it('handles empty translated text gracefully', () => {
      const structureMap = HTMLStructurePreserver.extractStructure('Hello <b>world</b>')
      const result = HTMLStructurePreserver.applyStructure('', structureMap)

      // Should still produce valid output (even if degraded)
      expect(result.html).toBeDefined()
    })
  })

  describe('validate', () => {
    it('validates correct tag count', () => {
      expect(HTMLStructurePreserver.validate('Hello <b>world</b>', 1)).toBe(true)
    })

    it('detects mismatched tag count', () => {
      expect(HTMLStructurePreserver.validate('Hello world', 1)).toBe(false)
      expect(HTMLStructurePreserver.validate('Hello <b>world</b>', 2)).toBe(false)
    })

    it('validates multiple tags', () => {
      expect(HTMLStructurePreserver.validate('<b>Hello</b> <em>world</em>', 2)).toBe(true)
    })
  })
})

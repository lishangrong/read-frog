import { describe, expect, it } from 'vitest'
import { getLevelInstructions, buildContextAwarePrompt } from '../../selection/level-adaptation'

describe('level-adaptation', () => {
  describe('getLevelInstructions', () => {
    it('returns detailed instructions for beginner', () => {
      const instructions = getLevelInstructions('beginner')
      expect(instructions.explanationDetail).toBe('detailed')
      expect(instructions.includeGrammarNotes).toBe(true)
      expect(instructions.includePronunciation).toBe(true)
      expect(instructions.vocabularyDepth).toBe('comprehensive')
    })

    it('returns moderate instructions for intermediate', () => {
      const instructions = getLevelInstructions('intermediate')
      expect(instructions.explanationDetail).toBe('moderate')
      expect(instructions.includeGrammarNotes).toBe(true)
      expect(instructions.includePronunciation).toBe(false)
      expect(instructions.vocabularyDepth).toBe('intermediate')
    })

    it('returns minimal instructions for advanced', () => {
      const instructions = getLevelInstructions('advanced')
      expect(instructions.explanationDetail).toBe('minimal')
      expect(instructions.includeGrammarNotes).toBe(false)
      expect(instructions.includePronunciation).toBe(false)
      expect(instructions.vocabularyDepth).toBe('basic')
    })
  })

  describe('buildContextAwarePrompt', () => {
    it('includes article title in prompt', () => {
      const prompt = buildContextAwarePrompt(
        'Chinese',
        'Hello world',
        {
          articleTitle: 'Test Article',
          sectionHeading: null,
          surroundingParagraph: 'Some context paragraph',
        },
        'intermediate',
      )

      expect(prompt).toContain('Test Article')
      expect(prompt).toContain('Hello world')
      expect(prompt).toContain('Chinese')
    })

    it('includes section heading when present', () => {
      const prompt = buildContextAwarePrompt(
        'Chinese',
        'Hello world',
        {
          articleTitle: null,
          sectionHeading: 'Introduction',
          surroundingParagraph: 'Context',
        },
        'beginner',
      )

      expect(prompt).toContain('Introduction')
      expect(prompt).toContain('beginner')
    })

    it('does not include surrounding paragraph when same as selected text', () => {
      const prompt = buildContextAwarePrompt(
        'Chinese',
        'Hello world',
        {
          articleTitle: null,
          sectionHeading: null,
          surroundingParagraph: 'Hello world',
        },
        'advanced',
      )

      // Should not have "Surrounding context" section when same as selected
      expect(prompt).not.toContain('Surrounding context')
    })

    it('includes surrounding context when different from selected text', () => {
      const prompt = buildContextAwarePrompt(
        'Chinese',
        'Hello world',
        {
          articleTitle: null,
          sectionHeading: null,
          surroundingParagraph: 'This is a longer paragraph that contains hello world and more context',
        },
        'intermediate',
      )

      expect(prompt).toContain('Surrounding context')
    })

    it('works with no context available', () => {
      const prompt = buildContextAwarePrompt(
        'Japanese',
        'Hello world',
        {
          articleTitle: null,
          sectionHeading: null,
          surroundingParagraph: '',
        },
        'intermediate',
      )

      expect(prompt).toContain('Hello world')
      expect(prompt).toContain('Japanese')
      expect(prompt).not.toContain('Context for accurate translation')
    })
  })
})

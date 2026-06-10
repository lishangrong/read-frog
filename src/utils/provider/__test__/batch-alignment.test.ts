import { describe, expect, it } from 'vitest'
import { BatchAlignmentError, BatchAlignmentVerifier } from '../batch-alignment'

describe('BatchAlignmentVerifier', () => {
  describe('verify', () => {
    it('verifies matching input/output counts', () => {
      const inputs = ['Hello', 'World']
      const outputs = ['Hola', 'Mundo']
      const result = BatchAlignmentVerifier.verify(inputs, outputs)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ input: 'Hello', output: 'Hola' })
      expect(result[1]).toEqual({ input: 'World', output: 'Mundo' })
    })

    it('throws on count mismatch (too few outputs)', () => {
      const inputs = ['Hello', 'World', 'Foo']
      const outputs = ['Hola', 'Mundo']

      expect(() => BatchAlignmentVerifier.verify(inputs, outputs))
        .toThrow(BatchAlignmentError)
    })

    it('throws on count mismatch (too many outputs)', () => {
      const inputs = ['Hello']
      const outputs = ['Hola', 'Mundo']

      expect(() => BatchAlignmentVerifier.verify(inputs, outputs))
        .toThrow(BatchAlignmentError)
    })

    it('throws on empty output for non-empty input', () => {
      const inputs = ['Hello', 'World']
      const outputs = ['Hola', '']

      expect(() => BatchAlignmentVerifier.verify(inputs, outputs))
        .toThrow(BatchAlignmentError)
    })

    it('allows empty output for empty input', () => {
      const inputs = ['', 'World']
      const outputs = ['', 'Mundo']
      const result = BatchAlignmentVerifier.verify(inputs, outputs)
      expect(result).toHaveLength(2)
    })

    it('preserves number values in translation', () => {
      const inputs = ['The year 2024 was significant']
      const outputs = ['El año 2024 fue significativo']
      const result = BatchAlignmentVerifier.verify(inputs, outputs)
      expect(result[0].output).toContain('2024')
    })

    it('handles single item batch', () => {
      const inputs = ['Hello world']
      const outputs = ['Hola mundo']
      const result = BatchAlignmentVerifier.verify(inputs, outputs)
      expect(result).toHaveLength(1)
    })
  })

  describe('BatchAlignmentError', () => {
    it('stores expected and actual counts', () => {
      const error = new BatchAlignmentError('test', 3, 2)
      expect(error.expectedCount).toBe(3)
      expect(error.actualCount).toBe(2)
      expect(error.name).toBe('BatchAlignmentError')
    })
  })
})

/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { RequestQueue, TranslationPriority } from '../request-queue'

describe('RequestQueue priority and cancellation', () => {
  function createQueue() {
    return new RequestQueue({
      rate: 100, // high rate so tokens aren't limiting
      capacity: 100,
      timeoutMs: 5000,
      maxRetries: 0,
      baseRetryDelayMs: 100,
    })
  }

  describe('priority ordering', () => {
    it('higher priority value means lower priority in queue', () => {
      // CRITICAL (0) < HIGH (100) < NORMAL (500) < LOW (1000)
      // Lower values are dequeued first by BinaryHeapPQ
      expect(TranslationPriority.CRITICAL).toBeLessThan(TranslationPriority.HIGH)
      expect(TranslationPriority.HIGH).toBeLessThan(TranslationPriority.NORMAL)
      expect(TranslationPriority.NORMAL).toBeLessThan(TranslationPriority.LOW)
    })

    it('accepts priority parameter in enqueue', async () => {
      const queue = createQueue()

      const result = await queue.enqueue(
        async () => 42,
        Date.now(),
        'test',
        { priority: TranslationPriority.HIGH },
      )

      expect(result).toBe(42)
    })
  })

  describe('AbortSignal cancellation', () => {
    it('cancels pending task via AbortSignal', async () => {
      const queue = new RequestQueue({
        rate: 0.001,
        capacity: 1,
        timeoutMs: 5000,
        maxRetries: 0,
        baseRetryDelayMs: 100,
      })

      const controller = new AbortController()

      // Use the only token
      await queue.enqueue(async () => {}, Date.now(), 'blocker')

      // Queue a task with abort signal
      const taskPromise = queue.enqueue(
        async () => 'should not execute',
        Date.now(),
        'cancellable',
        { signal: controller.signal },
      )

      // Abort before it starts executing
      controller.abort()

      await expect(taskPromise).rejects.toThrow('cancelled')
    })

    it('rejects immediately if signal already aborted', async () => {
      const queue = createQueue()
      const controller = new AbortController()
      controller.abort()

      const taskPromise = queue.enqueue(
        async () => 'should not execute',
        Date.now(),
        'pre-aborted',
        { signal: controller.signal },
      )

      await expect(taskPromise).rejects.toThrow('cancelled')
    })

    it('executes normally when signal is not aborted', async () => {
      const queue = createQueue()
      const controller = new AbortController()

      const result = await queue.enqueue(
        async () => 'success',
        Date.now(),
        'normal',
        { signal: controller.signal },
      )

      expect(result).toBe('success')
    })
  })

  describe('TranslationPriority enum', () => {
    it('has correct priority ordering', () => {
      expect(TranslationPriority.CRITICAL).toBeLessThan(TranslationPriority.HIGH)
      expect(TranslationPriority.HIGH).toBeLessThan(TranslationPriority.NORMAL)
      expect(TranslationPriority.NORMAL).toBeLessThan(TranslationPriority.LOW)
    })

    it('has expected values', () => {
      expect(TranslationPriority.CRITICAL).toBe(0)
      expect(TranslationPriority.HIGH).toBe(100)
      expect(TranslationPriority.NORMAL).toBe(500)
      expect(TranslationPriority.LOW).toBe(1000)
    })
  })
})

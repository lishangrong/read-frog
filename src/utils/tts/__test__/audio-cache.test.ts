import { describe, expect, it } from 'vitest'
import { TtsAudioCache } from '../audio-cache'

describe('TtsAudioCache', () => {
  it('should store and retrieve entries', () => {
    const cache = new TtsAudioCache()
    cache.set('key1', 'audiodata1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.get('key1')).toBe('audiodata1')
  })

  it('should return undefined for missing entries', () => {
    const cache = new TtsAudioCache()
    expect(cache.has('missing')).toBe(false)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('should evict oldest entry when at max entries', () => {
    const cache = new TtsAudioCache({ maxEntries: 3 })
    cache.set('key1', 'data1')
    cache.set('key2', 'data2')
    cache.set('key3', 'data3')
    // Cache is full, adding key4 should evict key1
    cache.set('key4', 'data4')
    expect(cache.has('key1')).toBe(false)
    expect(cache.has('key2')).toBe(true)
    expect(cache.has('key4')).toBe(true)
  })

  it('should refresh LRU position on get', () => {
    const cache = new TtsAudioCache({ maxEntries: 3 })
    cache.set('key1', 'data1')
    cache.set('key2', 'data2')
    cache.set('key3', 'data3')
    // Access key1 to refresh its position
    cache.get('key1')
    // Now key2 is the oldest; adding key4 should evict key2
    cache.set('key4', 'data4')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(false)
  })

  it('should evict entries when exceeding memory limit', () => {
    const cache = new TtsAudioCache({ maxEntries: 100, maxMemoryBytes: 20 })
    cache.set('key1', 'aaaaaaaaaa') // 10 bytes
    cache.set('key2', 'bbbbbbbbbb') // 10 bytes
    expect(cache.stats.entries).toBe(2)
    // Adding 15 bytes should evict key1 to make room
    cache.set('key3', 'ccccccccccccccc') // 15 bytes
    expect(cache.has('key1')).toBe(false)
    expect(cache.has('key2')).toBe(true)
    expect(cache.has('key3')).toBe(true)
  })

  it('should update existing entry without duplicating', () => {
    const cache = new TtsAudioCache()
    cache.set('key1', 'olddata')
    cache.set('key1', 'newdata')
    expect(cache.get('key1')).toBe('newdata')
    expect(cache.stats.entries).toBe(1)
  })

  it('should clear all entries', () => {
    const cache = new TtsAudioCache()
    cache.set('key1', 'data1')
    cache.set('key2', 'data2')
    cache.clear()
    expect(cache.stats.entries).toBe(0)
    expect(cache.stats.memoryBytes).toBe(0)
    expect(cache.has('key1')).toBe(false)
  })

  it('should report correct stats', () => {
    const cache = new TtsAudioCache()
    expect(cache.stats.entries).toBe(0)
    expect(cache.stats.memoryBytes).toBe(0)

    cache.set('key1', 'hello') // 5 chars
    expect(cache.stats.entries).toBe(1)
    expect(cache.stats.memoryBytes).toBe(5)

    cache.set('key2', 'world!') // 6 chars
    expect(cache.stats.entries).toBe(2)
    expect(cache.stats.memoryBytes).toBe(11)
  })

  it('should build unique keys for different parameters', () => {
    const cache = new TtsAudioCache()
    const key1 = cache.buildKey('hello', 'alloy', 1)
    const key2 = cache.buildKey('hello', 'alloy', 1.5)
    const key3 = cache.buildKey('hello', 'nova', 1)
    const key4 = cache.buildKey('world', 'alloy', 1)

    expect(key1).not.toBe(key2)
    expect(key1).not.toBe(key3)
    expect(key1).not.toBe(key4)
  })
})

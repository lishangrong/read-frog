export enum TranslationPriority {
  /** Highest: user clicked/hotkey, selection translation */
  USER_TRIGGERED = 0,
  /** Auto-page-translate for visible viewport elements */
  VISIBLE_AUTO = 1,
  /** Auto-page-translate for elements within rootMargin but not visible */
  PRELOAD_AUTO = 2,
  /** Lowest: off-screen elements */
  BACKGROUND_AUTO = 3,
}

export function computePriority(source: 'user' | 'page', element?: HTMLElement): number {
  if (source === 'user') {
    return TranslationPriority.USER_TRIGGERED
  }

  if (!element) {
    return TranslationPriority.VISIBLE_AUTO
  }

  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  // Fully off-screen
  if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) {
    return TranslationPriority.BACKGROUND_AUTO
  }

  // At least partially visible in viewport
  if (rect.top < viewportHeight && rect.bottom > 0) {
    return TranslationPriority.VISIBLE_AUTO
  }

  return TranslationPriority.PRELOAD_AUTO
}

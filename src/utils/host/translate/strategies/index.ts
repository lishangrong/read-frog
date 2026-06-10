import type { RenderingMode } from '@/types/config/rendering'
import type { IRenderStrategy } from '../render-strategy'
import { BilingualRenderer } from './bilingual-renderer'
import { OriginalHiddenRenderer } from './original-hidden-renderer'
import { TranslationOnlyRenderer } from './translation-only-renderer'

/**
 * Factory function to create a render strategy based on the rendering mode.
 */
export function createRenderStrategy(mode: RenderingMode): IRenderStrategy {
  switch (mode) {
    case 'bilingual':
      return new BilingualRenderer()
    case 'translationOnly':
      return new TranslationOnlyRenderer()
    case 'originalHidden':
      return new OriginalHiddenRenderer()
    default:
      return new BilingualRenderer()
  }
}

export { BilingualRenderer } from './bilingual-renderer'
export { OriginalHiddenRenderer } from './original-hidden-renderer'
export { TranslationOnlyRenderer } from './translation-only-renderer'

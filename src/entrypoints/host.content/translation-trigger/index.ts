import { registerNodeTranslationTriggers } from './node-translation'
import { registerSelectionTranslationTrigger } from './selection-translation'

export function registerTranslationTriggers() {
  registerNodeTranslationTriggers()
  registerSelectionTranslationTrigger()
}

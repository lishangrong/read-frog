import type { SubtitleCue } from '@/utils/host/subtitle/detector'
import type { SubtitleDisplayMode } from '@/types/config/subtitle'
import LoadingDots from '@/components/loading-dots'

interface SubtitleOverlayProps {
  originalCues: SubtitleCue[]
  translatedTexts: string[]
  displayMode: SubtitleDisplayMode
  fontSize: number
  opacity: number
}

export function SubtitleOverlay({
  originalCues,
  translatedTexts,
  displayMode,
  fontSize,
  opacity,
}: SubtitleOverlayProps) {
  if (displayMode === 'off' || originalCues.length === 0) {
    return null
  }

  const originalText = originalCues.map(c => c.text).join(' ')
  const translatedText = translatedTexts.join(' ')
  const isLoading = translatedTexts.length === 0 && originalCues.length > 0

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg px-4 py-2"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        fontSize: `${fontSize}px`,
        lineHeight: 1.4,
      }}
    >
      {/* Original subtitle */}
      {displayMode === 'bilingual' && (
        <div className="text-center text-white/80" style={{ fontSize: `${fontSize * 0.85}px` }}>
          {originalText}
        </div>
      )}

      {/* Translated subtitle */}
      <div className="text-center font-medium text-white">
        {isLoading
          ? <LoadingDots />
          : translatedText || originalText}
      </div>
    </div>
  )
}

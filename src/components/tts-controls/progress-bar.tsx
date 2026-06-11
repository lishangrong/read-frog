import { useCallback } from 'react'
import { getAudioController } from '@/utils/tts/audio-controller'

interface ProgressBarProps {
  current: number
  total: number
}

/**
 * Clickable TTS progress bar showing current segment out of total.
 * Clicking on the bar seeks to the corresponding segment.
 */
export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (total <= 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = x / rect.width
      const targetSegment = Math.floor(ratio * total)
      const controller = getAudioController()
      controller.skipToSegment(targetSegment)
    },
    [total],
  )

  return (
    <div className="flex flex-col gap-1">
      {/* Progress bar */}
      <div
        className="h-1.5 w-full cursor-pointer rounded-full bg-muted"
        onClick={handleClick}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Segment indicator */}
      {total > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {current}
          {' / '}
          {total}
        </span>
      )}
    </div>
  )
}

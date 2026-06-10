import { useAtom } from 'jotai'

import { configFields } from '@/utils/atoms/config'
import { TTS_SPEED_MAX, TTS_SPEED_MIN, TTS_SPEED_STEP } from '@/utils/constants/config'

export function SpeedSlider() {
  const [ttsConfig, setTtsConfig] = useAtom(configFields.tts)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Speed</label>
        <span className="text-xs font-medium">{ttsConfig.speed}x</span>
      </div>
      <input
        type="range"
        min={TTS_SPEED_MIN}
        max={TTS_SPEED_MAX}
        step={TTS_SPEED_STEP}
        value={ttsConfig.speed}
        onChange={(e) => {
          setTtsConfig({ ...ttsConfig, speed: Number.parseFloat(e.target.value) })
        }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0.25x</span>
        <span>1x</span>
        <span>2x</span>
        <span>4x</span>
      </div>
    </div>
  )
}

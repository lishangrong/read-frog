import { useAtom } from 'jotai'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SubtitleDisplayMode, SubtitlePosition } from '@/types/config/subtitle'
import { configFields } from '@/utils/atoms/config'
import { SUBTITLE_DISPLAY_MODE_ITEMS, SUBTITLE_POSITION_ITEMS } from '@/utils/constants/config'
import { ConfigCard } from '../../components/config-card'
import { FieldWithLabel } from '../../components/field-with-label'

export function SubtitleConfig() {
  const [subtitleConfig, setSubtitleConfig] = useAtom(configFields.subtitle)

  return (
    <ConfigCard title="Subtitle Translation" description="Configure subtitle translation for video playback.">
      <div className="flex flex-col gap-4">
        {/* Enable Subtitle */}
        <FieldWithLabel id="subtitleEnabled" label="Enable Subtitle Translation">
          <Switch
            checked={subtitleConfig.enabled}
            onCheckedChange={checked => setSubtitleConfig({ ...subtitleConfig, enabled: checked })}
          />
        </FieldWithLabel>

        {/* Display Mode */}
        <FieldWithLabel id="subtitleDisplayMode" label="Display Mode">
          <Select
            value={subtitleConfig.displayMode}
            onValueChange={(value: SubtitleDisplayMode) => setSubtitleConfig({ ...subtitleConfig, displayMode: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(SUBTITLE_DISPLAY_MODE_ITEMS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWithLabel>

        {/* Position */}
        <FieldWithLabel id="subtitlePosition" label="Position">
          <Select
            value={subtitleConfig.position}
            onValueChange={(value: SubtitlePosition) => setSubtitleConfig({ ...subtitleConfig, position: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(SUBTITLE_POSITION_ITEMS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWithLabel>

        {/* Font Size */}
        <FieldWithLabel id="subtitleFontSize" label={`Font Size: ${subtitleConfig.fontSize}px`}>
          <input
            type="range"
            min={12}
            max={36}
            step={1}
            value={subtitleConfig.fontSize}
            onChange={e => setSubtitleConfig({ ...subtitleConfig, fontSize: Number.parseInt(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </FieldWithLabel>

        {/* Opacity */}
        <FieldWithLabel id="subtitleOpacity" label={`Background Opacity: ${Math.round(subtitleConfig.opacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={subtitleConfig.opacity}
            onChange={e => setSubtitleConfig({ ...subtitleConfig, opacity: Number.parseFloat(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </FieldWithLabel>

        {/* Auto Detect */}
        <FieldWithLabel id="subtitleAutoDetect" label="Auto Detect Video">
          <Switch
            checked={subtitleConfig.autoDetect}
            onCheckedChange={checked => setSubtitleConfig({ ...subtitleConfig, autoDetect: checked })}
          />
        </FieldWithLabel>
      </div>
    </ConfigCard>
  )
}

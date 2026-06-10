import type { RenderingMode } from '@/types/config/rendering'
import { useAtom } from 'jotai'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { renderingModeAtom } from '@/utils/atoms/rendering'

const RENDERING_MODE_OPTIONS: { value: RenderingMode, label: string }[] = [
  { value: 'bilingual', label: 'Bilingual' },
  { value: 'translationOnly', label: 'Translation Only' },
  { value: 'originalHidden', label: 'Original Hidden' },
]

export default function RenderingModeSelector() {
  const [mode, setMode] = useAtom(renderingModeAtom)

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-medium">Display Mode</span>
      <Select
        value={mode}
        onValueChange={(value: RenderingMode) => setMode(value)}
      >
        <SelectTrigger
          size="sm"
          className="bg-input/50 hover:bg-input !h-7 w-29 cursor-pointer pr-1.5 pl-2.5 outline-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RENDERING_MODE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

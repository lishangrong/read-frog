import type { LangCodeISO6393 } from '@/types/config/languages'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LANG_CODE_TO_LOCALE_NAME, langCodeISO6393Schema } from '@/types/config/languages'

interface StepLanguageProps {
  targetCode: LangCodeISO6393
  onTargetCodeChange: (code: LangCodeISO6393) => void
}

export function StepLanguage({ targetCode, onTargetCodeChange }: StepLanguageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{i18n.t('onboarding.language.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{i18n.t('onboarding.language.description')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="target-language" className="text-sm font-medium">
          {i18n.t('onboarding.language.targetLanguage')}
        </label>
        <Select
          value={targetCode}
          onValueChange={(value: LangCodeISO6393) => onTargetCodeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={i18n.t('onboarding.language.selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {langCodeISO6393Schema.options.map(code => (
                <SelectItem key={code} value={code}>
                  {LANG_CODE_TO_LOCALE_NAME[code]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

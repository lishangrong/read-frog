import type { SelectionTranslation } from '@/types/selection-translation'
import { useEffect, useState } from 'react'
import { DetailPanel } from './detail-panel'
import { preloadTtsAudio } from '@/utils/tts/preload'

interface SelectionPopupProps {
  selectedText: string
  translationPromise: Promise<SelectionTranslation>
  onDismiss: () => void
  ttsConfig?: { enabled: boolean, voice: string, speed: number, provider: 'webSpeech' | 'openai' | 'edgeTts' }
  targetLang?: string
}

export function SelectionPopup({ selectedText, translationPromise, onDismiss, ttsConfig, targetLang }: SelectionPopupProps) {
  const [result, setResult] = useState<SelectionTranslation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    translationPromise
      .then((data) => {
        if (!cancelled) {
          setResult(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Translation failed')
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [translationPromise])

  // Preload TTS audio when translation completes
  useEffect(() => {
    if (result && ttsConfig?.enabled && targetLang) {
      preloadTtsAudio(result.translation, {
        voice: ttsConfig.voice,
        speed: ttsConfig.speed,
        lang: targetLang,
        provider: ttsConfig.provider,
      })
    }
  }, [result, ttsConfig, targetLang])

  return (
    <div
      style={{
        minWidth: '280px',
        maxWidth: '420px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: 'var(--text, #1f2937)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Selected text preview */}
      <div style={{
        fontSize: '12px',
        color: 'var(--muted, #6b7280)',
        marginBottom: '8px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {selectedText.length > 60 ? `${selectedText.slice(0, 60)}...` : selectedText}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
          <span className="read-frog-spinner" />
          <span style={{ color: 'var(--muted, #6b7280)', fontSize: '13px' }}>Translating...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '13px',
          padding: '8px 0',
        }}>
          {error}
        </div>
      )}

      {/* Translation result */}
      {result && (
        <div>
          <div style={{
            fontSize: '15px',
            fontWeight: 500,
            marginBottom: '8px',
            wordBreak: 'break-word',
          }}>
            {result.translation}
          </div>
          <DetailPanel result={result} />
        </div>
      )}
    </div>
  )
}

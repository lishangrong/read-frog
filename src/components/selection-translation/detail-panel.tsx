import type { SelectionTranslation } from '@/types/selection-translation'

interface DetailPanelProps {
  result: SelectionTranslation
}

export function DetailPanel({ result }: DetailPanelProps) {
  const hasDetails = result.wordBreakdown || result.keyVocabulary || result.idiomaticAlternatives

  if (!hasDetails) return null

  return (
    <div style={{
      borderTop: '1px solid var(--border, #e5e7eb)',
      paddingTop: '8px',
      marginTop: '4px',
    }}>
      {/* Beginner: Word breakdown */}
      {result.wordBreakdown && result.wordBreakdown.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '4px' }}>
            Word Breakdown
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {result.wordBreakdown.map((item, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '3px',
                  padding: '2px 6px',
                  backgroundColor: 'var(--muted-bg, #f3f4f6)',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.word}</span>
                <span style={{ color: 'var(--muted, #6b7280)', fontSize: '11px' }}>{item.syntacticCategory}</span>
                <span>{item.meaning}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Beginner: Grammar notes */}
      {result.grammarNotes && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '2px' }}>
            Grammar
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #4b5563)' }}>
            {result.grammarNotes}
          </div>
        </div>
      )}

      {/* Intermediate: Key vocabulary */}
      {result.keyVocabulary && result.keyVocabulary.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '4px' }}>
            Key Vocabulary
          </div>
          {result.keyVocabulary.map((item, i) => (
            <div key={i} style={{ fontSize: '13px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 500 }}>{item.term}</span>
              {' — '}
              <span style={{ color: 'var(--text-secondary, #4b5563)' }}>{item.explanation}</span>
            </div>
          ))}
        </div>
      )}

      {/* Intermediate: Context note */}
      {result.contextNote && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '2px' }}>
            Context
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #4b5563)' }}>
            {result.contextNote}
          </div>
        </div>
      )}

      {/* Advanced: Idiomatic alternatives */}
      {result.idiomaticAlternatives && result.idiomaticAlternatives.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '4px' }}>
            Alternatives
          </div>
          {result.idiomaticAlternatives.map((alt, i) => (
            <div key={i} style={{
              fontSize: '13px',
              padding: '2px 6px',
              backgroundColor: 'var(--muted-bg, #f3f4f6)',
              borderRadius: '4px',
              marginBottom: '2px',
            }}>
              {alt}
            </div>
          ))}
        </div>
      )}

      {/* Advanced: Register note */}
      {result.registerNote && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)', marginBottom: '2px' }}>
            Usage Note
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #4b5563)', fontStyle: 'italic' }}>
            {result.registerNote}
          </div>
        </div>
      )}
    </div>
  )
}

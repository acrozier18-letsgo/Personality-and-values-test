import { useEffect, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { Answer } from '../engine/scoring';
import type { Question } from '../data/questions';
import { generateExample, SHARED_AI } from '../services/openai';
import { getStoredApiKey, saveApiKey } from '../store/useStore';

// Presented top-to-bottom, most-agree first. `key` is the 1–5 keyboard shortcut.
const OPTIONS: { value: Answer; label: string; key: string; color: string }[] = [
  { value: 'strongly_agree', label: 'Strongly Agree', key: '1', color: '#2f7d54' },
  { value: 'agree', label: 'Agree', key: '2', color: '#5a9b72' },
  { value: 'no_opinion', label: 'No Opinion', key: '3', color: '#8a857a' },
  { value: 'disagree', label: 'Disagree', key: '4', color: '#c26a54' },
  { value: 'strongly_disagree', label: 'Strongly Disagree', key: '5', color: '#b23b3b' },
];

interface Props {
  question: Question;
  current: Answer | undefined;
  onAnswer: (val: Answer) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  groupColor: string;
  groupLabel: string;
}

export function QuestionCard({ question, current, onAnswer, onPrev, onNext, hasPrev, hasNext, groupColor, groupLabel }: Props) {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [example, setExample] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

  useEffect(() => {
    setShowExample(false);
    setExample(null);
    setExampleError(null);
  }, [question.id]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const opt = OPTIONS.find(o => o.key === e.key);
      if (opt) onAnswer(opt.value);
      else if (e.key === 'ArrowRight' && hasNext) onNext();
      else if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAnswer, onNext, onPrev, hasNext, hasPrev]);

  async function fetchExample() {
    if (!apiKey.trim() && !SHARED_AI) return;
    if (apiKey.trim()) saveApiKey(apiKey.trim());
    setLoadingExample(true);
    setExampleError(null);
    try {
      const result = await generateExample(apiKey.trim(), question.text);
      setExample(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setExampleError(
        msg.includes('401') ? 'Invalid API key — check and try again.'
        : msg.includes('429') ? 'Rate limited — wait a moment and try again.'
        : msg.includes('quota') ? 'Quota exceeded on your OpenAI account.'
        : `Error: ${msg}`
      );
    } finally {
      setLoadingExample(false);
    }
  }

  function handleToggleExample() {
    const next = !showExample;
    setShowExample(next);
    if (next && !example && !loadingExample && (apiKey.trim() || SHARED_AI)) fetchExample();
  }

  return (
    <div
      style={{
        width: '100%', maxWidth: 680, background: '#fff', border: '1px solid var(--card-border)',
        borderRadius: 5, boxShadow: '0 12px 32px rgba(45,43,43,.09)', padding: '52px 48px 40px',
      }}
    >
      {/* Domain pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: groupColor, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: groupColor }} />
          {groupLabel}
        </span>
      </div>

      {/* Question */}
      <p className="font-display" style={{ fontWeight: 400, fontSize: 34, lineHeight: 1.22, textAlign: 'center', color: 'var(--ink)', margin: 0, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textWrap: 'pretty' }}>
        {question.text}
      </p>

      {/* Example link */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 26px' }}>
        <button className="ss-link" style={{ fontSize: 13 }} onClick={handleToggleExample}>
          {showExample ? 'Hide example' : 'Not sure what this means? Give an example'}
        </button>
      </div>

      {showExample && (
        <div style={{ marginBottom: 26, background: 'var(--tint-gold)', border: '1px solid rgba(182,130,53,.3)', borderRadius: 4, padding: 16, fontSize: 14, color: 'var(--ink-2)' }}>
          {loadingExample ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold-deep)' }}>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Thinking of an example…
            </div>
          ) : example ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ lineHeight: 1.6 }}>{example}</p>
              <button className="ss-link" style={{ fontSize: 12, alignSelf: 'flex-start' }} onClick={fetchExample}>Regenerate</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!SHARED_AI && (
                <p style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                  Enter your OpenAI API key to generate a real-life example. Your key is stored only in your browser.
                </p>
              )}
              {exampleError && <p style={{ fontSize: 13, color: 'var(--no)' }}>{exampleError}</p>}
              {!SHARED_AI && (
                <div style={{ position: 'relative' }}>
                  <input
                    className="ss-input"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && apiKey.trim() && fetchExample()}
                    placeholder="sk-..."
                    style={{ paddingRight: 36 }}
                    aria-label="OpenAI API key"
                  />
                  <button type="button" onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label={showKey ? 'Hide key' : 'Show key'}>
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <button className="ss-cta ss-cta-primary" style={{ fontSize: 13, padding: '7px 16px', alignSelf: 'flex-start' }} onClick={fetchExample} disabled={!apiKey.trim() && !SHARED_AI}>
                {exampleError ? 'Try again' : 'Get example'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Answer pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            className="ss-answer"
            data-sel={current === opt.value ? '1' : '0'}
            aria-pressed={current === opt.value}
            style={{ ['--ac' as string]: opt.color }}
            onClick={e => { onAnswer(opt.value); e.currentTarget.blur(); }}
          >
            {opt.label}
            <span className="ss-kbd">[{opt.key}]</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <button className="ss-topbtn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous question">← Prev</button>
        <button className="ss-topbtn" onClick={onNext} disabled={!hasNext} aria-label="Next question">Next →</button>
      </div>
    </div>
  );
}

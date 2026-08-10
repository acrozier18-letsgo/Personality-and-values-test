import { useRef, useState } from 'react';
import { readAnswersFile } from '../export/profile';
import { computeCompatibility } from '../engine/compatibility';
import type { CompatibilityResult } from '../engine/compatibility';
import { ANSWER_LABELS } from '../engine/scoring';
import type { Answer } from '../engine/scoring';

interface Props {
  answers: Record<string, Answer>;
}

function verdict(pct: number): string {
  if (pct >= 80) return 'Highly aligned';
  if (pct >= 65) return 'Strongly compatible';
  if (pct >= 50) return 'Moderately compatible';
  if (pct >= 35) return 'Some real differences';
  return 'Opposites';
}

export function CompatibilityPanel({ answers }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [name, setName] = useState('Their profile');
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const payload = await readAnswersFile(file);
      const r = computeCompatibility(answers, payload.answers);
      if (r.sharedCount === 0) {
        setResult(null);
        setError('No overlapping answered questions yet. Answer more of the same categories (or ask them to) and try again.');
        return;
      }
      setResult(r);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  return (
    <section aria-label="Compatibility" className="ss-card" style={{ padding: '26px 28px' }}>
      <div className="kicker">Two profiles</div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Compare With Someone</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px', maxWidth: 620 }}>
        Have a friend or partner take Selfscape and download their answers file, then load it here to see
        how your outlooks, values, and preferences line up. Their file is read in your browser only — nothing
        is uploaded or stored.
      </p>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} style={{ display: 'none' }} />

      {!result ? (
        <>
          <button className="ss-cta ss-cta-primary" onClick={() => fileRef.current?.click()}>
            Load their answers file →
          </button>
          {error && <p style={{ fontSize: 13, color: 'var(--no)', marginTop: 12 }}>{error}</p>}
        </>
      ) : (
        <div>
          {/* Overall */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
            <div style={{ textAlign: 'center', minWidth: 130 }}>
              <div className="font-display" style={{ fontSize: 56, lineHeight: 1, color: 'var(--gold-deep)' }}>{result.overall}%</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>{verdict(result.overall)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                className="ss-input"
                value={name}
                onChange={e => setName(e.target.value)}
                aria-label="Name for the other profile"
                style={{ maxWidth: 260, marginBottom: 8 }}
              />
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 }}>
                Overall agreement across <strong>{result.sharedCount}</strong> questions you both answered.
              </p>
            </div>
          </div>

          {/* Per-category bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            {result.categories.map(c => (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 3 }}>
                  <span>{c.label} <span style={{ color: 'var(--ink-faint)' }}>({c.shared})</span></span>
                  <span className="tnum">{c.pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--track-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {result.topAgreements.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--yes)', marginBottom: 8, letterSpacing: '.03em' }}>WHERE YOU ALIGN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.topAgreements.map(s => (
                    <div key={s.id} style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink-3)' }}>
                      “{s.text}” <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>· {s.categoryLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.topClashes.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--no)', marginBottom: 8, letterSpacing: '.03em' }}>WHERE YOU DIFFER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.topClashes.map(s => (
                    <div key={s.id} style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink-3)' }}>
                      “{s.text}” <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>· {s.categoryLabel}</span>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>
                        You: {ANSWER_LABELS[s.you]} · {name || 'Them'}: {ANSWER_LABELS[s.them]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button className="ss-cta ss-cta-secondary" onClick={() => fileRef.current?.click()}>Compare another</button>
            <button className="ss-topbtn" onClick={() => { setResult(null); setError(null); }}>Clear</button>
          </div>
        </div>
      )}
    </section>
  );
}

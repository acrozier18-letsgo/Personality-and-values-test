import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { readAnswersFile } from '../export/profile';
import { computeCompatibility } from '../engine/compatibility';
import type { CompatibilityResult } from '../engine/compatibility';
import { ANSWER_LABELS } from '../engine/scoring';
import type { Answer } from '../engine/scoring';

interface Slot {
  kind: 'you' | 'version' | 'file';
  label: string;
  versionId?: string;
  answers?: Record<string, Answer>; // omitted for 'you' (resolved live)
}

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
  const versions = useStore(s => s.versions);
  const [slotA, setSlotA] = useState<Slot | null>({ kind: 'you', label: 'You' });
  const [slotB, setSlotB] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileA = useRef<HTMLInputElement>(null);
  const fileB = useRef<HTMLInputElement>(null);

  const resolve = (slot: Slot | null): Record<string, Answer> | null =>
    !slot ? null : slot.kind === 'you' ? answers : slot.answers ?? null;

  const answersA = resolve(slotA);
  const answersB = resolve(slotB);

  const result: CompatibilityResult | null = useMemo(
    () => (answersA && answersB ? computeCompatibility(answersA, answersB) : null),
    [answersA, answersB],
  );

  function selectValue(slot: Slot | null): string {
    if (!slot) return '';
    if (slot.kind === 'you') return 'you';
    if (slot.kind === 'version') return `v:${slot.versionId}`;
    return 'file';
  }

  function onSelect(which: 'A' | 'B', value: string) {
    const setSlot = which === 'A' ? setSlotA : setSlotB;
    const fileRef = which === 'A' ? fileA : fileB;
    setError(null);
    if (value === 'you') setSlot({ kind: 'you', label: 'You' });
    else if (value === 'upload') fileRef.current?.click();
    else if (value.startsWith('v:')) {
      const v = versions.find(x => x.id === value.slice(2));
      if (v) setSlot({ kind: 'version', label: v.label, versionId: v.id, answers: v.answers });
    }
  }

  async function onFile(which: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const payload = await readAnswersFile(file);
      const label = file.name.replace(/\.json$/i, '');
      (which === 'A' ? setSlotA : setSlotB)({ kind: 'file', label, answers: payload.answers });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  const labelA = slotA?.label ?? 'A';
  const labelB = slotB?.label ?? 'B';

  function Selector({ which, slot }: { which: 'A' | 'B'; slot: Slot | null }) {
    const ref = which === 'A' ? fileA : fileB;
    return (
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="kicker" style={{ fontSize: 11, marginBottom: 6 }}>{which === 'A' ? 'Profile A' : 'Profile B'}</div>
        <select
          className="ss-sel"
          value={selectValue(slot)}
          onChange={e => onSelect(which, e.target.value)}
          style={{ width: '100%' }}
          aria-label={`Profile ${which}`}
        >
          <option value="" disabled>Choose a profile…</option>
          <option value="you">You (current answers)</option>
          {versions.map(v => <option key={v.id} value={`v:${v.id}`}>{v.label}</option>)}
          {slot?.kind === 'file' && <option value="file">{slot.label}</option>}
          <option value="upload">Upload a file…</option>
        </select>
        <input ref={ref} type="file" accept="application/json,.json" onChange={e => onFile(which, e)} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <section aria-label="Compatibility" className="ss-card" style={{ padding: '26px 28px' }}>
      <div className="kicker">Two profiles</div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Compare Two Profiles</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px', maxWidth: 620 }}>
        See how any two profiles line up — yourself, a saved version, or someone else’s downloaded answers
        file. Everything is compared in your browser; nothing is uploaded or stored.
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 18 }}>
        <Selector which="A" slot={slotA} />
        <div style={{ fontSize: 20, color: 'var(--ink-faint)', paddingBottom: 6 }}>×</div>
        <Selector which="B" slot={slotB} />
      </div>

      {error && <p style={{ fontSize: 13, color: 'var(--no)', marginBottom: 12 }}>{error}</p>}

      {!answersA || !answersB ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Pick a profile for both A and B to see how they compare.</p>
      ) : result && result.sharedCount === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--no)' }}>
          These two profiles have no overlapping answered questions. They need to answer some of the same
          categories before they can be compared.
        </p>
      ) : result ? (
        <div>
          {/* Overall */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ textAlign: 'center', minWidth: 130 }}>
              <div className="font-display" style={{ fontSize: 56, lineHeight: 1, color: 'var(--gold-deep)' }}>{result.overall}%</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>{verdict(result.overall)}</div>
            </div>
            <p style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 }}>
              <strong>{labelA}</strong> and <strong>{labelB}</strong> agree across{' '}
              <strong>{result.sharedCount}</strong> questions they both answered.
            </p>
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
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--yes)', marginBottom: 8, letterSpacing: '.03em' }}>WHERE THEY ALIGN</div>
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
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--no)', marginBottom: 8, letterSpacing: '.03em' }}>WHERE THEY DIFFER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.topClashes.map(s => (
                    <div key={s.id} style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink-3)' }}>
                      “{s.text}” <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>· {s.categoryLabel}</span>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>
                        {labelA}: {ANSWER_LABELS[s.you]} · {labelB}: {ANSWER_LABELS[s.them]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

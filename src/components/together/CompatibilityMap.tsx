import { useState } from 'react';
import { ANSWER_LABELS } from '../../engine/scoring';
import { BAND_COLORS, BAND_LABELS } from '../../engine/compat';
import type { CompatDomain, CompatResult, CompatSection } from '../../engine/compat';
import type { CoupleNames } from '../../engine/coupleBrief';

const SECTION_META: Record<CompatSection, { title: string; blurb: string }> = {
  self: {
    title: 'Who you each are',
    blurb: 'Temperament, values and outlook, compared across the core assessment.',
  },
  together: {
    title: 'How you operate together',
    blurb: 'The day-to-day machinery of a shared life — where it runs smoothly and where it grinds.',
  },
};

function DomainRow({ domain, names }: { domain: CompatDomain; names: CoupleNames }) {
  const [open, setOpen] = useState(false);
  const unknown = domain.alignment === null || domain.band === 'unknown';
  const canOpen = domain.divergences.length > 0 || domain.agreements.length > 0;

  return (
    <div style={{ borderBottom: '1px solid var(--card-border)', padding: '14px 0' }}>
      <button
        onClick={() => canOpen && setOpen(v => !v)}
        aria-expanded={canOpen ? open : undefined}
        disabled={!canOpen}
        style={{
          width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left',
          cursor: canOpen ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink-3)' }}>
            {domain.label}
            {canOpen && (
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-faint)', marginLeft: 8 }}>
                {open ? '− hide detail' : `+ ${domain.divergences.length} difference${domain.divergences.length === 1 ? '' : 's'}`}
              </span>
            )}
          </span>
          <span
            className="tnum"
            style={{ fontSize: 12.5, fontWeight: 600, color: BAND_COLORS[domain.band], whiteSpace: 'nowrap' }}
          >
            {unknown ? BAND_LABELS.unknown : `${domain.alignment} · ${BAND_LABELS[domain.band]}`}
          </span>
        </div>

        <div style={{ height: 7, borderRadius: 4, background: 'rgba(32,31,29,.07)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${unknown ? 0 : domain.alignment}%`,
              height: '100%',
              background: BAND_COLORS[domain.band],
              borderRadius: 4,
              transition: 'width .4s ease',
            }}
          />
        </div>

        <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          {unknown
            ? `Neither of you has answered enough here yet${domain.shared ? ` (${domain.shared} in common)` : ''}.`
            : domain.blurb}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {domain.divergences.length > 0 && (
            <div>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 8 }}>Where you differ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {domain.divergences.slice(0, 6).map(d => (
                  <div key={d.id} style={{ background: 'var(--tint-gold)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '11px 13px' }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)', margin: '0 0 7px' }}>“{d.text}”</p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {names.you}: <strong style={{ color: 'var(--ink-3)' }}>{ANSWER_LABELS[d.you]}</strong>
                      </span>
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {names.them}: <strong style={{ color: 'var(--ink-3)' }}>{ANSWER_LABELS[d.them]}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {domain.agreements.length > 0 && (
            <div>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 8 }}>Where you’re of one mind</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {domain.agreements.slice(0, 5).map(a => (
                  <li key={a.id} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                    {a.text} <span style={{ color: 'var(--yes)', fontSize: 12 }}>— you both {ANSWER_LABELS[a.answer].toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The compatibility read. Deliberately no headline percentage: a relationship
 * isn't one number, and difference in a domain is information, not a verdict.
 */
export function CompatibilityMap({ compat, names }: { compat: CompatResult; names: CoupleNames }) {
  const sections: CompatSection[] = ['self', 'together'];

  return (
    <section aria-label="Compatibility by domain">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">The map</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Where You Meet, and Where You Don’t</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', maxWidth: 600, margin: '10px auto 0', lineHeight: 1.6 }}>
          There’s no single compatibility score here, because there’s no such thing. What matters is{' '}
          <em>which</em> differences you have. Tap any row to see the exact statements underneath it.
        </p>
      </div>

      {compat.thin && (
        <div className="ss-card" style={{ padding: '16px 20px', marginBottom: 18, borderStyle: 'dashed', borderColor: 'rgba(182,130,53,.5)' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
            You’ve only answered <strong>{compat.sharedAnswers}</strong> of the same statements so far, so treat
            this as an early sketch. The relationship packs are where the useful detail lives — the more you
            both answer, the sharper everything below gets.
          </p>
        </div>
      )}

      {sections.map(sec => {
        const domains = compat.domains.filter(d => d.section === sec);
        return (
          <div key={sec} className="ss-card" style={{ padding: '22px 26px 8px', marginBottom: 18 }}>
            <div className="kicker" style={{ fontSize: 12 }}>{SECTION_META[sec].title}</div>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '6px 0 8px', lineHeight: 1.5 }}>
              {SECTION_META[sec].blurb}
            </p>
            {domains.map(d => <DomainRow key={d.key} domain={d} names={names} />)}
          </div>
        );
      })}
    </section>
  );
}

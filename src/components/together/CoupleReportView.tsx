import { useState } from 'react';
import type { CoupleReport, CoupleSectionSide } from '../../services/openai';
import type { CoupleNames } from '../../engine/coupleBrief';

type Direction = 'you' | 'them';

function Bullets({ title, items, tone }: { title: string; items: string[]; tone: 'do' | 'avoid' | 'say' }) {
  if (items.length === 0) return null;
  const color = tone === 'do' ? 'var(--yes)' : tone === 'avoid' ? 'var(--no)' : 'var(--gold-deep)';
  return (
    <div>
      <div className="kicker" style={{ fontSize: 11, marginBottom: 7, color }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13.8,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              fontStyle: tone === 'say' ? 'italic' : 'normal',
            }}
          >
            {tone === 'say' ? `“${item}”` : item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SideBody({ side }: { side: CoupleSectionSide }) {
  if (!side.summary && side.doThis.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: 'var(--ink-faint)', margin: 0 }}>
        Nothing was generated for this side. Try regenerating the report.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {side.summary && (
        <p style={{ fontSize: 14.8, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{side.summary}</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
        <Bullets title="Do this" items={side.doThis} tone="do" />
        <Bullets title="Avoid" items={side.avoid} tone="avoid" />
      </div>
      <Bullets title="Try saying" items={side.sayThis} tone="say" />
    </div>
  );
}

export function CoupleReportView({
  report,
  names,
  stale,
  onRegenerate,
  regenerating,
}: {
  report: CoupleReport;
  names: CoupleNames;
  stale: boolean;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  // The mirror side is what makes this a couples tool rather than a dossier:
  // whatever you can read about them, they can read about you.
  const [direction, setDirection] = useState<Direction>('you');

  const DIRECTION_META: Record<Direction, { tab: string; note: string }> = {
    you: {
      tab: `Understanding ${names.them}`,
      note: `Written for you, about ${names.them}.`,
    },
    them: {
      tab: `How ${names.them} should approach you`,
      note: `Written for ${names.them}, about you — show it to them, or read it to see yourself from their side.`,
    },
  };

  return (
    <section aria-label="Your couples report" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">The report</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>You Two, Read Closely</h2>
      </div>

      {stale && (
        <div className="ss-card" style={{ padding: '14px 18px', borderStyle: 'dashed', borderColor: 'rgba(182,130,53,.5)' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
            One of you has answered more since this was written.{' '}
            <button className="ss-link" onClick={onRegenerate} disabled={regenerating}>
              Regenerate it
            </button>{' '}
            to take the new answers into account.
          </p>
        </div>
      )}

      {report.overview && (
        <div className="ss-card" style={{ padding: '26px 28px' }}>
          <div className="kicker" style={{ fontSize: 12 }}>The shape of it</div>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', margin: '10px 0 0' }}>{report.overview}</p>
        </div>
      )}

      {report.strengths.length > 0 && (
        <div>
          <h3 style={{ fontSize: 22, textAlign: 'center', marginBottom: 16 }}>What You Have Going For You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {report.strengths.map((s, i) => (
              <div key={i} className="ss-card" style={{ padding: '20px 22px' }}>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8 }}>{s.title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.frictions.length > 0 && (
        <div>
          <h3 style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>What Will Take Work</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', textAlign: 'center', margin: '0 auto 16px', maxWidth: 520, lineHeight: 1.55 }}>
            Every couple has a list like this. Having one isn’t the problem — not knowing what’s on it is.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {report.frictions.map((f, i) => (
              <div key={i} className="ss-card" style={{ padding: '20px 24px' }}>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8 }}>{f.title}</div>
                <p style={{ fontSize: 14.2, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 12px' }}>{f.body}</p>
                {f.tryThis && (
                  <div style={{ background: 'var(--tint-gold)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '11px 14px' }}>
                    <span className="kicker" style={{ fontSize: 11 }}>Try this</span>
                    <p style={{ fontSize: 13.8, lineHeight: 1.55, color: 'var(--ink-3)', margin: '5px 0 0' }}>{f.tryThis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── The eight sections, in both directions ── */}
      <div>
        <h3 style={{ fontSize: 22, textAlign: 'center', marginBottom: 14 }}>The Practical Guide</h3>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {(['you', 'them'] as Direction[]).map(d => {
            const active = direction === d;
            return (
              <button
                key={d}
                onClick={() => setDirection(d)}
                aria-pressed={active}
                className="ss-chip"
                style={{
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--gold-deep)' : 'var(--ink-muted)',
                  background: active ? 'var(--tint-gold)' : 'transparent',
                  borderColor: active ? 'var(--gold)' : 'var(--card-border)',
                }}
              >
                {DIRECTION_META[d].tab}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', textAlign: 'center', margin: '0 auto 18px', maxWidth: 520, lineHeight: 1.5 }}>
          {DIRECTION_META[direction].note}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {report.sections.map(sec => (
            <div key={sec.key} className="ss-card" style={{ padding: '24px 26px' }}>
              <h4 className="font-display" style={{ fontSize: 20, margin: '0 0 14px', color: 'var(--ink-3)' }}>{sec.title}</h4>
              <SideBody side={direction === 'you' ? sec.forYou : sec.forThem} />
            </div>
          ))}
        </div>
      </div>

      {report.firstConversation && (
        <div className="ss-card" style={{ padding: '26px 28px', background: 'var(--tint-gold-2)' }}>
          <div className="kicker" style={{ fontSize: 12 }}>Start here</div>
          <h3 style={{ fontSize: 22, margin: '6px 0 10px' }}>One Thing to Do This Week</h3>
          <p style={{ fontSize: 15.5, lineHeight: 1.68, color: 'var(--ink-2)', margin: 0 }}>{report.firstConversation}</p>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button className="ss-cta ss-cta-secondary" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? 'Rewriting…' : 'Regenerate report'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 10 }}>
          Written {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>
    </section>
  );
}

import type { TemperamentResult, HumorStyle, FaithResult } from '../engine/synthesis';

function Bar({ pct, muted = false }: { pct: number; muted?: boolean }) {
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--track)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: muted ? 'var(--gold-muted)' : 'var(--gold)', borderRadius: 3 }} />
    </div>
  );
}

// ── Temperament ─────────────────────────────────────────────────────────────
export function TemperamentPanel({ temperament }: { temperament: TemperamentResult }) {
  const { primary, secondary, tagline, blurb, ratios } = temperament;
  return (
    <section aria-label="Temperament">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Humours</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Your Temperament</h2>
      </div>
      <div className="ss-card" style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <h3 className="font-display" style={{ fontSize: 30, color: 'var(--ink)' }}>{primary}</h3>
          <span style={{ fontSize: 13, color: 'var(--ink-muted-2)' }}>with a streak of {secondary}</span>
        </div>
        <p className="font-display" style={{ fontStyle: 'italic', fontSize: 17, color: 'var(--gold-deep)', margin: '0 0 12px' }}>{tagline}</p>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 18px' }}>{blurb}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ratios.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="font-display" style={{ width: 96, flex: 'none', fontWeight: 600, fontSize: 14, color: i === 0 ? 'var(--gold-deep)' : 'var(--ink-muted)' }}>{r.name}</span>
              <Bar pct={r.pct} muted={i !== 0} />
              <span className="tnum" style={{ width: 34, flex: 'none', textAlign: 'right', fontSize: 12, color: 'var(--ink-muted-2)' }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Humor ───────────────────────────────────────────────────────────────────
export function HumorPanel({ styles }: { styles: HumorStyle[] }) {
  const top = styles[0];
  const faint = top.score <= 52; // barely expressed → likely few humor answers
  return (
    <section aria-label="Sense of humor">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Comic voice</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Your Sense of Humor</h2>
      </div>
      <div className="ss-card" style={{ padding: '26px 28px' }}>
        {faint ? (
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 18px', fontStyle: 'italic' }}>
            Answer the humor questions to sharpen your comic profile — here's the shape so far.
          </p>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <h3 className="font-display" style={{ fontSize: 24, color: 'var(--ink)', margin: '0 0 4px' }}>{top.label}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>{top.description}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {styles.map((s, i) => (
            <div key={s.key} title={s.description} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="font-display" style={{ width: 138, flex: 'none', fontWeight: 600, fontSize: 13.5, color: i === 0 && !faint ? 'var(--gold-deep)' : 'var(--ink-muted)' }}>{s.label}</span>
              <Bar pct={s.score} muted={i !== 0 || faint} />
              <span className="tnum" style={{ width: 34, flex: 'none', textAlign: 'right', fontSize: 12, color: 'var(--ink-muted-2)' }}>{s.score}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Faith & Spirituality ─────────────────────────────────────────────────────
export function FaithPanel({ faith }: { faith: FaithResult }) {
  return (
    <section aria-label="Faith and spirituality">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">The sacred</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Faith &amp; Spirituality</h2>
      </div>
      <div className="ss-card" style={{ padding: '26px 28px' }}>
        <h3 className="font-display" style={{ fontSize: 26, color: 'var(--ink)', margin: '0 0 8px' }}>{faith.label}</h3>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 18px' }}>{faith.blurb}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faith.bars.map(b => (
            <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="font-display" style={{ width: 108, flex: 'none', fontWeight: 600, fontSize: 14, color: 'var(--ink-muted)' }}>{b.label}</span>
              <Bar pct={b.score} />
              <span className="tnum" style={{ width: 34, flex: 'none', textAlign: 'right', fontSize: 12, color: 'var(--ink-muted-2)' }}>{b.score}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-faint-2)', fontStyle: 'italic', margin: '16px 0 0' }}>
          Descriptive, not evaluative — no orientation here is presented as better than another.
        </p>
      </div>
    </section>
  );
}

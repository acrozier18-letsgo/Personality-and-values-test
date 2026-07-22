import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

export function PoliticalCompass({ scores }: Props) {
  const econ = scores['economicAxis']?.score ?? 0;
  const social = scores['socialAxis']?.score ?? 0;
  const lowConf = (scores['economicAxis']?.confidence ?? 0) < 0.3 || (scores['socialAxis']?.confidence ?? 0) < 0.3;

  const S = 300, c = S / 2, pad = 42, half = c - pad;
  const x = c + (econ / 100) * half;
  const y = c - (social / 100) * half;

  return (
    <section aria-label="Political Compass" className="ss-card" style={{ padding: '26px 28px' }}>
      <h2 style={{ fontSize: 26, margin: '0 0 4px', textAlign: 'center' }}>Political Compass</h2>
      {lowConf && (
        <p style={{ fontSize: 11, fontStyle: 'italic', color: '#b98b3a', textAlign: 'center', margin: '0 0 6px' }}>
          Low confidence — answer more political questions for an accurate reading.
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', padding: '0 20px', marginBottom: 2 }}>
        <span>← Egalitarian / Left</span><span>Market / Right →</span>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }} role="img" aria-label={`Economic ${econ}, Social ${social}`}>
        <rect x={c} y={pad} width={half} height={half} fill="rgba(182,130,53,.03)" />
        <rect x={pad} y={c} width={half} height={half} fill="rgba(182,130,53,.03)" />
        <rect x={pad} y={pad} width={2 * half} height={2 * half} fill="none" stroke="var(--ring)" strokeWidth={1} />
        <line x1={c} y1={pad} x2={c} y2={S - pad} stroke="#d9cdb6" strokeDasharray="3 4" strokeWidth={1} />
        <line x1={pad} y1={c} x2={S - pad} y2={c} stroke="#d9cdb6" strokeDasharray="3 4" strokeWidth={1} />
        <circle cx={x} cy={y} r={15} fill="rgba(182,130,53,.15)" />
        <circle cx={x} cy={y} r={6} fill="var(--gold)" stroke="#fff" strokeWidth={1.5} />
        <text x={x} y={y - 20} fill="var(--gold-deep)" fontSize={11} fontFamily="Cormorant Garamond" fontWeight={600} textAnchor="middle">You</text>
      </svg>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
        ↑ Authoritarian &nbsp;|&nbsp; ↓ Libertarian
      </div>
      <details style={{ marginTop: 10 }}>
        <summary className="ss-link" style={{ fontSize: 12, listStyle: 'none' }}>Text version</summary>
        <table style={{ fontSize: 12, marginTop: 8, width: '100%' }}>
          <tbody>
            <tr><td style={{ color: 'var(--ink-muted)', paddingRight: 16 }}>Economic Axis</td><td className="tnum">{econ > 0 ? `+${econ} (market-leaning)` : `${econ} (egalitarian-leaning)`}</td></tr>
            <tr><td style={{ color: 'var(--ink-muted)', paddingRight: 16 }}>Social Axis</td><td className="tnum">{social > 0 ? `+${social} (authoritarian-leaning)` : `${social} (libertarian-leaning)`}</td></tr>
          </tbody>
        </table>
      </details>
    </section>
  );
}

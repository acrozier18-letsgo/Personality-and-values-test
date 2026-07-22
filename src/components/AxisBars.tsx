import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSIONS } from '../data/dimensions';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

const BIPOLAR_GROUPS = ['D', 'E', 'F'] as const;

function AxisBar({ dim, score, confidence }: { dim: typeof DIMENSIONS[number]; score: number; confidence: number }) {
  const low = confidence < 0.3;
  const leftPct = score < 0 ? Math.abs(score) : 0;
  const rightPct = score > 0 ? score : 0;

  return (
    <div style={{ marginBottom: 16, opacity: low ? 0.5 : 1 }} aria-label={`${dim.label}: ${score}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, color: 'var(--ink-muted-2)', marginBottom: 6, gap: 8 }}>
        <span style={{ maxWidth: '36%', lineHeight: 1.1 }}>{dim.negativeLabel}</span>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink)', textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
          {dim.label}
          <InfoTooltip text={dim.description} label={`About ${dim.label}`} />
        </span>
        <span style={{ maxWidth: '36%', textAlign: 'right', lineHeight: 1.1 }}>{dim.positiveLabel}</span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 2, background: 'var(--track)', display: 'flex' }}>
        <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ height: '100%', width: `${leftPct}%`, background: 'var(--gold-muted)', borderRadius: '2px 0 0 2px' }} />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--gold)' }} />
        <div style={{ width: '50%' }}>
          <div style={{ height: '100%', width: `${rightPct}%`, background: 'var(--gold)', borderRadius: '0 2px 2px 0' }} />
        </div>
      </div>
      {low && <div style={{ fontSize: 10, fontStyle: 'italic', color: '#b98b3a', marginTop: 4 }}>needs more answers</div>}
    </div>
  );
}

export function AxisBars({ scores }: Props) {
  const bipolarDims = DIMENSIONS.filter(d => d.type === 'bipolar' && BIPOLAR_GROUPS.includes(d.group as typeof BIPOLAR_GROUPS[number]));
  const grouped = BIPOLAR_GROUPS.map(g => ({
    group: g,
    label: g === 'D' ? 'Political' : g === 'E' ? 'Philosophical' : 'Ontological',
    dims: bipolarDims.filter(d => d.group === g),
  }));

  return (
    <section aria-label="Philosophical and ontological axes">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Where you stand</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Philosophical &amp; Ontological Axes</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {grouped.map(({ group, label, dims }) => (
          <div key={group} className="ss-card" style={{ padding: '22px 22px 12px' }}>
            <h4 className="font-display" style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink-3)', margin: '0 0 18px', textAlign: 'center' }}>{label}</h4>
            {dims.map(d => (
              <AxisBar key={d.key} dim={d} score={scores[d.key]?.score ?? 0} confidence={scores[d.key]?.confidence ?? 0} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

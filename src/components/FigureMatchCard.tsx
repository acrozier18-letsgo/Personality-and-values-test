import type { FigureMatch } from '../engine/synthesis';

interface Props {
  match: FigureMatch;
}

export function FigureMatchCard({ match }: Props) {
  const { figure, affinity } = match;
  const initials = figure.name.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div className="ss-card" style={{ padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div
        className="font-display"
        style={{ width: 58, height: 58, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', border: '1px solid rgba(182,130,53,.5)', background: '#fbf6ec', color: 'var(--gold-deep)', fontWeight: 600, fontSize: 20 }}
        aria-hidden
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 21, color: 'var(--ink)' }}>{figure.name}</span>
          <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{figure.years}</span>
        </div>
        <div className="kicker" style={{ fontSize: 12, letterSpacing: '.06em', margin: '3px 0 8px' }}>{figure.field}</div>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 12px' }}>{figure.blurb}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--track)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${affinity}%`, background: 'var(--gold)', borderRadius: 3 }} />
          </div>
          <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-muted-2)', flex: 'none' }}>{affinity}% affinity</span>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-faint-2)', fontStyle: 'italic', margin: '8px 0 0' }}>
          You share tendencies with {figure.name} — this is a pattern match, not a comparison.
        </p>
      </div>
    </div>
  );
}

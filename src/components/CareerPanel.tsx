import type { CareerMatch } from '../engine/synthesis';

interface Props {
  careers: CareerMatch[];
}

export function CareerPanel({ careers }: Props) {
  return (
    <section aria-label="Career resonance">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Vocation</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Career Resonance</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {careers.map(({ family, fit }) => (
          <div key={family.id} className="ss-card" style={{ padding: '22px 22px' }}>
            <h4 className="font-display" style={{ fontWeight: 600, fontSize: 18, color: 'var(--ink)', margin: '0 0 12px' }}>{family.name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--track)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fit}%`, background: 'var(--gold)', borderRadius: 3 }} />
              </div>
              <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-muted-2)', flex: 'none' }}>{fit}% fit</span>
            </div>
            <p className="font-display" style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--gold-deep)', margin: '0 0 12px' }}>{family.tagline}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {family.roles.map(r => (
                <div key={r} style={{ fontSize: 13, color: '#5a5348', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#c9b48c' }} aria-hidden>·</span>{r}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

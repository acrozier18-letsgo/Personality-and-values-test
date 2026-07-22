import type { CountryMatch } from '../engine/synthesis';

function code(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface Props {
  countries: CountryMatch[];
}

export function CountryPanel({ countries }: Props) {
  return (
    <section aria-label="Cultural resonance">
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div className="kicker">Elsewhere</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Cultural Resonance</h2>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-muted-2)', margin: '0 0 22px' }}>
        Where your stated values echo the cultural vibe — playful exploration, not a life plan.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        {countries.map(({ country, fit }, i) => (
          <div
            key={country.id}
            className="ss-card"
            style={{ padding: '24px 22px', textAlign: 'center', borderColor: i === 0 ? 'rgba(182,130,53,.5)' : undefined }}
          >
            {i === 0 && <div className="kicker" style={{ fontSize: 11, letterSpacing: '.14em', marginBottom: 8 }}>Top match</div>}
            <div className="font-display" style={{ fontWeight: 600, fontSize: 34, color: 'var(--ink-faint-3)', letterSpacing: '.04em' }}>{code(country.name)}</div>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, color: 'var(--ink)', margin: '2px 0 1px' }}>{country.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>{country.region}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--track)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fit}%`, background: 'var(--gold)', borderRadius: 3 }} />
              </div>
              <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-muted-2)', flex: 'none' }}>{fit}%</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', fontStyle: 'italic', margin: 0 }}>{country.why}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

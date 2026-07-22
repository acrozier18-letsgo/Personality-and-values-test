import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PARTIES, PARTY_COUNTRIES } from '../data/parties';

interface Props {
  economic: number;   // −100..+100 (left..right)
  social: number;     // −100..+100 (libertarian..authoritarian)
  lowConfidence: boolean;
}

function econLabel(e: number): string {
  return e <= -45 ? 'Left' : e <= -15 ? 'Centre-left' : e < 15 ? 'Centrist' : e < 45 ? 'Centre-right' : 'Right';
}
function socLabel(s: number): string {
  return s <= -45 ? 'Libertarian' : s <= -15 ? 'Socially liberal' : s < 15 ? 'Mixed' : s < 45 ? 'Socially conservative' : 'Authoritarian';
}

const MAX_D = Math.hypot(200, 200);

export function PartyMatcher({ economic, social, lowConfidence }: Props) {
  const [country, setCountry] = useState(PARTY_COUNTRIES[0]);
  const [econ, setEcon] = useState(economic);
  const [soc, setSoc] = useState(social);

  const ranked = PARTIES[country]
    .map(p => ({ ...p, match: Math.round(Math.max(0, 1 - Math.hypot(econ - p.economic, soc - p.social) / MAX_D) * 100) }))
    .sort((a, b) => b.match - a.match);

  const sliderLabel: CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 };

  return (
    <section aria-label="Political party matcher">
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div className="kicker">Where you'd stand</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Your Political Home</h2>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-muted-2)', maxWidth: 580, margin: '0 auto 22px' }}>
        Pick a country to see which parties sit closest to your economic and social leanings — and nudge the
        sliders to explore. Illustrative and non-partisan; based only on two broad axes.
      </p>

      <div className="ss-card" style={{ padding: '24px 26px' }}>
        {/* Country picker */}
        <label style={{ display: 'block', fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>Country</label>
        <select className="ss-sel" value={country} onChange={e => setCountry(e.target.value)} style={{ maxWidth: 280 }}>
          {PARTY_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Position sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18, margin: '20px 0 8px' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
              Economic — <span className="font-display" style={{ fontWeight: 600, color: 'var(--gold-deep)' }}>{econLabel(econ)}</span> <span className="tnum" style={{ color: 'var(--ink-faint)' }}>({econ > 0 ? '+' : ''}{econ})</span>
            </div>
            <input type="range" min={-100} max={100} value={econ} onChange={e => setEcon(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} aria-label="Economic axis" />
            <div style={sliderLabel}><span>← Egalitarian / Left</span><span>Market / Right →</span></div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
              Social — <span className="font-display" style={{ fontWeight: 600, color: 'var(--gold-deep)' }}>{socLabel(soc)}</span> <span className="tnum" style={{ color: 'var(--ink-faint)' }}>({soc > 0 ? '+' : ''}{soc})</span>
            </div>
            <input type="range" min={-100} max={100} value={soc} onChange={e => setSoc(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} aria-label="Social axis" />
            <div style={sliderLabel}><span>← Libertarian</span><span>Authoritarian →</span></div>
          </div>
        </div>

        {lowConfidence && (
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#b98b3a', margin: '6px 0 0' }}>
            You've answered few political questions, so this starts from a rough estimate — adjust the sliders to your own view.
          </p>
        )}

        {/* Ranked parties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {ranked.map((p, i) => (
            <div
              key={p.name}
              style={{ border: `1px solid ${i === 0 ? 'rgba(182,130,53,.5)' : 'var(--card-border)'}`, borderRadius: 4, padding: '14px 16px', background: i === 0 ? 'var(--tint-gold)' : '#fff' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                {i === 0 && <span className="kicker" style={{ fontSize: 10, letterSpacing: '.14em' }}>Closest match</span>}
                <span className="font-display" style={{ fontWeight: 600, fontSize: 19, color: 'var(--ink)' }}>{p.name}</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-muted-2)' }}>{econLabel(p.economic)} · {socLabel(p.social)}</span>
                <span className="tnum" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gold-deep)', fontWeight: 600 }}>{p.match}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--track)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${p.match}%`, background: 'var(--gold)', borderRadius: 3 }} />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>{p.blurb}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--ink-faint-2)', fontStyle: 'italic', margin: '16px 0 0' }}>
          A rough, for-reflection comparison on two axes — not an endorsement, a prediction, or a full account of any party's platform.
        </p>
      </div>
    </section>
  );
}

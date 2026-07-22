import type { Persona } from '../engine/synthesis';
import { Oculus } from './Oculus';

interface Props {
  persona: Persona;
}

export function PersonaHeader({ persona }: Props) {
  const { archetype, identitySentence, overallCompletion, isEarlyRead } = persona;
  const pct = Math.round(overallCompletion * 100);

  return (
    <div style={{ textAlign: 'center', padding: '44px 10px 26px', position: 'relative' }}>
      <Oculus variant="persona" />
      <div style={{ position: 'relative' }}>
        <div className="kicker" style={{ letterSpacing: '.3em' }}>Your persona</div>
        <h1 style={{ fontSize: 'clamp(40px, 9vw, 60px)', lineHeight: 1, margin: '12px 0 6px' }}>{archetype.name}</h1>
        <p className="font-display" style={{ fontStyle: 'italic', fontSize: 22, color: 'var(--gold-deep)', margin: '0 0 14px' }}>
          “{archetype.tagline}”
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 600, margin: '0 auto 16px' }}>
          {identitySentence}
        </p>
        <span
          className="font-display"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, letterSpacing: '.08em', color: 'var(--gold-deep)', border: '1px solid rgba(182,130,53,.4)', borderRadius: 20, padding: '6px 16px' }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
          {pct}% answered{isEarlyRead ? ' · an early read' : ''}
        </span>
      </div>
    </div>
  );
}

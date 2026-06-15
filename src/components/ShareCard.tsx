import { forwardRef } from 'react';
import type { Persona } from '../engine/synthesis';

interface Props {
  persona: Persona;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(({ persona }, ref) => {
  const { archetype, figures, overallCompletion } = persona;
  const topFigure = figures[0];
  const pct = Math.round(overallCompletion * 100);

  return (
    <div
      ref={ref}
      style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}
      className="relative flex flex-col items-center justify-center bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-950 text-white overflow-hidden"
    >
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(40px)' }} />

      <div style={{ textAlign: 'center', padding: '0 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>{archetype.emoji}</div>
        <div style={{ fontSize: 54, fontWeight: 700, marginBottom: 8, letterSpacing: -1 }}>{archetype.name}</div>
        <div style={{ fontSize: 22, color: 'rgba(196,181,253,0.9)', fontStyle: 'italic', marginBottom: 32 }}>"{archetype.tagline}"</div>
        {topFigure && (
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            Shares tendencies with {topFigure.figure.name} · {topFigure.affinity}% affinity
          </div>
        )}
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          {pct}% answered
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(196,181,253,0.8)', letterSpacing: 4 }}>
          SELFSCAPE
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

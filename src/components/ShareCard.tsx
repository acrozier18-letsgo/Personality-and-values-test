import { forwardRef } from 'react';
import type { Persona } from '../engine/synthesis';
import type { ZodiacSign } from '../data/zodiac';
import type { LLMPersonaResult } from '../services/openai';

interface Props {
  persona: Persona;
  zodiac?: ZodiacSign | null;
  llmPersona?: LLMPersonaResult | null;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(({ persona, zodiac, llmPersona }, ref) => {
  const { archetype, figures, overallCompletion } = persona;
  const topFigure = figures[0];
  const pct = Math.round(overallCompletion * 100);

  // If we have an LLM-generated portrait image, use it as the card background
  const hasLLMImage = !!(llmPersona?.imageUrl);
  const displayTitle = llmPersona?.title ?? archetype.name;

  return (
    <div
      ref={ref}
      style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}
      className="relative flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background: DALL-E image if available, else gradient */}
      {hasLLMImage ? (
        <>
          <img
            src={llmPersona!.imageUrl}
            alt=""
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(109,40,217,0.75) 0%, rgba(17,24,39,0.85) 100%)' }} />
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #4c1d95, #1e1b4b, #3b0764)' }} />
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(40px)' }} />
        </>
      )}

      <div style={{ textAlign: 'center', padding: '0 60px', position: 'relative', zIndex: 1 }}>
        {!hasLLMImage && (
          <div style={{ fontSize: 80, marginBottom: 16 }}>{archetype.emoji}</div>
        )}

        {/* Zodiac badge */}
        {zodiac && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 100,
            padding: '6px 18px', marginBottom: 16, fontSize: 18, color: 'rgba(255,255,255,0.9)',
          }}>
            <span>{zodiac.symbol}</span>
            <span>{zodiac.name}</span>
            <span style={{ opacity: 0.6 }}>· {zodiac.element}</span>
          </div>
        )}

        <div style={{ fontSize: hasLLMImage ? 62 : 54, fontWeight: 700, marginBottom: 8, letterSpacing: -1, color: '#fff', lineHeight: 1.1 }}>
          {displayTitle}
        </div>

        {llmPersona?.subtitle ? (
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: 24, maxWidth: 800, margin: '0 auto 24px' }}>
            {llmPersona.subtitle}
          </div>
        ) : (
          <div style={{ fontSize: 22, color: 'rgba(196,181,253,0.9)', fontStyle: 'italic', marginBottom: 32 }}>
            "{archetype.tagline}"
          </div>
        )}

        {topFigure && (
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            Shares tendencies with {topFigure.figure.name} · {topFigure.affinity}% affinity
          </div>
        )}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>
          {pct}% answered
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'rgba(196,181,253,0.7)', letterSpacing: 5 }}>
          SELFSCAPE
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

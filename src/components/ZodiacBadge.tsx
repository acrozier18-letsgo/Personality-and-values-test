import type { ZodiacSign } from '../data/zodiac';

interface Props {
  sign: ZodiacSign;
  variant?: 'chip' | 'mini' | 'full';
}

// Muted, classical element accents.
const EL_COLOR: Record<string, string> = {
  Fire: '#a0552f',
  Earth: '#6b6a4e',
  Air: '#4a6a86',
  Water: '#5a4a86',
};

export function ZodiacBadge({ sign, variant = 'chip' }: Props) {
  const accent = EL_COLOR[sign.element] ?? '#5a4a86';

  if (variant === 'chip') {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-body"
        style={{
          fontSize: 13,
          color: 'var(--ink-2)',
          border: '1px solid rgba(90,74,60,.25)',
          borderRadius: 3,
          padding: '5px 11px',
        }}
      >
        <span style={{ color: accent }} aria-hidden>{sign.symbol}</span>
        {sign.name}
        <span style={{ color: 'var(--ink-faint)' }}>· {sign.element}</span>
      </span>
    );
  }

  const tinted = variant === 'full';

  return (
    <div
      className="rounded"
      style={{
        border: `1px solid ${tinted ? 'rgba(90,74,60,.22)' : 'var(--card-border)'}`,
        background: tinted ? 'var(--tint-gold)' : '#fff',
        padding: tinted ? '22px 26px' : '16px 18px',
        borderRadius: 4,
      }}
    >
      <div className="flex items-center gap-3.5 flex-wrap">
        <span style={{ fontSize: tinted ? 34 : 26, color: accent }} aria-hidden>{sign.symbol}</span>
        <div className="mr-auto">
          <div className="font-display" style={{ fontWeight: 600, fontSize: tinted ? 22 : 19, color: 'var(--ink)' }}>
            {sign.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted-2)' }}>{sign.dateRange}</div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="ss-chip" style={{ borderColor: `${accent}66`, color: accent }}>{sign.element}</span>
          <span className="ss-chip">{sign.modality}</span>
          <span className="ss-chip">{sign.rulingPlanet}</span>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 14 }}>
        {sign.traits.map(t => (
          <span key={t} className="ss-chip-solid">{t}</span>
        ))}
      </div>
    </div>
  );
}

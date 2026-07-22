import type { ChineseZodiacResult } from '../data/chineseZodiac';

interface Props {
  result: ChineseZodiacResult;
  compact?: boolean;
}

const CN_EL_COLOR: Record<string, string> = {
  Wood: '#4a7a4a',
  Fire: '#a0552f',
  Earth: '#8a6a3a',
  Metal: '#9b6a3a',
  Water: '#4a6a86',
};

export function ChineseZodiacBadge({ result, compact = false }: Props) {
  const { animal, element, yearName, zodiacYear } = result;
  const accent = CN_EL_COLOR[element.name] ?? '#9b6a3a';

  return (
    <div className="rounded" style={{ border: '1px solid var(--card-border)', background: '#fff', padding: '16px 18px', borderRadius: 4 }}>
      <div className="flex items-baseline gap-2">
        <span style={{ fontSize: 22, color: accent }} aria-hidden>{animal.emoji}</span>
        <span className="font-display" style={{ fontWeight: 600, fontSize: 19, color: 'var(--ink)' }}>{yearName}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-muted-2)', margin: '2px 0 10px' }}>
        Chinese zodiac · {zodiacYear} · {animal.yinYang}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <span className="ss-chip" style={{ borderColor: `${accent}66`, color: accent }}>{element.name}</span>
        <span className="ss-chip">{animal.yinYang}</span>
      </div>
      {!compact && (
        <>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '12px 0 0' }}>
            {animal.description} As a {element.name} year, this sign leans {element.quality}.
          </p>
          <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 12 }}>
            {animal.traits.map(t => (
              <span key={t} className="ss-chip-solid">{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

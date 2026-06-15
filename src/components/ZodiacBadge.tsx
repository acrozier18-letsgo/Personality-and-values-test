import type { ZodiacSign } from '../data/zodiac';
import { ELEMENT_BG } from '../data/zodiac';

interface Props {
  sign: ZodiacSign;
  size?: 'sm' | 'lg';
}

const ELEMENT_TEXT: Record<string, string> = {
  Fire:  'text-orange-700 dark:text-orange-300',
  Earth: 'text-green-700 dark:text-green-300',
  Air:   'text-sky-700 dark:text-sky-300',
  Water: 'text-blue-700 dark:text-blue-300',
};

export function ZodiacBadge({ sign, size = 'sm' }: Props) {
  if (size === 'lg') {
    return (
      <div className={`rounded-2xl border p-5 ${ELEMENT_BG[sign.element]}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl" aria-hidden>{sign.symbol}</span>
          <div>
            <h3 className={`font-bold text-lg ${ELEMENT_TEXT[sign.element]}`}>{sign.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sign.dateRange}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${ELEMENT_TEXT[sign.element]}`}>
            {sign.element}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 text-gray-600 dark:text-gray-300">
            {sign.modality}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 text-gray-600 dark:text-gray-300">
            {sign.rulingPlanet}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {sign.traits.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 text-gray-600 dark:text-gray-300">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${ELEMENT_BG[sign.element]} ${ELEMENT_TEXT[sign.element]}`}>
      <span aria-hidden>{sign.symbol}</span>
      {sign.name}
      <span className="text-xs opacity-70">· {sign.element}</span>
    </div>
  );
}

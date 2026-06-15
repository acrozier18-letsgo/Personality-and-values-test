import type { CountryMatch } from '../engine/synthesis';

interface Props {
  countries: CountryMatch[];
}

export function CountryPanel({ countries }: Props) {
  return (
    <section aria-label="Country recommendations">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cultural Resonance</h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
        Where your stated values and preferences echo the cultural vibe — playful exploration, not a life plan.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {countries.map(({ country, fit }, i) => (
          <div
            key={country.id}
            className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 ${
              i === 0 ? 'border-violet-300 dark:border-violet-700' : 'border-gray-100 dark:border-gray-800'
            }`}
          >
            {i === 0 && (
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 block">
                Top match
              </span>
            )}
            <div className="text-5xl mb-2" aria-hidden>{country.emoji}</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{country.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{country.region}</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${fit}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-400 shrink-0">{fit}%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">{country.why}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

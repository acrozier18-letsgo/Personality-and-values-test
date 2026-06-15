import type { CareerMatch } from '../engine/synthesis';

interface Props {
  careers: CareerMatch[];
}

export function CareerPanel({ careers }: Props) {
  return (
    <section aria-label="Career recommendations">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Career Resonance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {careers.map(({ family, fit }) => (
          <div key={family.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="text-4xl mb-3" aria-hidden>{family.emoji}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{family.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${fit}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-400 shrink-0">{fit}% fit</span>
            </div>
            <p className="text-xs text-violet-600 dark:text-violet-400 italic mb-3">{family.tagline}</p>
            <ul className="space-y-1">
              {family.roles.map(r => (
                <li key={r} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <span className="text-gray-300 dark:text-gray-600" aria-hidden>•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

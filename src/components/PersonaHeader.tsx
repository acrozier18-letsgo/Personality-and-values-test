import type { Persona } from '../engine/synthesis';

interface Props {
  persona: Persona;
}

export function PersonaHeader({ persona }: Props) {
  const { archetype, identitySentence, overallCompletion, isEarlyRead } = persona;
  const pct = Math.round(overallCompletion * 100);

  return (
    <div className="text-center py-8 px-4">
      <div className="text-6xl mb-4" aria-hidden>{archetype.emoji}</div>
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
        {archetype.name}
      </h1>
      <p className="text-lg text-violet-600 dark:text-violet-400 font-medium italic mb-4">
        "{archetype.tagline}"
      </p>
      <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
        {identitySentence}
      </p>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
        isEarlyRead
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
          : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
      }`}>
        <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" aria-hidden />
        {isEarlyRead ? `Early read — ${pct}% answered` : `${pct}% answered`}
      </div>
      {isEarlyRead && (
        <p className="text-xs text-gray-400 mt-2">
          Answer more questions to sharpen your portrait.{' '}
          <a href="/quiz" className="text-violet-500 hover:underline">Continue quiz →</a>
        </p>
      )}
    </div>
  );
}

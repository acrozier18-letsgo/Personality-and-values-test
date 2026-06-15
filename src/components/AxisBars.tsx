import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSIONS } from '../data/dimensions';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

const BIPOLAR_GROUPS = ['D', 'E', 'F'] as const;

function AxisBar({ dim, score, confidence }: {
  dim: typeof DIMENSIONS[number];
  score: number;
  confidence: number;
}) {
  const isLowConf = confidence < 0.3;
  const left  = score < 0 ? Math.abs(score) : 0;
  const right = score > 0 ? score : 0;

  return (
    <div className={`mb-4 ${isLowConf ? 'opacity-40' : ''}`} aria-label={`${dim.label}: ${score}`}>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span className="max-w-[40%] truncate">{dim.negativeLabel}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{dim.label}</span>
        <span className="max-w-[40%] truncate text-right">{dim.positiveLabel}</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
        {/* left half */}
        <div className="w-1/2 flex justify-end">
          <div
            className="h-full bg-indigo-400 rounded-l-full transition-all duration-500"
            style={{ width: `${left}%` }}
          />
        </div>
        {/* centre mark */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />
        {/* right half */}
        <div className="w-1/2">
          <div
            className="h-full bg-violet-500 rounded-r-full transition-all duration-500"
            style={{ width: `${right}%` }}
          />
        </div>
      </div>
      {isLowConf && (
        <p className="text-xs text-amber-400 mt-0.5">needs more answers</p>
      )}
    </div>
  );
}

export function AxisBars({ scores }: Props) {
  const bipolarDims = DIMENSIONS.filter(d => d.type === 'bipolar' && BIPOLAR_GROUPS.includes(d.group as typeof BIPOLAR_GROUPS[number]));

  const grouped = BIPOLAR_GROUPS.map(g => ({
    group: g,
    label: g === 'D' ? 'Political' : g === 'E' ? 'Philosophical' : 'Ontological',
    dims: bipolarDims.filter(d => d.group === g),
  }));

  return (
    <section aria-label="Axis bars for philosophical and ontological dimensions">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Philosophical & Ontological Axes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {grouped.map(({ group, label, dims }) => (
          <div key={group} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-4">{label}</h3>
            {dims.map(d => (
              <AxisBar
                key={d.key}
                dim={d}
                score={scores[d.key]?.score ?? 0}
                confidence={scores[d.key]?.confidence ?? 0}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

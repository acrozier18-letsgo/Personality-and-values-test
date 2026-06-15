import type { FigureMatch } from '../engine/synthesis';

interface Props {
  match: FigureMatch;
  rank: number;
}

function Monogram({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
      style={{ background: color }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626'];

export function FigureMatchCard({ match, rank }: Props) {
  const { figure, affinity } = match;
  const color = COLORS[rank % COLORS.length];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex gap-4 items-start">
      {figure.imageUrl ? (
        <img
          src={figure.imageUrl}
          alt={figure.name}
          className="w-16 h-16 rounded-full object-cover shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <Monogram name={figure.name} color={color} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="font-bold text-gray-900 dark:text-white">{figure.name}</h3>
          <span className="text-xs text-gray-400">{figure.years}</span>
        </div>
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-2">{figure.field}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{figure.blurb}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${affinity}%`, background: color }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 shrink-0">{affinity}% affinity</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 italic">
          You share tendencies with {figure.name} — this is a pattern match, not a comparison.
        </p>
      </div>
    </div>
  );
}

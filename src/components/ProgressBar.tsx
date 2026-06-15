import { QUESTIONS } from '../data/questions';
import type { Answer } from '../engine/scoring';

interface Props {
  answers: Record<string, Answer>;
  cursor: number;
}

const GROUP_COLORS: Record<string, string> = {
  A: 'bg-violet-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-red-500',
  E: 'bg-orange-500',
  F: 'bg-teal-500',
};

const GROUP_LABELS: Record<string, string> = {
  A: 'Personality',
  B: 'Values',
  C: 'Morals',
  D: 'Politics',
  E: 'Philosophy',
  F: 'Ontology',
};

export function ProgressBar({ answers, cursor }: Props) {
  const answered = Object.values(answers).filter(a => a === 'yes' || a === 'no').length;
  const pct = Math.round((answered / QUESTIONS.length) * 100);

  const groupCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const groupTotal  = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  QUESTIONS.forEach(q => {
    groupTotal[q.group]++;
    const a = answers[q.id];
    if (a === 'yes' || a === 'no') groupCounts[q.group]++;
  });

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Question {cursor + 1} of {QUESTIONS.length}</span>
        <span>{pct}% answered</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {(Object.keys(groupTotal) as Array<keyof typeof groupTotal>).map(g => {
          const w = groupTotal[g] / QUESTIONS.length;
          const filled = groupTotal[g] > 0 ? groupCounts[g] / groupTotal[g] : 0;
          return (
            <div key={g} style={{ width: `${w * 100}%` }} className="h-full bg-gray-200 dark:bg-gray-700">
              <div
                style={{ width: `${filled * 100}%` }}
                className={`h-full ${GROUP_COLORS[g]} transition-all duration-300`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        {(Object.keys(groupTotal) as Array<keyof typeof groupTotal>).map(g => (
          <span key={g} className="flex items-center gap-1 text-xs text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full ${GROUP_COLORS[g]}`} />
            {GROUP_LABELS[g]} ({groupCounts[g]}/{groupTotal[g]})
          </span>
        ))}
      </div>
    </div>
  );
}

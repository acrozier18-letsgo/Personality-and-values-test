import { QUESTIONS } from '../data/questions';
import type { Answer } from '../engine/scoring';
import { isAnswered, countAnswered } from '../engine/scoring';

interface Props {
  answers: Record<string, Answer>;
  cursor: number;
}

const GROUP_COLORS: Record<string, string> = {
  A: '#7c5cff', B: '#3b82f6', C: '#10b981', D: '#ef4444', E: '#f97316', F: '#14b8a6', G: '#db2777', H: '#a855f7',
};

const GROUP_LABELS: Record<string, string> = {
  A: 'Personality', B: 'Values', C: 'Morals', D: 'Politics', E: 'Philosophy', F: 'Ontology', G: 'Humor', H: 'Faith',
};

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export function ProgressBar({ answers, cursor }: Props) {
  const answered = countAnswered(answers);
  const pct = Math.round((answered / QUESTIONS.length) * 100);

  const groupCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };
  const groupTotal = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };
  QUESTIONS.forEach(q => {
    groupTotal[q.group]++;
    if (isAnswered(answers[q.id])) groupCounts[q.group]++;
  });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 6 }}>
        <span>Question {cursor + 1} of {QUESTIONS.length}</span>
        <span className="tnum">{pct}% answered</span>
      </div>
      <div style={{ height: 8, borderRadius: 2, overflow: 'hidden', display: 'flex', background: 'var(--track-2)' }}>
        {KEYS.map(g => {
          const w = groupTotal[g] / QUESTIONS.length;
          const filled = groupTotal[g] > 0 ? groupCounts[g] / groupTotal[g] : 0;
          return (
            <div key={g} style={{ width: `${w * 100}%`, height: '100%', background: 'var(--track-2)', borderRight: '2px solid var(--ground)' }}>
              <div style={{ height: '100%', width: `${filled * 100}%`, background: GROUP_COLORS[g], transition: 'width .3s' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 10 }}>
        {KEYS.map(g => (
          <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: GROUP_COLORS[g] }} />
            {GROUP_LABELS[g]} <span className="tnum">({groupCounts[g]}/{groupTotal[g]})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

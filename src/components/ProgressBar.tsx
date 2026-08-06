import type { Answer } from '../engine/scoring';
import { isAnswered } from '../engine/scoring';
import { CATEGORY_MAP } from '../data/categories';
import type { ActiveQuestion } from '../data/categories';

interface Props {
  questions: ActiveQuestion[];
  answers: Record<string, Answer>;
  cursor: number;
}

export function ProgressBar({ questions, answers, cursor }: Props) {
  const total = questions.length;
  const answered = questions.filter(q => isAnswered(answers[q.id])).length;
  const pct = total ? Math.round((answered / total) * 100) : 0;

  // Segment by category, in the order categories first appear in the active list.
  const order: string[] = [];
  const counts: Record<string, { done: number; total: number }> = {};
  for (const q of questions) {
    if (!counts[q.categoryKey]) { counts[q.categoryKey] = { done: 0, total: 0 }; order.push(q.categoryKey); }
    counts[q.categoryKey].total++;
    if (isAnswered(answers[q.id])) counts[q.categoryKey].done++;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 6 }}>
        <span>Question {Math.min(cursor + 1, total)} of {total}</span>
        <span className="tnum">{pct}% answered</span>
      </div>
      <div style={{ height: 8, borderRadius: 2, overflow: 'hidden', display: 'flex', background: 'var(--track-2)' }}>
        {order.map(key => {
          const c = counts[key];
          const w = total > 0 ? c.total / total : 0;
          const filled = c.total > 0 ? c.done / c.total : 0;
          return (
            <div key={key} style={{ width: `${w * 100}%`, height: '100%', background: 'var(--track-2)', borderRight: '2px solid var(--ground)' }}>
              <div style={{ height: '100%', width: `${filled * 100}%`, background: CATEGORY_MAP[key]?.color ?? 'var(--gold)', transition: 'width .3s' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 10 }}>
        {order.map(key => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_MAP[key]?.color ?? 'var(--gold)' }} />
            {CATEGORY_MAP[key]?.label ?? key} <span className="tnum">({counts[key].done}/{counts[key].total})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

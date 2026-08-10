import { useState } from 'react';
import { OPTIONAL_CATEGORIES, OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import { ANSWER_VALUES } from '../engine/scoring';
import type { Answer } from '../engine/scoring';

interface Props {
  answers: Record<string, Answer>;
}

const PREVIEW = 4; // statements shown per stance before "show more"

function StanceList({ label, items, color }: { label: string; items: string[]; color: string }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, PREVIEW);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: '.03em', marginBottom: 6 }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {shown.map((t, i) => (
          <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>{t}</li>
        ))}
      </ul>
      {items.length > PREVIEW && (
        <button className="ss-link" style={{ fontSize: 12, marginTop: 6 }} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `Show ${items.length - PREVIEW} more`}
        </button>
      )}
    </div>
  );
}

export function OptionalPanels({ answers }: Props) {
  const panels = OPTIONAL_CATEGORIES.map(cat => {
    const qs = OPTIONAL_QUESTIONS.filter(q => q.category === cat.key);
    const answered = qs.filter(q => answers[q.id]);
    const agree = qs
      .filter(q => answers[q.id] && ANSWER_VALUES[answers[q.id]] > 0)
      .sort((a, b) => ANSWER_VALUES[answers[b.id]] - ANSWER_VALUES[answers[a.id]])
      .map(q => q.text);
    const disagree = qs
      .filter(q => answers[q.id] && ANSWER_VALUES[answers[q.id]] < 0)
      .sort((a, b) => ANSWER_VALUES[answers[a.id]] - ANSWER_VALUES[answers[b.id]])
      .map(q => q.text);
    return { cat, total: qs.length, answered: answered.length, agree, disagree };
  }).filter(p => p.answered > 0);

  if (panels.length === 0) return null;

  return (
    <section aria-label="Your preferences">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Beyond the core</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Your Preferences &amp; Life</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', maxWidth: 540, margin: '10px auto 0', lineHeight: 1.6 }}>
          Drawn from the optional packs you answered — a snapshot of your leanings on the things that
          shape a life and a partnership.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {panels.map(p => (
          <div key={p.cat.key} className="ss-card" style={{ padding: '20px 22px', borderTop: `3px solid ${p.cat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h3 className="font-display" style={{ fontSize: 20, color: 'var(--ink-3)', margin: 0 }}>{p.cat.label}</h3>
              <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{p.answered}/{p.total}</span>
            </div>
            <StanceList label="You lean toward" items={p.agree} color="var(--yes)" />
            <StanceList label="Not for you" items={p.disagree} color="var(--no)" />
          </div>
        ))}
      </div>
    </section>
  );
}

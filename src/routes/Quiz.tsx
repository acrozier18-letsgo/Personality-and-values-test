import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, isValidEmail } from '../store/useStore';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import type { Answer } from '../engine/scoring';
import { ANSWER_LABELS, personaUnlockThreshold } from '../engine/scoring';
import { activeQuestions, coreSelectedTotal, coreAnsweredCount, CATEGORY_MAP } from '../data/categories';

function answerColor(a: Answer | undefined): string {
  if (a === 'strongly_agree' || a === 'agree') return '#2f7d54';
  if (a === 'strongly_disagree' || a === 'disagree') return '#b23b3b';
  return '#b0a894';
}

export default function Quiz() {
  const navigate = useNavigate();
  const { answers, cursor, answer, goTo, email, selectedCategories } = useStore();
  const [showReview, setShowReview] = useState(false);

  // Require an email to take the assessment; send them back to sign in otherwise.
  useEffect(() => {
    if (!isValidEmail(email)) navigate('/', { replace: true });
  }, [email, navigate]);

  const active = useMemo(() => activeQuestions(selectedCategories), [selectedCategories]);
  const total = active.length;
  const idx = Math.min(cursor, Math.max(0, total - 1));
  const q = active[idx];

  const personaUnlocked = coreAnsweredCount(answers) >= personaUnlockThreshold(coreSelectedTotal(selectedCategories));

  const handleAnswer = (val: Answer) => {
    if (!q) return;
    answer(q.id, val);
    if (idx < total - 1) goTo(idx + 1);
  };

  if (total === 0 || !q) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 36, margin: '0 0 12px' }}>No categories selected</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.6 }}>
            Choose at least one kind of question on the home page to begin.
          </p>
          <button className="ss-cta ss-cta-primary" onClick={() => navigate('/')}>← Choose categories</button>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_MAP[q.categoryKey];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', borderBottom: '1px solid var(--card-border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <button className="ss-topbtn" style={{ marginTop: 2, whiteSpace: 'nowrap' }} onClick={() => navigate('/')}>← Home</button>
          <div style={{ flex: 1, minWidth: 240 }}>
            <ProgressBar questions={active} answers={answers} cursor={idx} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => setShowReview(v => !v)}>Review</button>
            <button
              className="ss-cta ss-cta-primary"
              style={{ fontSize: 13, padding: '7px 14px' }}
              onClick={() => navigate('/results')}
              disabled={!personaUnlocked}
              title={personaUnlocked ? undefined : 'Answer at least 75% of the core questions to unlock your persona'}
            >See persona →</button>
          </div>
        </div>
      </div>

      {showReview ? (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <h2 style={{ fontSize: 30 }}>Review answers</h2>
            <button className="ss-link" onClick={() => setShowReview(false)}>← Back to quiz</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map((qq, i) => {
              const a = answers[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => { goTo(i); setShowReview(false); }}
                  className="ss-card"
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-faint-3)', width: 34, flex: 'none' }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.45 }}>{qq.text}</span>
                  <span className="font-display" style={{ fontWeight: 600, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', flex: 'none', color: answerColor(a), whiteSpace: 'nowrap' }}>
                    {a ? ANSWER_LABELS[a] : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <QuestionCard
            question={q}
            current={answers[q.id]}
            onAnswer={handleAnswer}
            onPrev={() => goTo(Math.max(0, idx - 1))}
            onNext={() => goTo(Math.min(total - 1, idx + 1))}
            hasPrev={idx > 0}
            hasNext={idx < total - 1}
            groupColor={cat?.color ?? '#b68235'}
            groupLabel={cat?.label ?? ''}
          />
          <p style={{ fontSize: 12, color: 'var(--ink-faint-2)', marginTop: 18, textAlign: 'center' }}>
            Your progress is saved automatically. You can leave anytime and return where you left off.
          </p>
          {idx === total - 1 && (
            <button className="ss-cta ss-cta-primary" style={{ marginTop: 22 }} onClick={() => navigate('/results')}>
              I'm done — show my persona →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

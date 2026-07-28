import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, isValidEmail } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import type { Answer } from '../engine/scoring';
import { ANSWER_LABELS, countAnswered, personaUnlockThreshold } from '../engine/scoring';

const GROUPS: Record<string, { label: string; color: string }> = {
  A: { label: 'Personality', color: '#7c5cff' },
  B: { label: 'Values', color: '#3b82f6' },
  C: { label: 'Morals', color: '#10b981' },
  D: { label: 'Politics', color: '#ef4444' },
  E: { label: 'Philosophy', color: '#f97316' },
  F: { label: 'Ontology', color: '#14b8a6' },
  G: { label: 'Humor', color: '#db2777' },
  H: { label: 'Faith', color: '#a855f7' },
};

function answerColor(a: Answer | undefined): string {
  if (a === 'strongly_agree' || a === 'agree') return '#2f7d54';
  if (a === 'strongly_disagree' || a === 'disagree') return '#b23b3b';
  return '#b0a894';
}

export default function Quiz() {
  const navigate = useNavigate();
  const { answers, cursor, answer, goTo, email } = useStore();
  const [showReview, setShowReview] = useState(false);

  // Require an email to take the assessment; send them back to sign in otherwise.
  useEffect(() => {
    if (!isValidEmail(email)) navigate('/', { replace: true });
  }, [email, navigate]);

  const q = QUESTIONS[cursor];
  const group = GROUPS[q.group];

  const answeredCount = countAnswered(answers);
  const personaUnlocked = answeredCount >= personaUnlockThreshold(QUESTIONS.length);

  const handleAnswer = (val: Answer) => {
    answer(q.id, val);
    if (cursor < QUESTIONS.length - 1) goTo(cursor + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', borderBottom: '1px solid var(--card-border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <button className="ss-topbtn" style={{ marginTop: 2, whiteSpace: 'nowrap' }} onClick={() => navigate('/')}>← Home</button>
          <div style={{ flex: 1, minWidth: 240 }}>
            <ProgressBar answers={answers} cursor={cursor} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => setShowReview(v => !v)}>Review</button>
            <button
              className="ss-cta ss-cta-primary"
              style={{ fontSize: 13, padding: '7px 14px' }}
              onClick={() => navigate('/results')}
              disabled={!personaUnlocked}
              title={personaUnlocked ? undefined : 'Answer at least 75% of the questions to unlock your persona'}
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
            {QUESTIONS.map((qq, i) => {
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
            onPrev={() => goTo(Math.max(0, cursor - 1))}
            onNext={() => goTo(Math.min(QUESTIONS.length - 1, cursor + 1))}
            hasPrev={cursor > 0}
            hasNext={cursor < QUESTIONS.length - 1}
            groupColor={group.color}
            groupLabel={group.label}
          />
          <p style={{ fontSize: 12, color: 'var(--ink-faint-2)', marginTop: 18, textAlign: 'center' }}>
            Your progress is saved automatically. You can leave anytime and return where you left off.
          </p>
          {cursor === QUESTIONS.length - 1 && (
            <button className="ss-cta ss-cta-primary" style={{ marginTop: 22 }} onClick={() => navigate('/results')}>
              I'm done — show my persona →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

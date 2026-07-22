import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { REFINEMENT_QUESTIONS } from '../data/refinementQuestions';
import { scoreAnswers } from '../engine/scoring';
import type { Answer } from '../engine/scoring';
import { synthesize } from '../engine/synthesis';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';

const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

// Refinement Likert value (1–5) → main-quiz Answer.
const LIKERT_TO_ANSWER: Record<number, Answer> = {
  1: 'strongly_disagree',
  2: 'disagree',
  3: 'no_opinion',
  4: 'agree',
  5: 'strongly_agree',
};

export default function Refine() {
  const navigate = useNavigate();
  const { answers, refineAnswers, setRefineAnswer } = useStore();

  const baseResult  = useMemo(() => scoreAnswers(answers, QUESTIONS), [answers]);

  // Build synthetic answers that include refinement
  const refinedResult = useMemo(() => {
    // Inject refinement answers as pseudo-questions alongside the base questions.
    // Weights keep their original magnitude; the answer's −2..+2 value carries the direction.
    const extraQuestions = REFINEMENT_QUESTIONS.map(rq => ({
      id: rq.id,
      text: rq.text,
      group: 'E' as const,
      weights: rq.weights as Partial<Record<DimensionKey, number>>,
    }));

    const combinedQuestions = [...QUESTIONS, ...extraQuestions];
    const combinedAnswers: Record<string, Answer> = { ...answers };
    REFINEMENT_QUESTIONS.forEach(rq => {
      const val = refineAnswers[rq.id];
      // Unanswered refinement questions are simply left out (contribute nothing).
      if (val !== undefined) combinedAnswers[rq.id] = LIKERT_TO_ANSWER[val];
    });

    return scoreAnswers(combinedAnswers, combinedQuestions);
  }, [answers, refineAnswers]);

  const basePersona    = useMemo(() => synthesize(baseResult), [baseResult]);
  const refinedPersona = useMemo(() => synthesize(refinedResult), [refinedResult]);

  const answeredRefine = Object.keys(refineAnswers).length;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 22px 70px' }}>
      <div style={{ marginBottom: 8 }}>
        <button className="ss-topbtn" onClick={() => navigate('/results')}>← Back to results</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div className="kicker">The finer grain</div>
        <h1 style={{ fontSize: 44, margin: '6px 0 0' }}>Refine Your Portrait</h1>
      </div>
      <p style={{ textAlign: 'center', fontSize: 14.5, lineHeight: 1.6, color: '#5a5348', maxWidth: 520, margin: '0 auto 26px' }}>
        Nuanced scale questions sharpen the axes where your answers were most ambiguous. Answer as many
        or as few as you like — each updates your persona in real time.
      </p>

      {answeredRefine > 0 && (
        <div style={{ border: '1px solid rgba(182,130,53,.4)', borderRadius: 4, background: 'var(--tint-gold)', padding: '18px 22px', marginBottom: 24 }}>
          <div className="kicker" style={{ letterSpacing: '.2em', color: 'var(--gold-deep)', marginBottom: 12 }}>Persona shift</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}>Before refinement</div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 17, color: 'var(--ink-2)' }}>{basePersona.archetype.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}>After refinement</div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 17, color: 'var(--gold-deep)' }}>{refinedPersona.archetype.name}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {REFINEMENT_QUESTIONS.map(rq => {
          const current = refineAnswers[rq.id] ?? 3;
          return (
            <div key={rq.id} className="ss-card" style={{ padding: '22px 24px' }}>
              <p className="font-display" style={{ fontWeight: 600, fontSize: 19, lineHeight: 1.35, color: 'var(--ink)', margin: '0 0 16px' }}>{rq.text}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(v => {
                  const sel = current === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setRefineAnswer(rq.id, v)}
                      aria-label={LIKERT_LABELS[v - 1]}
                      aria-pressed={sel}
                      className="tnum"
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 3, cursor: 'pointer', fontSize: 13, transition: 'all .15s',
                        border: `1px solid ${sel ? 'var(--gold)' : 'rgba(32,31,29,.14)'}`,
                        color: sel ? 'var(--gold-deep)' : 'var(--ink-muted)',
                        background: sel ? 'rgba(182,130,53,.12)' : 'transparent',
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint-3)', marginTop: 6 }}>
                <span>Strongly disagree</span><span>Strongly agree</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '12px 0 0' }}>
                Touches: <span style={{ color: 'var(--gold-deep)' }}>{rq.targetDimensions.map(d => DIMENSION_MAP[d]?.label).join(', ')}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button className="ss-cta ss-cta-primary" onClick={() => navigate('/results')}>View refined persona →</button>
      </div>
    </div>
  );
}

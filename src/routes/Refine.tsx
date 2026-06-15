import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { REFINEMENT_QUESTIONS } from '../data/refinementQuestions';
import { scoreAnswers } from '../engine/scoring';
import { synthesize } from '../engine/synthesis';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';

const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

function likertToWeight(val: number): number {
  // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
  return val - 3;
}

export default function Refine() {
  const navigate = useNavigate();
  const { answers, refineAnswers, setRefineAnswer } = useStore();

  const baseResult  = useMemo(() => scoreAnswers(answers, QUESTIONS), [answers]);

  // Build synthetic answers that include refinement
  const refinedResult = useMemo(() => {
    // Inject refinement answers as pseudo-questions alongside the base questions
    const extraQuestions = REFINEMENT_QUESTIONS.map(rq => ({
      id: rq.id,
      text: rq.text,
      group: 'E' as const,
      weights: Object.fromEntries(
        Object.entries(rq.weights).map(([k, w]) => {
          const mult = likertToWeight(refineAnswers[rq.id] ?? 3);
          return [k, mult === 0 ? 0 : w! * Math.sign(mult)];
        })
      ) as Partial<Record<DimensionKey, number>>,
    }));

    const combinedQuestions = [...QUESTIONS, ...extraQuestions];
    const combinedAnswers: Record<string, import('../engine/scoring').Answer> = { ...answers };
    REFINEMENT_QUESTIONS.forEach(rq => {
      const val = refineAnswers[rq.id];
      if (val === undefined) {
        combinedAnswers[rq.id] = 'skip';
      } else {
        const mult = likertToWeight(val);
        combinedAnswers[rq.id] = mult > 0 ? 'yes' : mult < 0 ? 'no' : 'skip';
      }
    });

    return scoreAnswers(combinedAnswers, combinedQuestions);
  }, [answers, refineAnswers]);

  const basePersona    = useMemo(() => synthesize(baseResult), [baseResult]);
  const refinedPersona = useMemo(() => synthesize(refinedResult), [refinedResult]);

  const answeredRefine = Object.keys(refineAnswers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/results')}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ← Back to results
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refine Your Portrait</h1>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          These 40 nuanced Likert-scale questions sharpen your portrait on axes where your responses were most ambiguous.
          Answer as many or as few as you like — each answer updates your persona in real time.
        </p>

        {answeredRefine > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-violet-200 dark:border-violet-800 p-4 mb-6">
            <h2 className="font-semibold text-violet-700 dark:text-violet-300 mb-2 text-sm">Persona shift</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400 mb-1">Before refinement</p>
                <p className="font-bold text-gray-700 dark:text-gray-200">{basePersona.archetype.emoji} {basePersona.archetype.name}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">After refinement</p>
                <p className="font-bold text-violet-700 dark:text-violet-300">{refinedPersona.archetype.emoji} {refinedPersona.archetype.name}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {REFINEMENT_QUESTIONS.map(rq => {
            const current = refineAnswers[rq.id] ?? 3;
            return (
              <div key={rq.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4">{rq.text}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => setRefineAnswer(rq.id, v)}
                      aria-label={LIKERT_LABELS[v - 1]}
                      aria-pressed={current === v}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        current === v
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-violet-50 dark:hover:bg-violet-950 hover:text-violet-700 dark:hover:text-violet-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-1 px-1">
                  <span>Strongly disagree</span>
                  <span>Strongly agree</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Touches: {rq.targetDimensions.map(d => DIMENSION_MAP[d]?.label).join(', ')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/results')}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors shadow-md"
          >
            View refined persona →
          </button>
        </div>
      </div>
    </div>
  );
}

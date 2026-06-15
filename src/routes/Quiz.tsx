import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import type { Answer } from '../engine/scoring';

export default function Quiz() {
  const navigate = useNavigate();
  const { answers, cursor, answer, goTo } = useStore();
  const [showReview, setShowReview] = useState(false);

  const q = QUESTIONS[cursor];

  const handleAnswer = (val: Answer) => {
    answer(q.id, val);
    if (cursor < QUESTIONS.length - 1) goTo(cursor + 1);
  };

  if (showReview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Answers</h2>
            <button
              onClick={() => setShowReview(false)}
              className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400"
            >
              ← Back to quiz
            </button>
          </div>
          <div className="space-y-2">
            {QUESTIONS.map((q, i) => {
              const a = answers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => { goTo(i); setShowReview(false); }}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-400 w-10 shrink-0 mt-0.5">#{i + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{q.text}</span>
                    <span className={`text-xs font-semibold shrink-0 px-2 py-1 rounded ${
                      a === 'yes' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      a === 'no'  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}>
                      {a ?? '—'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
          >
            ← Home
          </button>
          <div className="flex-1 min-w-0">
            <ProgressBar answers={answers} cursor={cursor} />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowReview(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              Review
            </button>
            <button
              onClick={() => navigate('/results')}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors font-medium"
            >
              See persona →
            </button>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <QuestionCard
          question={q}
          current={answers[q.id]}
          onAnswer={handleAnswer}
          onPrev={() => goTo(Math.max(0, cursor - 1))}
          onNext={() => goTo(Math.min(QUESTIONS.length - 1, cursor + 1))}
          hasPrev={cursor > 0}
          hasNext={cursor < QUESTIONS.length - 1}
        />

        <p className="mt-4 text-xs text-gray-400 text-center">
          Your progress is saved automatically. You can leave anytime and return where you left off.
        </p>

        {cursor === QUESTIONS.length - 1 && (
          <button
            onClick={() => navigate('/results')}
            className="mt-6 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors shadow-md"
          >
            I'm done — show my persona →
          </button>
        )}
      </div>
    </div>
  );
}

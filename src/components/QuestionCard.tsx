import { useEffect } from 'react';
import type { Answer } from '../engine/scoring';
import type { Question } from '../data/questions';

interface Props {
  question: Question;
  current: Answer | undefined;
  onAnswer: (val: Answer) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function QuestionCard({ question, current, onAnswer, onPrev, onNext, hasPrev, hasNext }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'y' || e.key === 'Y') onAnswer('yes');
      else if (e.key === 'n' || e.key === 'N') onAnswer('no');
      else if (e.key === 's' || e.key === 'S') onAnswer('skip');
      else if (e.key === 'ArrowRight' && hasNext) onNext();
      else if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAnswer, onNext, onPrev, hasNext, hasPrev]);

  const baseBtn = 'flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 sm:p-8 w-full max-w-2xl mx-auto">
      <p className="text-lg sm:text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-8 text-center">
        {question.text}
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => onAnswer('yes')}
          aria-pressed={current === 'yes'}
          className={`${baseBtn} focus:ring-green-400 ${
            current === 'yes'
              ? 'bg-green-500 text-white shadow-md scale-105'
              : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800'
          }`}
        >
          <span aria-hidden>✓</span> Yes <kbd className="ml-1 text-xs opacity-60">[Y]</kbd>
        </button>
        <button
          onClick={() => onAnswer('no')}
          aria-pressed={current === 'no'}
          className={`${baseBtn} focus:ring-red-400 ${
            current === 'no'
              ? 'bg-red-500 text-white shadow-md scale-105'
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-800'
          }`}
        >
          <span aria-hidden>✗</span> No <kbd className="ml-1 text-xs opacity-60">[N]</kbd>
        </button>
        <button
          onClick={() => onAnswer('skip')}
          aria-pressed={current === 'skip'}
          className={`${baseBtn} focus:ring-gray-400 ${
            current === 'skip'
              ? 'bg-gray-400 text-white shadow-md scale-105'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Skip <kbd className="ml-1 text-xs opacity-60">[S]</kbd>
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous question"
        >
          ← Prev <kbd className="text-xs opacity-60">[←]</kbd>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next question"
        >
          Next → <kbd className="text-xs opacity-60">[→]</kbd>
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, Eye, EyeOff } from 'lucide-react';
import type { Answer } from '../engine/scoring';
import type { Question } from '../data/questions';
import { generateExample } from '../services/openai';
import { getStoredApiKey, saveApiKey } from '../store/useStore';

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
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [example, setExample] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

  useEffect(() => {
    setShowExample(false);
    setExample(null);
    setExampleError(null);
  }, [question.id]);

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

  async function fetchExample() {
    if (!apiKey.trim()) return;
    saveApiKey(apiKey.trim());
    setLoadingExample(true);
    setExampleError(null);
    try {
      const result = await generateExample(apiKey.trim(), question.text);
      setExample(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setExampleError(
        msg.includes('401') ? 'Invalid API key — check and try again.'
        : msg.includes('429') ? 'Rate limited — wait a moment and try again.'
        : msg.includes('quota') ? 'Quota exceeded on your OpenAI account.'
        : `Error: ${msg}`
      );
    } finally {
      setLoadingExample(false);
    }
  }

  function handleToggleExample() {
    const next = !showExample;
    setShowExample(next);
    if (next && !example && !loadingExample && apiKey.trim()) fetchExample();
  }

  const baseBtn = 'flex-1 py-4 px-4 rounded-xl font-semibold text-base transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 sm:p-10 w-full max-w-2xl mx-auto">
      <p className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-4 text-center min-h-[6rem] flex items-center justify-center">
        {question.text}
      </p>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleToggleExample}
          className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" aria-hidden />
          {showExample ? 'Hide example' : "Not sure what this means? Give an example"}
        </button>
      </div>

      {showExample && (
        <div className="mb-6 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300">
          {loadingExample ? (
            <div className="flex items-center gap-2 text-violet-500">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Thinking of an example…
            </div>
          ) : example ? (
            <div className="space-y-2">
              <p className="leading-relaxed">{example}</p>
              <button
                onClick={fetchExample}
                className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors"
              >
                Regenerate
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter your OpenAI API key to generate a real-life example. Your key is stored only in your browser.
              </p>
              {exampleError && <p className="text-sm text-red-500 dark:text-red-400">{exampleError}</p>}
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && apiKey.trim() && fetchExample()}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  aria-label="OpenAI API key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={fetchExample}
                disabled={!apiKey.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {exampleError ? 'Try again' : 'Get example'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mb-8">
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

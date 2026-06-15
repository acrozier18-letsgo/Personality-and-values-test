import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Disclaimer } from '../components/Disclaimer';
import { QUESTIONS } from '../data/questions';

export default function Landing() {
  const navigate = useNavigate();
  const { answers, reset } = useStore();

  const answered = Object.values(answers).filter(a => a === 'yes' || a === 'no').length;
  const hasProgress = answered > 0;
  const pct = Math.round((answered / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Self<span className="text-violet-600 dark:text-violet-400">scape</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Map your philosophy, values, and personality — then get a vivid portrait of who you are.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-left space-y-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">What to expect</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>✦ 200 yes/no questions spanning personality, values, ethics, politics & philosophy</li>
            <li>✦ Answer as many or few as you like — results improve with more answers</li>
            <li>✦ Your progress is saved automatically in your browser</li>
            <li>✦ Finish anytime and view your persona — refine later</li>
            <li>✦ No account needed. Your data never leaves your device.</li>
          </ul>
        </div>

        <Disclaimer />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasProgress ? (
            <>
              <button
                onClick={() => navigate('/quiz')}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-md"
              >
                Continue ({pct}% done)
              </button>
              <button
                onClick={() => navigate('/results')}
                className="px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-violet-700 dark:text-violet-300 rounded-xl font-semibold text-lg transition-colors border border-violet-200 dark:border-violet-800"
              >
                View my persona →
              </button>
              <button
                onClick={() => { if (confirm('Start over? This will erase all your answers.')) reset(); }}
                className="px-4 py-3 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Start over
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/quiz')}
              className="px-10 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xl transition-colors shadow-lg hover:shadow-violet-200 dark:hover:shadow-violet-900"
            >
              Begin the journey →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

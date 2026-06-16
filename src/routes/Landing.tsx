import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Disclaimer } from '../components/Disclaimer';
import { ZodiacBadge } from '../components/ZodiacBadge';
import { QUESTIONS } from '../data/questions';
import { getZodiacFromDate } from '../data/zodiac';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(month: number, year: number): number {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

function parseParts(iso: string) {
  if (!iso) return { month: 0, day: 0, year: 0 };
  const [y, m, d] = iso.split('-').map(Number);
  return { month: m ?? 0, day: d ?? 0, year: y ?? 0 };
}

function toISO(month: number, day: number, year: number): string {
  if (!month || !day || !year) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const selectClass =
  'flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer';

export default function Landing() {
  const navigate = useNavigate();
  const { answers, reset, birthdate, setBirthdate } = useStore();

  const answered = Object.values(answers).filter(a => a === 'yes' || a === 'no').length;
  const hasProgress = answered > 0;
  const pct = Math.round((answered / QUESTIONS.length) * 100);

  const { month, day, year } = parseParts(birthdate);
  const zodiac = birthdate ? getZodiacFromDate(birthdate) : null;

  function handlePart(part: 'month' | 'day' | 'year', value: number) {
    const next = {
      month: part === 'month' ? value : month,
      day:   part === 'day'   ? value : day,
      year:  part === 'year'  ? value : year,
    };
    // Clamp day if month/year changed and day is now out of range
    const maxDay = daysInMonth(next.month, next.year);
    if (next.day > maxDay) next.day = maxDay;
    setBirthdate(toISO(next.month, next.day, next.year));
  }

  const dayCount = daysInMonth(month, year);

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
            <li>✦ 200 yes/no questions spanning personality, values, ethics, politics &amp; philosophy</li>
            <li>✦ Answer as many or few as you like — results improve with more answers</li>
            <li>✦ Your progress is saved automatically in your browser</li>
            <li>✦ Finish anytime and view your persona — refine later</li>
            <li>✦ No account needed. Your data never leaves your device.</li>
          </ul>
        </div>

        {/* Birthday + zodiac */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-left">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Your zodiac sign</h2>
          <p className="text-xs text-gray-400 mb-4">
            Optional — adds your sign to your persona profile and enables the AI portrait feature.
          </p>

          <fieldset>
            <legend className="text-xs text-gray-500 mb-2">Date of birth</legend>
            <div className="flex gap-2">
              {/* Month */}
              <div className="relative flex-[2]">
                <select
                  value={month || ''}
                  onChange={e => handlePart('month', Number(e.target.value))}
                  className={selectClass}
                  aria-label="Month"
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>

              {/* Day */}
              <div className="relative flex-1">
                <select
                  value={day || ''}
                  onChange={e => handlePart('day', Number(e.target.value))}
                  className={selectClass}
                  aria-label="Day"
                >
                  <option value="">Day</option>
                  {Array.from({ length: dayCount }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>

              {/* Year */}
              <div className="relative flex-[2]">
                <select
                  value={year || ''}
                  onChange={e => handlePart('year', Number(e.target.value))}
                  className={selectClass}
                  aria-label="Year"
                >
                  <option value="">Year</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
          </fieldset>

          {zodiac ? (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <ZodiacBadge sign={zodiac} />
              <p className="text-xs text-gray-400 italic">
                {zodiac.element} · {zodiac.modality} · ruled by {zodiac.rulingPlanet}
                &nbsp;· {zodiac.traits.join(', ')}
              </p>
            </div>
          ) : (month > 0 || day > 0 || year > 0) ? (
            <p className="text-xs text-gray-400 mt-3">Select a complete date to see your sign.</p>
          ) : null}
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

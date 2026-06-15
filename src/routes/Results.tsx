import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { scoreAnswers } from '../engine/scoring';
import { synthesize } from '../engine/synthesis';
import { PersonaHeader } from '../components/PersonaHeader';
import { RadarPanel } from '../components/RadarPanel';
import { PoliticalCompass } from '../components/PoliticalCompass';
import { AxisBars } from '../components/AxisBars';
import { FigureMatchCard } from '../components/FigureMatchCard';
import { CareerPanel } from '../components/CareerPanel';
import { CountryPanel } from '../components/CountryPanel';
import { ShareCard } from '../components/ShareCard';
import { Disclaimer } from '../components/Disclaimer';
import { toImage } from '../export/toImage';
import { sharePersona } from '../export/share';

export default function Results() {
  const navigate = useNavigate();
  const { answers } = useStore();
  const shareCardRef = useRef<HTMLDivElement>(null);

  const result  = useMemo(() => scoreAnswers(answers, QUESTIONS), [answers]);
  const persona = useMemo(() => synthesize(result), [result]);

  const answered = Object.values(answers).filter(a => a === 'yes' || a === 'no').length;

  async function handleShare() {
    if (!shareCardRef.current) return;
    try {
      const blob = await toImage(shareCardRef.current);
      await sharePersona(persona.archetype.name, persona.identitySentence, blob);
    } catch (e) {
      console.error('Share failed', e);
    }
  }

  if (answered === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No answers yet</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Answer at least a few questions and your persona will take shape here.
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors"
          >
            Start the quiz →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hidden share card rendered off-screen for capture */}
      <div className="fixed -top-[2000px] left-0 pointer-events-none" aria-hidden>
        <ShareCard ref={shareCardRef} persona={persona} />
      </div>

      {/* Sticky export bar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => navigate('/quiz')}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ← Continue quiz
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
            >
              Share card
            </button>
            <button
              onClick={() => navigate('/refine')}
              className="text-xs px-3 py-1.5 border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 rounded-lg font-medium transition-colors"
            >
              Refine →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <PersonaHeader persona={persona} />

        {/* Archetype description */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{persona.archetype.description}</p>
        </div>

        <RadarPanel scores={result.scores} />
        <PoliticalCompass scores={result.scores} />
        <AxisBars scores={result.scores} />

        {/* Historical figure matches */}
        <section aria-label="Historical figure matches">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thinkers & Doers Who Share Your Tendencies</h2>
          <div className="space-y-4">
            {persona.figures.map((m, i) => (
              <FigureMatchCard key={m.figure.id} match={m} rank={i} />
            ))}
          </div>
        </section>

        <CareerPanel careers={persona.careers} />
        <CountryPanel countries={persona.countries} />

        {/* Time & Intro guidance */}
        {persona.timeRecommendations.length > 0 && (
          <section aria-label="How to spend your time">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Spend Your Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {persona.timeRecommendations.map((rec, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {persona.introductions.length > 0 && (
          <section aria-label="How to introduce yourself">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Introduce Yourself</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['At a party', 'At work', 'On a bio'] as const).map((ctx, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2">{ctx}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{persona.introductions[i]}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Disclaimer compact />

        <div className="text-center pb-8">
          <p className="text-xs text-gray-400 mb-4">
            Results reflect patterns in your own answers — not predictions, diagnoses, or judgements.
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Keep answering to sharpen your portrait
          </button>
        </div>
      </div>
    </div>
  );
}

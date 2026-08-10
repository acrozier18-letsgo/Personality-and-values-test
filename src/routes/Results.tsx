import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { scoreAnswers, personaUnlockThreshold } from '../engine/scoring';
import { coreAnsweredCount, coreSelectedTotal } from '../data/categories';
import { synthesize } from '../engine/synthesis';
import { getZodiacFromDate } from '../data/zodiac';
import { PersonaHeader } from '../components/PersonaHeader';
import { RadarPanel } from '../components/RadarPanel';
import { PoliticalCompass } from '../components/PoliticalCompass';
import { AxisBars } from '../components/AxisBars';
import { FigureMatchCard } from '../components/FigureMatchCard';
import { CareerPanel } from '../components/CareerPanel';
import { CountryPanel } from '../components/CountryPanel';
import { ShareCard } from '../components/ShareCard';
import { ZodiacBadge } from '../components/ZodiacBadge';
import { LLMPersona } from '../components/LLMPersona';
import { StoryStudio } from '../components/StoryStudio';
import { TemperamentPanel, HumorPanel, FaithPanel } from '../components/CharacterPanels';
import { PartyMatcher } from '../components/PartyMatcher';
import { DataPortability } from '../components/DataPortability';
import { OptionalPanels } from '../components/OptionalPanels';
import { CompatibilityPanel } from '../components/CompatibilityPanel';
import { PersonaChats } from '../components/PersonaChats';
import { Disclaimer } from '../components/Disclaimer';
import { toImage } from '../export/toImage';
import { sharePersona } from '../export/share';

const INTRO_CONTEXTS = ['At a party', 'At work', 'On a bio'] as const;

export default function Results() {
  const navigate = useNavigate();
  const { answers, birthdate, llmPersona, setLLMPersona, story, setStory, selectedCategories } = useStore();
  const shareCardRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => scoreAnswers(answers, QUESTIONS), [answers]);
  const persona = useMemo(() => synthesize(result), [result]);
  const zodiac = useMemo(() => (birthdate ? getZodiacFromDate(birthdate) : null), [birthdate]);

  // Only core (scored) questions gate the persona; optional packs enrich the profile.
  const coreAnswered = coreAnsweredCount(answers);
  const coreTotal = coreSelectedTotal(selectedCategories);
  const threshold = personaUnlockThreshold(coreTotal);
  const unlocked = coreAnswered >= threshold;

  async function handleShare() {
    if (!shareCardRef.current) return;
    try {
      const blob = await toImage(shareCardRef.current);
      await sharePersona(persona.archetype.name, persona.identitySentence, blob);
    } catch (e) {
      console.error('Share failed', e);
    }
  }

  if (!unlocked) {
    const remaining = Math.max(0, threshold - coreAnswered);
    const pct = coreTotal ? Math.round((coreAnswered / coreTotal) * 100) : 0;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 460 }}>
          <div className="kicker" style={{ letterSpacing: '.3em' }}>Your persona</div>
          <h1 style={{ fontSize: 44, margin: '10px 0 12px' }}>Not yet drawn</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.6 }}>
            Your portrait unlocks once you’ve answered at least 75% of the core questions — enough for a
            reading you can trust.
          </p>
          <p style={{ color: 'var(--ink-3)', marginBottom: 22, fontSize: 15 }}>
            You’ve answered <strong>{coreAnswered}</strong> of {coreTotal} core ({pct}%).{' '}
            <strong>{remaining}</strong> more to go.
          </p>
          <button className="ss-cta ss-cta-primary" onClick={() => navigate('/quiz')}>
            {coreAnswered === 0 ? 'Begin the journey →' : 'Keep answering →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden share card for capture */}
      <div style={{ position: 'fixed', top: -2000, left: 0, pointerEvents: 'none' }} aria-hidden>
        <ShareCard ref={shareCardRef} persona={persona} zodiac={zodiac} llmPersona={llmPersona} />
      </div>

      {/* Sticky header */}
      <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', borderBottom: '1px solid var(--card-border)', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button className="ss-topbtn" onClick={() => navigate('/quiz')}>← Continue quiz</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {zodiac && <ZodiacBadge sign={zodiac} variant="chip" />}
            <button className="ss-cta ss-cta-primary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={handleShare}>Share card</button>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => navigate('/refine')}>Refine →</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 22px 70px' }}>
        <PersonaHeader persona={persona} />
        <div className="ss-divider" style={{ margin: '8px 0 34px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {zodiac && <ZodiacBadge sign={zodiac} variant="full" />}

          {/* AI Portrait */}
          {zodiac ? (
            <LLMPersona
              scores={result.scores}
              zodiac={zodiac}
              archetype={persona.archetype}
              identitySentence={persona.identitySentence}
              stored={llmPersona}
              onResult={setLLMPersona}
            />
          ) : (
            <div className="ss-card" style={{ padding: '26px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(182,130,53,.4)' }}>
              <div className="kicker">Illustrated</div>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 8 }}>
                Add your date of birth on the{' '}
                <button className="ss-link" onClick={() => navigate('/')}>home page</button>{' '}
                to unlock your AI-generated name and portrait.
              </p>
            </div>
          )}

          {/* Story studio — once a portrait/persona exists */}
          {llmPersona && (
            <StoryStudio
              scores={result.scores}
              personaName={llmPersona.title || persona.archetype.name}
              identitySentence={persona.identitySentence}
              careerSuggestions={persona.careers.slice(0, 3).flatMap(c => c.family.roles)}
              coverImage={llmPersona.imageUrl}
              story={story}
              onStory={setStory}
            />
          )}

          <RadarPanel scores={result.scores} />
          <PoliticalCompass scores={result.scores} />
          <AxisBars scores={result.scores} />
          <TemperamentPanel temperament={persona.temperament} />
          <HumorPanel styles={persona.humorStyles} />
          <FaithPanel faith={persona.faith} />

          {/* Kindred minds */}
          <section aria-label="Kindred minds">
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div className="kicker">Kindred minds</div>
              <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Thinkers &amp; Doers Who Share Your Tendencies</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {persona.figures.map(m => <FigureMatchCard key={m.figure.id} match={m} />)}
            </div>
          </section>

          <CareerPanel careers={persona.careers} />
          <CountryPanel countries={persona.countries} />

          {persona.timeRecommendations.length > 0 && (
            <section aria-label="How to spend your time">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 30 }}>How to Spend Your Time</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
                {persona.timeRecommendations.map((rec, i) => (
                  <div key={i} className="ss-card" style={{ padding: '22px 24px' }}>
                    <p style={{ fontSize: 14.5, lineHeight: 1.62, color: 'var(--ink-2)' }}>{rec}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {persona.introductions.length > 0 && (
            <section aria-label="How to introduce yourself">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 30 }}>How to Introduce Yourself</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                {INTRO_CONTEXTS.map((ctx, i) => (
                  <div key={ctx} className="ss-card" style={{ padding: '22px 24px' }}>
                    <div className="kicker" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 8 }}>{ctx}</div>
                    <p className="font-display" style={{ fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: 'var(--ink-3)' }}>“{persona.introductions[i]}”</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <PartyMatcher
            economic={result.scores['economicAxis']?.score ?? 0}
            social={result.scores['socialAxis']?.score ?? 0}
            lowConfidence={(result.scores['economicAxis']?.confidence ?? 0) < 0.3 || (result.scores['socialAxis']?.confidence ?? 0) < 0.3}
          />

          <OptionalPanels answers={answers} />

          <DataPortability persona={persona} result={result} />

          <CompatibilityPanel answers={answers} />

          <PersonaChats persona={persona} result={result} answers={answers} />
        </div>

        <div style={{ marginTop: 44, textAlign: 'center' }}>
          <Disclaimer compact />
          <div style={{ marginTop: 18 }}>
            <button className="ss-cta ss-cta-secondary" onClick={() => navigate('/quiz')}>Keep answering to sharpen your portrait</button>
          </div>
        </div>
      </div>
    </div>
  );
}

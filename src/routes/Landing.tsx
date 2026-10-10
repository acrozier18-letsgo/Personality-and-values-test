import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, isValidEmail } from '../store/useStore';
import { readAnswersFile } from '../export/profile';
import { VersionHistory } from '../components/VersionHistory';
import { CloudProfiles } from '../components/CloudProfiles';
import { CategorySelector } from '../components/CategorySelector';
import { coreAnsweredCount, coreSelectedTotal } from '../data/categories';
import { Disclaimer } from '../components/Disclaimer';
import { ZodiacBadge } from '../components/ZodiacBadge';
import { ChineseZodiacBadge } from '../components/ChineseZodiacBadge';
import { Oculus } from '../components/Oculus';
import { countAnswered, personaUnlockThreshold } from '../engine/scoring';
import { SHARED_AI } from '../services/openai';
import { getZodiacFromDate } from '../data/zodiac';
import { getChineseZodiac } from '../data/chineseZodiac';

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

const EXPECTATIONS = [
  'Two hundred and thirty-one scored statements across eight domains, plus seven optional packs you can opt into or skip.',
  'Answer as many or as few as you like — the portrait sharpens with every answer, and unlocks at 75% of the core questions.',
  'Your progress saves automatically in this browser, and your email simply labels the versions you save.',
  'Your answers live on your device. The optional AI features send a summary of your profile to OpenAI only when you choose to use them.',
];

/**
 * The homepage's inventory of what Selfscape actually does. Counts come from
 * the data files (see the dimension, figure, career and country tables) and
 * should be updated alongside them rather than rounded.
 */
const FEATURES: { title: string; blurb: string; badge?: string }[] = [
  {
    title: 'The assessment',
    blurb:
      '231 scored statements across personality, values, morals, politics, philosophy, ontology, humor and faith, measuring 45 distinct dimensions. Seven optional packs add 225 more — parenting, partnership, intimacy, hobbies, interests, education and travel.',
  },
  {
    title: 'Your portrait',
    blurb:
      'One of 14 archetypes, your outlook distilled into a single sentence, and a radar across all 45 dimensions — with a political compass, philosophical axes, your temperament, humor profile, and where you sit on faith and spirituality.',
  },
  {
    title: 'Echoes and affinities',
    blurb:
      'The historical figures whose outlook rhymes with yours, the career families that fit, the countries whose prevailing values line up, and where you land among 47 political parties across 9 countries.',
  },
  {
    title: 'Drawn and written by AI',
    blurb:
      'A generated persona name and an illustrated portrait, a short story starring it, and a worked example for any statement you find ambiguous. Then talk to a version of yourself built from your own answers — or to your exact opposite.',
  },
  {
    title: 'Compare two profiles',
    blurb:
      'Measure yourself against anyone else who has taken it, across every statement you both answered: broken down by domain, where you most align, where you clash, and a written reading of how the two of you are likely to mesh.',
  },
  {
    title: 'The Knowing Map',
    badge: 'New',
    blurb:
      'Answer a round of statements as you think someone else would, saying how sure you are each time. Scored against their real answers, it finds the quadrant nobody reaches alone: the places you were confident, and wrong.',
  },
  {
    title: 'Your Arc',
    badge: 'New',
    blurb:
      'Upload answer files from months or years ago and watch the portrait move — what shifted, what held, and the statements you now answer differently.',
  },
  {
    title: 'Yours to keep',
    blurb:
      'Download your answers as a file, save named versions to revisit, share a link that carries your whole profile, export a card or a PDF — or a written profile to paste into an AI assistant’s memory.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { answers, reset, importData, birthdate, setBirthdate, email, setEmail, selectedCategories } = useStore();

  const hasProgress = countAnswered(answers) > 0;
  const coreAnswered = coreAnsweredCount(answers);
  const coreTotal = coreSelectedTotal(selectedCategories);
  const pct = coreTotal ? Math.round((coreAnswered / coreTotal) * 100) : 0;
  const unlockThreshold = personaUnlockThreshold(coreTotal);
  const personaUnlocked = coreAnswered >= unlockThreshold;

  const [emailInput, setEmailInput] = useState(email);
  const canBegin = isValidEmail(emailInput);

  function handleEmail(value: string) {
    setEmailInput(value);
    setEmail(value); // persist as they type; gating uses the validated form
  }

  function begin() {
    if (!canBegin) return;
    setEmail(emailInput);
    navigate('/quiz');
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setRestoreError(null);
    try {
      const payload = await readAnswersFile(file);
      if (
        hasProgress &&
        !confirm('Restore from this file? It will replace your current answers.')
      ) {
        return;
      }
      importData(payload);
      navigate('/results');
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  const [parts, setParts] = useState(() => parseParts(birthdate));
  const { month, day, year } = parts;
  const zodiac = birthdate ? getZodiacFromDate(birthdate) : null;
  const chinese = birthdate ? getChineseZodiac(birthdate) : null;

  function handlePart(part: 'month' | 'day' | 'year', value: number) {
    const next = {
      month: part === 'month' ? value : month,
      day: part === 'day' ? value : day,
      year: part === 'year' ? value : year,
    };
    const maxDay = daysInMonth(next.month, next.year);
    if (next.day > maxDay) next.day = maxDay;
    setParts(next);
    setBirthdate(toISO(next.month, next.day, next.year));
  }

  const dayCount = daysInMonth(month, year);

  return (
    // The hero's Oculus glow deliberately bleeds wider than the column; `clip`
    // stops that from scrolling the page sideways on narrow screens without
    // creating a scroll container the way `hidden` would, so the glow still
    // spills vertically as intended.
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '26px 24px 72px', overflowX: 'clip' }}>
      {/* Hero — Oculus */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '64px 12px 30px' }}>
        <Oculus variant="hero" />
        <div style={{ position: 'relative' }}>
          <div className="kicker" style={{ letterSpacing: '.36em', fontSize: 12 }}>A Map of the Self</div>
          <h1 style={{ fontSize: 'clamp(58px, 13vw, 104px)', lineHeight: 0.92, letterSpacing: '-.025em', margin: '16px 0 0' }}>
            Selfscape
          </h1>
          <div style={{ width: 66, height: 1, background: 'var(--gold)', margin: '24px auto' }} />
          <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 580, margin: '0 auto' }}>
            Map your personality, values, morals, politics, philosophy, humor and faith — then receive a
            considered portrait of who you are, how you have changed, and how well you know the people
            closest to you.
          </p>
        </div>
      </div>

      {/* What Selfscape does — the full inventory, before asking for anything */}
      <section aria-label="What's inside" className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
        <div className="kicker">What&apos;s inside</div>
        <h2 className="font-display" style={{ fontSize: 28, margin: '6px 0 8px' }}>
          A portrait, and everything around it
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 20px' }}>
          Selfscape starts as a questionnaire and ends up as a record: of how you think now, how that has
          moved over time, and where it meets the people you share a life with.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ borderTop: '1px solid var(--divider)', paddingTop: 13 }}>
              <h3
                className="font-display"
                style={{ fontSize: 18, color: 'var(--ink)', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}
              >
                {f.title}
                {f.badge && (
                  <span
                    className="ss-chip"
                    style={{ fontSize: 10, padding: '1px 8px', letterSpacing: '.08em', textTransform: 'uppercase' }}
                  >
                    {f.badge}
                  </span>
                )}
              </h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-3)', margin: 0 }}>{f.blurb}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--ink-muted-2)', margin: '22px 0 0', lineHeight: 1.55 }}>
          The portrait and everything built on it unlock once you have answered 75% of the core
          questions. {SHARED_AI
            ? 'The AI features are ready to use — no key of your own needed.'
            : 'The AI features need your own OpenAI key, which you can add on the results page.'}
        </p>
      </section>

      {/* Sign up — email */}
      <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
        <div className="kicker">Sign in to begin</div>
        <p style={{ fontSize: 13, color: 'var(--ink-muted-2)', margin: '6px 0 16px' }}>
          Enter your email to start the assessment. It’s stored only in this browser and used to label
          and organise the results you save — it isn’t sent anywhere.
        </p>
        <input
          className="ss-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={emailInput}
          onChange={e => handleEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canBegin && begin()}
          placeholder="you@example.com"
          aria-label="Email address"
          style={{ width: '100%' }}
        />
        {emailInput.trim() !== '' && !canBegin && (
          <p style={{ fontSize: 12, color: 'var(--no)', marginTop: 8 }}>Enter a valid email address.</p>
        )}
        {canBegin && (
          <p style={{ fontSize: 12, color: 'var(--yes)', marginTop: 8 }}>You’re all set — begin below.</p>
        )}
      </div>

      {/* How it works — practicalities, distinct from the capability list above */}
      <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
        <div className="kicker" style={{ marginBottom: 14 }}>How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {EXPECTATIONS.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-3)' }}>
              <span style={{ color: 'var(--gold)' }} aria-hidden>✦</span>
              <span>{e}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zodiac */}
      <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
        <div className="kicker">Your zodiac sign</div>
        <p style={{ fontSize: 13, color: 'var(--ink-muted-2)', margin: '6px 0 16px' }}>
          Optional — adds your sign to the portrait and unlocks the illustrated persona.
        </p>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>Date of birth</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr', gap: 10 }}>
            <select className="ss-sel" value={month || ''} onChange={e => handlePart('month', Number(e.target.value))} aria-label="Month">
              <option value="">Month</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select className="ss-sel" value={day || ''} onChange={e => handlePart('day', Number(e.target.value))} aria-label="Day">
              <option value="">Day</option>
              {Array.from({ length: dayCount }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="ss-sel" value={year || ''} onChange={e => handlePart('year', Number(e.target.value))} aria-label="Year">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </fieldset>

        {zodiac && chinese ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <ZodiacBadge sign={zodiac} variant="mini" />
            <ChineseZodiacBadge result={chinese} />
          </div>
        ) : (month > 0 || day > 0 || year > 0) ? (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 }}>
            Select a complete date to reveal your signs.
          </p>
        ) : null}
      </div>

      {/* Choose which kinds of questions to answer */}
      <CategorySelector />

      {/* Note */}
      <div style={{ marginTop: 20 }}>
        <Disclaimer />
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
        {hasProgress ? (
          <>
            <button className="ss-cta ss-cta-primary" onClick={begin} disabled={!canBegin}>
              Continue · {pct}% answered →
            </button>
            <button
              className="ss-cta ss-cta-secondary"
              onClick={() => navigate('/results')}
              disabled={!personaUnlocked}
              title={personaUnlocked ? undefined : 'Answer at least 75% of the questions to unlock your persona'}
            >
              View my persona →
            </button>
            <button
              className="ss-topbtn"
              style={{ alignSelf: 'center' }}
              onClick={() => { if (confirm('Start over? This will erase all your answers.')) reset(); }}
            >
              Start over
            </button>
          </>
        ) : (
          <button className="ss-cta ss-cta-primary" onClick={begin} disabled={!canBegin}>Begin the journey →</button>
        )}
      </div>
      {!canBegin ? (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-muted)', marginTop: 12 }}>
          Enter your email above to begin the assessment.
        </p>
      ) : hasProgress && !personaUnlocked ? (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-muted)', marginTop: 12 }}>
          Your persona unlocks at 75% — {Math.max(0, unlockThreshold - coreAnswered)} more answer{unlockThreshold - coreAnswered === 1 ? '' : 's'} to go.
        </p>
      ) : null}

      {/* Saved versions */}
      <VersionHistory onLoad={() => navigate('/results')} />

      {/* Cloud profiles (only when a backend is configured) */}
      <CloudProfiles />

      {/* Restore from a saved answers file */}
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleRestoreFile}
          style={{ display: 'none' }}
        />
        <button className="ss-link" onClick={() => fileInputRef.current?.click()}>
          Restore from a saved file
        </button>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>
          Have a Selfscape answers file? Upload it to rebuild your portrait.
        </p>
        {restoreError && (
          <p style={{ fontSize: 13, color: '#b23b3b', marginTop: 8 }}>{restoreError}</p>
        )}
      </div>
    </div>
  );
}

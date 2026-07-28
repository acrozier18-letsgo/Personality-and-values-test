import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, isValidEmail } from '../store/useStore';
import { readAnswersFile } from '../export/profile';
import { VersionHistory } from '../components/VersionHistory';
import { Disclaimer } from '../components/Disclaimer';
import { ZodiacBadge } from '../components/ZodiacBadge';
import { ChineseZodiacBadge } from '../components/ChineseZodiacBadge';
import { Oculus } from '../components/Oculus';
import { QUESTIONS } from '../data/questions';
import { countAnswered, personaUnlockThreshold } from '../engine/scoring';
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
  'Over two hundred statements spanning personality, values, ethics, politics, philosophy, humor & faith.',
  'Answer as many or as few as you like — the portrait sharpens with more answers.',
  'Your progress is saved automatically in your browser.',
  'Sign in with your email to save multiple versions of your results and revisit them over time.',
  'Your email and answers stay on your device — nothing is sent to a server.',
];

export default function Landing() {
  const navigate = useNavigate();
  const { answers, reset, importData, birthdate, setBirthdate, email, setEmail } = useStore();

  const answered = countAnswered(answers);
  const hasProgress = answered > 0;
  const pct = Math.round((answered / QUESTIONS.length) * 100);
  const unlockThreshold = personaUnlockThreshold(QUESTIONS.length);
  const personaUnlocked = answered >= unlockThreshold;

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
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '26px 24px 72px' }}>
      {/* Hero — Oculus */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '64px 12px 30px' }}>
        <Oculus variant="hero" />
        <div style={{ position: 'relative' }}>
          <div className="kicker" style={{ letterSpacing: '.36em', fontSize: 12 }}>A Map of the Self</div>
          <h1 style={{ fontSize: 'clamp(58px, 13vw, 104px)', lineHeight: 0.92, letterSpacing: '-.025em', margin: '16px 0 0' }}>
            Selfscape
          </h1>
          <div style={{ width: 66, height: 1, background: 'var(--gold)', margin: '24px auto' }} />
          <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 560, margin: '0 auto' }}>
            Map your philosophy, values, and personality across more than two hundred questions — then
            receive a considered portrait of who you are.
          </p>
        </div>
      </div>

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

      {/* What to expect */}
      <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
        <div className="kicker" style={{ marginBottom: 14 }}>What to expect</div>
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
          Your persona unlocks at 75% — {unlockThreshold - answered} more answer{unlockThreshold - answered === 1 ? '' : 's'} to go.
        </p>
      ) : null}

      {/* Saved versions */}
      <VersionHistory onLoad={() => navigate('/results')} />

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

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QUESTIONS } from '../data/questions';
import { scoreAnswers, countAnswered } from '../engine/scoring';
import { synthesize } from '../engine/synthesis';
import { compareProfiles } from '../engine/compat';
import { coupleBrief } from '../engine/coupleBrief';
import type { CoupleNames } from '../engine/coupleBrief';
import { generateCoupleReport, SHARED_AI } from '../services/openai';
import { relationshipProgress, RELATIONSHIP_CATEGORY_KEYS } from '../data/categories';
import { PartnerConnect } from '../components/together/PartnerConnect';
import { CompatibilityMap } from '../components/together/CompatibilityMap';
import { CoupleReportView } from '../components/together/CoupleReportView';
import { CoupleChats } from '../components/together/CoupleChats';
import { SafetyFooter } from '../components/together/SafetyFooter';

export default function Together() {
  const navigate = useNavigate();
  const {
    answers, selfName, partner, coupleReport, setCoupleReport,
    apiKey, deepDive, selectedCategories, setCategories, lastSavedAt,
  } = useStore();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names: CoupleNames = useMemo(
    () => ({ you: selfName.trim() || 'You', them: partner?.displayName?.trim() || 'Your partner' }),
    [selfName, partner],
  );

  const compat = useMemo(
    () => (partner ? compareProfiles(answers, partner.answers) : null),
    [answers, partner],
  );

  const brief = useMemo(() => {
    if (!partner || !compat) return '';
    const resultYou = scoreAnswers(answers, QUESTIONS);
    const resultThem = scoreAnswers(partner.answers, QUESTIONS);
    return coupleBrief({
      names,
      personaYou: synthesize(resultYou),
      scoresYou: resultYou.scores,
      answersYou: answers,
      personaThem: synthesize(resultThem),
      scoresThem: resultThem.scores,
      answersThem: partner.answers,
      compat,
    });
  }, [answers, partner, compat, names]);

  const mine = relationshipProgress(answers, deepDive);
  const relationshipPacksOn = RELATIONSHIP_CATEGORY_KEYS.some(k => selectedCategories.includes(k));
  const canGenerate = Boolean(apiKey.trim()) || SHARED_AI;
  // The report was written against a snapshot; flag it once either side moves on.
  const stale = Boolean(coupleReport && lastSavedAt && coupleReport.generatedAt < lastSavedAt);

  async function handleGenerate() {
    if (!brief || generating) return;
    setGenerating(true);
    setError(null);
    try {
      setCoupleReport(await generateCoupleReport(apiKey.trim(), brief, names));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(
        msg.includes('401') ? 'Invalid API key — check it and try again.'
        : msg.includes('429') ? 'Rate limited — wait a minute and try again.'
        : msg.includes('quota') ? 'Quota exceeded on the OpenAI account.'
        : `Couldn’t write the report: ${msg}`,
      );
    } finally {
      setGenerating(false);
    }
  }

  function addRelationshipPacks() {
    setCategories([...new Set([...selectedCategories, ...RELATIONSHIP_CATEGORY_KEYS])]);
    navigate('/quiz');
  }

  return (
    <div>
      {/* Sticky header */}
      <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', borderBottom: '1px solid var(--card-border)', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button className="ss-topbtn" onClick={() => navigate('/')}>← Home</button>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => navigate('/results')}>
              My persona →
            </button>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => navigate('/quiz')}>
              Keep answering →
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 22px 70px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '44px 12px 30px' }}>
          <div className="kicker" style={{ letterSpacing: '.32em', fontSize: 12 }}>Two maps, one life</div>
          <h1 style={{ fontSize: 'clamp(46px, 10vw, 78px)', lineHeight: 0.95, letterSpacing: '-.025em', margin: '14px 0 0' }}>
            Together
          </h1>
          <div style={{ width: 66, height: 1, background: 'var(--gold)', margin: '22px auto' }} />
          <p style={{ fontSize: 17, lineHeight: 1.68, color: 'var(--ink-2)', maxWidth: 580, margin: '0 auto' }}>
            When you and your partner have both mapped yourselves, this page reads the two together — where
            you align, where you’ll rub, and how to actually talk to each other.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {/* Nudge to answer the relationship packs — without them this is thin */}
          {mine.answered < 30 && (
            <div className="ss-card" style={{ padding: '24px 26px', borderStyle: 'dashed', borderColor: 'rgba(182,130,53,.55)' }}>
              <div className="kicker" style={{ fontSize: 12 }}>Worth doing first</div>
              <h2 style={{ fontSize: 24, margin: '6px 0 10px' }}>Answer the relationship packs</h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 16px', maxWidth: 620 }}>
                The core assessment says who you are. These say how you <em>operate</em> — how you argue and
                repair, how you take bad news, how you handle money, the kids, and each other’s families.
                They’re what makes the guidance below specific rather than generic. You’ve answered{' '}
                <strong>{mine.answered}</strong> of {mine.total}.
              </p>
              <button className="ss-cta ss-cta-primary" onClick={addRelationshipPacks}>
                {relationshipPacksOn ? 'Continue answering →' : 'Add the relationship packs →'}
              </button>
            </div>
          )}

          <PartnerConnect />

          {partner && compat ? (
            <>
              <CompatibilityMap compat={compat} names={names} />

              {coupleReport ? (
                <CoupleReportView
                  report={coupleReport}
                  names={names}
                  stale={stale}
                  onRegenerate={handleGenerate}
                  regenerating={generating}
                />
              ) : (
                <section className="ss-card" style={{ padding: '30px 28px', textAlign: 'center' }}>
                  <div className="kicker">The report</div>
                  <h2 style={{ fontSize: 30, margin: '6px 0 10px' }}>Read the Two of You Closely</h2>
                  <p style={{ fontSize: 14.8, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 580, margin: '0 auto 20px' }}>
                    A counsellor’s read on both your assessments: how {names.them} thinks, how to talk to them,
                    how to ask them for things, how they take bad news, how you two handle conflict, the kids,
                    money, and family — written in both directions, so you can share it with them.
                  </p>
                  <button
                    className="ss-cta ss-cta-primary"
                    onClick={handleGenerate}
                    disabled={generating || !canGenerate}
                    title={canGenerate ? undefined : 'Add an OpenAI key below to generate the report'}
                  >
                    {generating ? 'Writing your report…' : 'Generate our report'}
                  </button>
                  {!canGenerate && (
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 12 }}>
                      Add your OpenAI key in the chat below to enable this — it’s stored only in your browser.
                    </p>
                  )}
                  {error && <p style={{ fontSize: 13.5, color: 'var(--no)', marginTop: 14 }}>{error}</p>}
                </section>
              )}

              {error && coupleReport && (
                <p style={{ fontSize: 13.5, color: 'var(--no)', textAlign: 'center' }}>{error}</p>
              )}

              <CoupleChats brief={brief} names={names} />
            </>
          ) : (
            <section className="ss-card" style={{ padding: '34px 28px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(182,130,53,.45)' }}>
              <div className="kicker">Waiting on your partner</div>
              <h2 style={{ fontSize: 28, margin: '8px 0 10px' }}>Nothing to Compare Yet</h2>
              <p style={{ fontSize: 14.8, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 540, margin: '0 auto' }}>
                Load your partner’s file above and this page fills in: a domain-by-domain map of where you
                align, the exact statements you answered differently, a full report in both directions, and
                two conversations to help you use it.
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 16 }}>
                You’ve answered {countAnswered(answers)} statements so far.
              </p>
            </section>
          )}

          <SafetyFooter />
        </div>
      </div>
    </div>
  );
}

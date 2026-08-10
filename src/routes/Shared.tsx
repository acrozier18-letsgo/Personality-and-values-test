import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { decodeProfile } from '../engine/shareCode';
import { countAnswered } from '../engine/scoring';
import { CompatibilityPanel } from '../components/CompatibilityPanel';
import { Oculus } from '../components/Oculus';

export default function Shared() {
  const { code } = useParams();
  const navigate = useNavigate();
  const answers = useStore(s => s.answers);

  const theirAnswers = useMemo(() => decodeProfile(code ?? ''), [code]);
  const theirCount = Object.keys(theirAnswers).length;
  const yourCount = countAnswered(answers);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '30px 22px 70px' }}>
      <div style={{ position: 'relative', textAlign: 'center', padding: '30px 12px 20px' }}>
        <Oculus variant="hero" />
        <div style={{ position: 'relative' }}>
          <div className="kicker" style={{ letterSpacing: '.32em' }}>A shared profile</div>
          <h1 style={{ fontSize: 'clamp(38px, 8vw, 60px)', margin: '10px 0 0', letterSpacing: '-.02em' }}>Compare Profiles</h1>
        </div>
      </div>

      {theirCount === 0 ? (
        <div className="ss-card" style={{ maxWidth: 560, margin: '10px auto 0', padding: '28px 30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            This share link doesn’t contain a readable profile. Ask for a fresh link, or start your own
            Selfscape.
          </p>
          <button className="ss-cta ss-cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Start Selfscape →</button>
        </div>
      ) : yourCount === 0 ? (
        <div className="ss-card" style={{ maxWidth: 560, margin: '10px auto 0', padding: '28px 30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Someone shared their Selfscape profile with you — it has <strong>{theirCount}</strong> answers.
            Take the assessment yourself to see how the two of you compare.
          </p>
          <button className="ss-cta ss-cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Begin the assessment →</button>
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14, maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Someone shared their profile ({theirCount} answers). Here’s how it lines up with yours — the
            shared profile is preset as Profile B.
          </p>
          <CompatibilityPanel answers={answers} initialOther={{ label: 'Shared profile', answers: theirAnswers }} />
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <button className="ss-cta ss-cta-secondary" onClick={() => navigate('/results')}>← Back to my results</button>
          </div>
        </>
      )}
    </div>
  );
}

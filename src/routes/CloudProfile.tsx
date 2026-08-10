import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getProfile } from '../services/backend';
import { countAnswered } from '../engine/scoring';
import type { Answer } from '../engine/scoring';
import { CompatibilityPanel } from '../components/CompatibilityPanel';
import { Oculus } from '../components/Oculus';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; label: string; answers: Record<string, Answer> };

export default function CloudProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myAnswers = useStore(s => s.answers);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    getProfile(id ?? '')
      .then(p => { if (alive) setState({ status: 'ok', label: p.label, answers: p.answers }); })
      .catch(e => { if (alive) setState({ status: 'error', message: e instanceof Error ? e.message : 'Could not load this profile.' }); });
    return () => { alive = false; };
  }, [id]);

  const yourCount = countAnswered(myAnswers);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '30px 22px 70px' }}>
      <div style={{ position: 'relative', textAlign: 'center', padding: '30px 12px 20px' }}>
        <Oculus variant="hero" />
        <div style={{ position: 'relative' }}>
          <div className="kicker" style={{ letterSpacing: '.32em' }}>A shared profile</div>
          <h1 style={{ fontSize: 'clamp(38px, 8vw, 60px)', margin: '10px 0 0', letterSpacing: '-.02em' }}>Compare Profiles</h1>
        </div>
      </div>

      {state.status === 'loading' ? (
        <p style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>Loading the shared profile…</p>
      ) : state.status === 'error' ? (
        <div className="ss-card" style={{ maxWidth: 560, margin: '10px auto 0', padding: '28px 30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>{state.message}</p>
          <button className="ss-cta ss-cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Start Selfscape →</button>
        </div>
      ) : yourCount === 0 ? (
        <div className="ss-card" style={{ maxWidth: 560, margin: '10px auto 0', padding: '28px 30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong>{state.label}</strong> shared their Selfscape profile. Take the assessment yourself to
            see how the two of you compare.
          </p>
          <button className="ss-cta ss-cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Begin the assessment →</button>
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14, maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Comparing your answers with <strong>{state.label}</strong> — preset as Profile B below.
          </p>
          <CompatibilityPanel answers={myAnswers} initialOther={{ label: state.label, answers: state.answers }} />
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <button className="ss-cta ss-cta-secondary" onClick={() => navigate('/results')}>← Back to my results</button>
          </div>
        </>
      )}
    </div>
  );
}

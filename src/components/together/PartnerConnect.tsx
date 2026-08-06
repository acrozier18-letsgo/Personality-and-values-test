import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { buildPartnerFile, readPartnerFile, emailLinkProvider } from '../../partner/link';
import { downloadTextFile } from '../../export/profile';
import { countAnswered } from '../../engine/scoring';
import { relationshipProgress } from '../../data/categories';

/**
 * Getting two people's answers into one place. Today that means one of them
 * exports a share file and the other imports it — which also means neither
 * profile ever leaves a device except by its owner's deliberate act.
 */
export function PartnerConnect() {
  const {
    answers, refineAnswers, birthdate, deepDive,
    selfName, setSelfName, partner, setPartner, renamePartner,
  } = useStore();

  const [includeIntimacy, setIncludeIntimacy] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const mine = relationshipProgress(answers, deepDive);
  const answered = countAnswered(answers);

  function handleShare() {
    const file = buildPartnerFile({
      displayName: selfName || 'Your partner',
      birthdate,
      answers,
      refineAnswers,
      includeIntimacy,
    });
    const slug = (selfName || 'selfscape').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    downloadTextFile(`${slug}-selfscape-share.json`, JSON.stringify(file, null, 2), 'application/json');
    setShared(true);
    setTimeout(() => setShared(false), 2600);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const profile = await readPartnerFile(file);
      if (partner && !confirm(`Replace ${partner.displayName}'s profile with this one?`)) return;
      setPartner(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  return (
    <section aria-label="Connect with your partner" className="ss-card" style={{ padding: '26px 28px' }}>
      <div className="kicker">Step one</div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Bring Both Profiles Together</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 22px', maxWidth: 640 }}>
        You each answer Selfscape on your own device, then one of you shares a file with the other.
        Nothing is uploaded anywhere — the comparison happens right here in your browser.
      </p>

      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 12, color: 'var(--ink-muted)', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
          What should we call you?
        </label>
        <input
          className="ss-input"
          value={selfName}
          onChange={e => setSelfName(e.target.value)}
          placeholder="Your first name"
          aria-label="Your name"
          style={{ maxWidth: 280 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
        {/* ── Share yours ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kicker" style={{ fontSize: 12 }}>Share yours</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0 }}>
            Send your partner a copy of your answers so they can run this page from their side.
            You’ve answered <strong>{answered}</strong> statements, {mine.answered} of {mine.total} in the
            relationship packs.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeIntimacy}
              onChange={e => setIncludeIntimacy(e.target.checked)}
              style={{ marginTop: 2, flex: 'none' }}
            />
            <span>Include my Intimacy &amp; Sex Life answers. Left off, they are stripped from the file entirely.</span>
          </label>
          <button className="ss-cta ss-cta-primary" onClick={handleShare} disabled={answered === 0}>
            {shared ? 'File downloaded ✓' : 'Share with my partner'}
          </button>
        </div>

        {/* ── Import theirs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kicker" style={{ fontSize: 12 }}>Load theirs</div>
          {partner ? (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0 }}>
                Linked with <strong>{partner.displayName}</strong> — {countAnswered(partner.answers)} statements
                answered{partner.includesIntimacy ? ', including intimacy' : ''}.
              </p>
              <input
                className="ss-input"
                value={partner.displayName}
                onChange={e => renamePartner(e.target.value)}
                placeholder="Their name"
                aria-label="Partner's name"
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="ss-cta ss-cta-secondary" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                  Replace file
                </button>
                <button
                  className="ss-cta ss-cta-secondary"
                  onClick={() => { if (confirm(`Unlink ${partner.displayName}? Their answers are removed from this device.`)) setPartner(null); }}
                >
                  Unlink
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0 }}>
                Got the file your partner sent? Load it here and the whole page comes to life.
                A plain Selfscape answers backup works too.
              </p>
              <button className="ss-cta ss-cta-primary" onClick={() => fileRef.current?.click()}>
                Load my partner’s file
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} style={{ display: 'none' }} />
          {error && <p style={{ fontSize: 13, color: 'var(--no)', margin: 0 }}>{error}</p>}
        </div>
      </div>

      {/* ── Email invite: real flow, not yet available ── */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--card-border)' }}>
        <div className="kicker" style={{ fontSize: 12 }}>Coming soon · Invite by email</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: '8px 0 12px', maxWidth: 620 }}>
          {emailLinkProvider.unavailableReason()}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 460 }}>
          <input
            className="ss-input"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="partner@example.com"
            aria-label="Partner's email address"
            disabled
            style={{ flex: 1, minWidth: 200, opacity: 0.55 }}
          />
          <button className="ss-cta ss-cta-secondary" disabled title={emailLinkProvider.unavailableReason()}>
            Send invite
          </button>
        </div>
      </div>
    </section>
  );
}

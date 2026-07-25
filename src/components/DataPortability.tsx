import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { ScoringResult } from '../engine/scoring';
import type { Persona } from '../engine/synthesis';
import {
  downloadAnswers,
  downloadTextFile,
  buildMemoryMarkdown,
  copyToClipboard,
} from '../export/profile';

interface Props {
  persona: Persona;
  result: ScoringResult;
}

export function DataPortability({ persona, result }: Props) {
  const { answers, refineAnswers, birthdate, saveVersion, versions } = useStore();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSaveVersion() {
    const suggested = `Version ${versions.length + 1} · ${new Date().toLocaleDateString()}`;
    const label = prompt('Name this saved version:', suggested);
    if (label == null) return; // cancelled
    saveVersion(label);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  function handleDownloadAnswers() {
    downloadAnswers({ answers, refineAnswers, birthdate });
  }

  function handleDownloadMemory() {
    const md = buildMemoryMarkdown(persona, result, birthdate);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`selfscape-profile-${stamp}.md`, md, 'text/markdown');
  }

  async function handleCopyMemory() {
    const md = buildMemoryMarkdown(persona, result, birthdate);
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      // Clipboard blocked (e.g. insecure context) — fall back to a download.
      handleDownloadMemory();
    }
  }

  return (
    <section aria-label="Save & export" className="ss-card" style={{ padding: '26px 28px' }}>
      <div className="kicker">Save &amp; export</div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Take Your Results With You</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 20px', maxWidth: 620 }}>
        Everything lives in your browser. Save a copy of your answers so you can restore your
        portrait later or on another device — or export a profile to give an AI assistant a
        head start on who you are.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kicker" style={{ fontSize: 12 }}>Save a version</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0, minHeight: 58 }}>
            Snapshot these answers under your email. Revisit or compare saved versions anytime from the
            home page{versions.length > 0 ? ` (${versions.length} saved)` : ''}.
          </p>
          <button className="ss-cta ss-cta-primary" onClick={handleSaveVersion}>
            {saved ? 'Saved ✓' : 'Save this version'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kicker" style={{ fontSize: 12 }}>Backup</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0, minHeight: 58 }}>
            A file of all your answers. Keep it safe — upload it on the home page after starting
            over to regenerate this exact portrait.
          </p>
          <button className="ss-cta ss-cta-secondary" onClick={handleDownloadAnswers}>
            Download my answers
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="kicker" style={{ fontSize: 12 }}>For an AI assistant</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0, minHeight: 58 }}>
            A readable summary of your personality, values and outlook — paste it into a Claude
            project&apos;s memory so it knows who it&apos;s talking to.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="ss-cta ss-cta-primary" style={{ flex: 1 }} onClick={handleCopyMemory}>
              {copied ? 'Copied ✓' : 'Copy profile'}
            </button>
            <button className="ss-cta ss-cta-secondary" onClick={handleDownloadMemory}>
              Download .md
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

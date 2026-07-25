import { useStore } from '../store/useStore';

interface Props {
  /** Called after a version is loaded (e.g. to navigate to results). */
  onLoad?: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function VersionHistory({ onLoad }: Props) {
  const { versions, loadVersion, deleteVersion, renameVersion } = useStore();

  if (versions.length === 0) return null;

  function handleLoad(id: string) {
    loadVersion(id);
    onLoad?.();
  }

  function handleRename(id: string, current: string) {
    const next = prompt('Rename this version:', current);
    if (next != null) renameVersion(id, next);
  }

  return (
    <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
      <div className="kicker">Your saved results</div>
      <p style={{ fontSize: 13, color: 'var(--ink-muted-2)', margin: '6px 0 16px' }}>
        Snapshots you saved from the results page. Load one to revisit that portrait, or compare how
        your answers have shifted over time.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {versions.map((v) => (
          <div
            key={v.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              flexWrap: 'wrap', padding: '12px 14px', border: '1px solid var(--card-border)',
              borderRadius: 6, background: 'var(--tint-gold)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 17, color: 'var(--ink-3)' }}>{v.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted-2)', marginTop: 2 }}>
                {formatDate(v.createdAt)} · {v.answeredCount} answered
                {v.email ? ` · ${v.email}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="ss-cta ss-cta-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleLoad(v.id)}>
                Load
              </button>
              <button className="ss-topbtn" style={{ fontSize: 12 }} onClick={() => handleRename(v.id, v.label)}>
                Rename
              </button>
              <button
                className="ss-topbtn"
                style={{ fontSize: 12, color: 'var(--no)' }}
                onClick={() => { if (confirm(`Delete "${v.label}"? This can't be undone.`)) deleteVersion(v.id); }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { PROFILES_ENABLED, listProfiles, deleteProfile, cloudShareUrl } from '../services/backend';
import type { CloudProfileMeta } from '../services/backend';
import { copyToClipboard } from '../export/profile';
import { useStore, isValidEmail } from '../store/useStore';

export function CloudProfiles() {
  const email = useStore(s => s.email);
  const [items, setItems] = useState<CloudProfileMeta[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!PROFILES_ENABLED || !isValidEmail(email)) { setItems(null); return; }
    let alive = true;
    listProfiles(email)
      .then(r => { if (alive) setItems(r.profiles); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [email]);

  if (!PROFILES_ENABLED || !isValidEmail(email) || !items || items.length === 0) return null;

  async function copy(id: string) {
    const ok = await copyToClipboard(cloudShareUrl(id));
    if (ok) { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
  }
  async function remove(id: string) {
    if (!confirm('Delete this cloud profile? Its share link will stop working.')) return;
    try { await deleteProfile(id); setItems(prev => (prev ?? []).filter(p => p.id !== id)); } catch { /* ignore */ }
  }

  return (
    <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
      <div className="kicker">Your cloud profiles</div>
      <p style={{ fontSize: 13, color: 'var(--ink-muted-2)', margin: '6px 0 16px' }}>
        Profiles you saved to the cloud, linked to {email}. Copy a link to share, or delete to revoke it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 14px', border: '1px solid var(--card-border)', borderRadius: 6, background: 'var(--tint-gold)' }}>
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 17, color: 'var(--ink-3)' }}>{p.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted-2)', marginTop: 2 }}>
                {new Date(p.updated_at).toLocaleDateString()} · /p/{p.id}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="ss-cta ss-cta-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => copy(p.id)}>
                {copiedId === p.id ? 'Copied ✓' : 'Copy link'}
              </button>
              <button className="ss-topbtn" style={{ fontSize: 12, color: 'var(--no)' }} onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

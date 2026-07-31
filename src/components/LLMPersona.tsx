import { useState } from 'react';
import { Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { generateLLMPersona, SHARED_AI } from '../services/openai';
import { useStore } from '../store/useStore';
import type { ZodiacSign } from '../data/zodiac';
import type { Archetype } from '../data/archetypes';
import type { DimensionKey } from '../data/dimensions';
import type { DimensionScore } from '../engine/scoring';
import type { LLMPersonaResult } from '../services/openai';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
  zodiac: ZodiacSign;
  archetype: Archetype;
  identitySentence: string;
  stored: LLMPersonaResult | null;
  onResult: (r: LLMPersonaResult | null) => void;
}

export function LLMPersona({ scores, zodiac, archetype, identitySentence, stored, onResult }: Props) {
  const apiKey = useStore(s => s.apiKey);
  const setApiKey = useStore(s => s.setApiKey);
  const [showKey, setShowKey] = useState(false);
  const [showKeyField, setShowKeyField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const keyReady = Boolean(apiKey.trim());
  const canGenerate = keyReady || SHARED_AI;

  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateLLMPersona(apiKey.trim(), scores, zodiac, archetype, identitySentence);
      onResult(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg.includes('401') ? 'Invalid API key — check and try again.'
              : msg.includes('429') ? 'Rate limited — wait a moment and try again.'
              : msg.includes('quota') ? 'Quota exceeded on your OpenAI account.'
              : `Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="AI-generated persona">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Illustrated</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Your AI Portrait</h2>
      </div>

      {stored ? (
        <div className="ss-card" style={{ overflow: 'hidden', borderColor: 'rgba(182,130,53,.35)' }}>
          {stored.imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={stored.imageUrl} alt={stored.title} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,18,14,.78), rgba(20,18,14,.1) 45%, transparent)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 26 }}>
                <h3 className="font-display" style={{ fontSize: 34, color: '#fff', margin: '0 0 4px', textShadow: '0 2px 12px rgba(0,0,0,.4)' }}>{stored.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.5, margin: 0 }}>{stored.subtitle}</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: 26 }}>
              <h3 className="font-display" style={{ fontSize: 26, color: 'var(--gold-deep)', margin: '0 0 6px' }}>{stored.title}</h3>
              <p style={{ color: 'var(--ink-2)' }}>{stored.subtitle}</p>
            </div>
          )}
          <div style={{ padding: 16, borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button className="ss-topbtn" style={{ fontSize: 12 }} onClick={() => setShowPrompt(p => !p)}>
              {showPrompt ? 'Hide' : 'Show'} image prompt
            </button>
            <button className="ss-cta ss-cta-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => { onResult(null); generate(); }} disabled={loading}>
              <RefreshCw className="w-3 h-3" aria-hidden /> Regenerate
            </button>
          </div>
          {showPrompt && stored.imagePrompt && (
            <div style={{ padding: '0 16px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted-2)', fontStyle: 'italic', lineHeight: 1.6, background: 'var(--tint-gold)', borderRadius: 4, padding: 12 }}>{stored.imagePrompt}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="ss-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            {SHARED_AI
              ? 'Generate a unique name and an AI illustration for your persona — just tap the button.'
              : 'Generate a unique name and an AI illustration for your persona. Your key is stored only in your browser and never sent anywhere except directly to OpenAI.'}
          </p>

          {keyReady ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13.5 }}>
              <span style={{ color: 'var(--yes)' }}>✓ Using your saved OpenAI key.</span>
              <button className="ss-link" onClick={() => { setApiKey(''); setShowKeyField(true); }}>
                Use a different key
              </button>
            </div>
          ) : SHARED_AI && !showKeyField ? (
            <button className="ss-link" style={{ alignSelf: 'flex-start', fontSize: 13.5 }} onClick={() => setShowKeyField(true)}>
              Use your own OpenAI key (optional) →
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                className="ss-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canGenerate && generate()}
                placeholder={SHARED_AI ? 'sk-… (optional — your own key)' : 'sk-...'}
                style={{ paddingRight: 40 }}
                aria-label="OpenAI API key"
                autoFocus={showKeyField}
              />
              <button type="button" onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label={showKey ? 'Hide key' : 'Show key'}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
          {error && <p style={{ fontSize: 13, color: 'var(--no)' }}>{error}</p>}
          <button className="ss-cta ss-cta-primary" style={{ width: '100%' }} onClick={generate} disabled={!canGenerate || loading}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Generating your portrait…</>) : 'Generate AI Portrait'}
          </button>
          {loading && (
            <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--ink-faint)' }}>
              This takes about 15–25 seconds — GPT-4o-mini crafts your title, then the image model paints it.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

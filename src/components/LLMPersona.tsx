import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { generateLLMPersona } from '../services/openai';
import { getStoredApiKey, saveApiKey } from '../store/useStore';
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
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  async function generate() {
    if (!apiKey.trim()) return;
    saveApiKey(apiKey.trim());
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
    <section aria-label="AI-generated persona" className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-500" aria-hidden />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your AI Portrait</h2>
      </div>

      {/* Result card */}
      {stored && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-violet-200 dark:border-violet-800 overflow-hidden">
          {stored.imageUrl && (
            <div className="relative">
              <img
                src={stored.imageUrl}
                alt={stored.title}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stored.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{stored.subtitle}</p>
              </div>
            </div>
          )}
          {!stored.imageUrl && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-violet-700 dark:text-violet-300 mb-2">{stored.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{stored.subtitle}</p>
            </div>
          )}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowPrompt(p => !p)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {showPrompt ? 'Hide' : 'Show'} image prompt
            </button>
            <button
              onClick={() => { onResult(null); generate(); }}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" aria-hidden />
              Regenerate
            </button>
          </div>
          {showPrompt && stored.imagePrompt && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 italic leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {stored.imagePrompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* API key input + generate button */}
      {!stored && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your OpenAI API key to generate a unique name and DALL-E 3 illustration for your persona.
            Your key is stored only in your browser and never sent anywhere except directly to OpenAI.
          </p>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && apiKey.trim() && generate()}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              aria-label="OpenAI API key"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            onClick={generate}
            disabled={!apiKey.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Generating your portrait…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden />
                Generate AI Portrait
              </>
            )}
          </button>

          {loading && (
            <p className="text-xs text-center text-gray-400">
              This takes about 15–25 seconds — GPT-4o-mini crafts your title, then DALL-E 3 paints it.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Send, Eye, EyeOff } from 'lucide-react';
import { chatWithPersona, SHARED_AI } from '../services/openai';
import type { ChatMessage } from '../services/openai';
import { getStoredApiKey, saveApiKey } from '../store/useStore';
import { scoreAnswers } from '../engine/scoring';
import { synthesize } from '../engine/synthesis';
import { invertAnswers, selfSystemPrompt, antiSystemPrompt } from '../engine/personaChat';
import { QUESTIONS } from '../data/questions';
import type { Answer, ScoringResult } from '../engine/scoring';
import type { Persona } from '../engine/synthesis';

interface Props {
  persona: Persona;
  result: ScoringResult;
  answers: Record<string, Answer>;
}

type Mode = 'self' | 'anti';

const MODE_META: Record<Mode, { tab: string; heading: string; blurb: string; suggestions: string[] }> = {
  self: {
    tab: 'Talk to Yourself',
    heading: 'Yourself',
    blurb: "A reflection of you, built from your answers. Ask it anything you'd ask your own inner voice.",
    suggestions: ['What should I focus on right now?', 'What am I like at my best?', 'Help me think through a hard choice.'],
  },
  anti: {
    tab: 'Talk to Anti-You',
    heading: 'Anti-You',
    blurb: "Your mirror image — built from the exact opposite of every answer. Meet the you that isn't.",
    suggestions: ["Why do you think I'm wrong about life?", "What do you value that I don't?", 'Convince me to try your way.'],
  },
};

export function PersonaChats({ persona, result, answers }: Props) {
  const [mode, setMode] = useState<Mode>('self');
  const [threads, setThreads] = useState<Record<Mode, ChatMessage[]>>({ self: [], anti: [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The "Anti-You" persona is synthesised from a fully inverted answer set.
  const antiPersona = useMemo<Persona>(() => {
    const inverted = scoreAnswers(invertAnswers(answers), QUESTIONS);
    return synthesize(inverted);
  }, [answers]);
  const antiScores = useMemo(() => scoreAnswers(invertAnswers(answers), QUESTIONS).scores, [answers]);

  const systemPrompt = useMemo(
    () =>
      mode === 'self'
        ? selfSystemPrompt(persona, result.scores)
        : antiSystemPrompt(antiPersona, antiScores),
    [mode, persona, result.scores, antiPersona, antiScores],
  );

  const messages = threads[mode];
  const canChat = Boolean(apiKey.trim()) || SHARED_AI;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !canChat) return;
    if (apiKey.trim()) saveApiKey(apiKey.trim());
    setError(null);
    setInput('');
    const nextHistory: ChatMessage[] = [...threads[mode], { role: 'user', content: trimmed }];
    setThreads((t) => ({ ...t, [mode]: nextHistory }));
    setLoading(true);
    try {
      const reply = await chatWithPersona(apiKey.trim(), systemPrompt, nextHistory);
      setThreads((t) => ({ ...t, [mode]: [...nextHistory, { role: 'assistant', content: reply }] }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(
        msg.includes('401') ? 'Invalid API key — check and try again.'
        : msg.includes('429') ? 'Rate limited — wait a moment and try again.'
        : msg.includes('quota') ? 'Quota exceeded on the OpenAI account.'
        : `Error: ${msg}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const meta = MODE_META[mode];

  return (
    <section aria-label="Talk to yourself and your opposite">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">In dialogue</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Talk to Yourself &amp; Your Opposite</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', maxWidth: 560, margin: '10px auto 0', lineHeight: 1.6 }}>
          Two conversational reflections drawn from your answers — one that embodies you, and one built
          from the exact opposite of everything you said.
        </p>
      </div>

      <div className="ss-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
          {(['self', 'anti'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1,
                  padding: '14px 10px',
                  border: 'none',
                  background: active ? 'var(--tint-gold)' : 'transparent',
                  color: active ? 'var(--gold-deep)' : 'var(--ink-muted)',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: 15,
                  borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                }}
                aria-pressed={active}
              >
                {MODE_META[m].tab}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, padding: '12px 18px 0', lineHeight: 1.55 }}>
          {meta.blurb}
        </p>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{ maxHeight: 380, minHeight: 180, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {messages.length === 0 && !loading ? (
            <div style={{ margin: 'auto 0', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--ink-faint)', marginBottom: 14 }}>
                Start a conversation with {meta.heading}.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {meta.suggestions.map((s) => (
                  <button
                    key={s}
                    className="ss-chip"
                    style={{ cursor: canChat ? 'pointer' : 'not-allowed', opacity: canChat ? 1 : 0.5 }}
                    disabled={!canChat}
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  background: m.role === 'user' ? 'var(--gold)' : 'var(--tint-gold)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink-3)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--card-border)',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                }}
              >
                {m.content}
              </div>
            ))
          )}
          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-muted)', fontSize: 13, padding: '4px 6px' }}>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {meta.heading} is thinking…
            </div>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--no)', margin: 0, padding: '0 18px 8px' }}>{error}</p>
        )}

        {/* Composer */}
        <div style={{ borderTop: '1px solid var(--card-border)', padding: 14 }}>
          {canChat ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                className="ss-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={`Message ${meta.heading}…`}
                aria-label={`Message ${meta.heading}`}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button
                className="ss-cta ss-cta-primary"
                style={{ padding: '9px 16px' }}
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
                Enter your OpenAI API key to chat. It’s stored only in your browser.
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  className="ss-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  aria-label="OpenAI API key"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowKey((v) => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        These are AI role-plays generated from your answers — for fun and reflection, not real advice.
      </p>
    </section>
  );
}

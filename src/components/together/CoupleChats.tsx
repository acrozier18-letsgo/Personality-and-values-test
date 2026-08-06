import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Send, Eye, EyeOff } from 'lucide-react';
import { chatWithPersona, SHARED_AI } from '../../services/openai';
import type { ChatMessage } from '../../services/openai';
import { useStore } from '../../store/useStore';
import { counsellorSystemPrompt, partnerSystemPrompt } from '../../engine/coupleChat';
import type { CoupleNames } from '../../engine/coupleBrief';

type Mode = 'counsellor' | 'partner';

/**
 * The two conversations: one with a counsellor who has read both profiles, one
 * rehearsing with a stand-in for your partner. Same shape as the Selfscape
 * self/anti chats so it feels like the same product.
 */
export function CoupleChats({ brief, names }: { brief: string; names: CoupleNames }) {
  const [mode, setMode] = useState<Mode>('counsellor');
  const [threads, setThreads] = useState<Record<Mode, ChatMessage[]>>({ counsellor: [], partner: [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = useStore(s => s.apiKey);
  const setApiKey = useStore(s => s.setApiKey);
  const [showKey, setShowKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const MODE_META: Record<Mode, { tab: string; heading: string; blurb: string; suggestions: string[] }> = {
    counsellor: {
      tab: 'Talk to a counsellor',
      heading: 'the counsellor',
      blurb: `A counsellor who has read both your assessments. Bring a real, specific disagreement — the more concrete you are, the more useful this is.`,
      suggestions: [
        'We keep having the same argument about the housework.',
        `How do I bring up something ${names.them} is sensitive about?`,
        'We want different things for the holidays. Help.',
      ],
    },
    partner: {
      tab: `Rehearse with ${names.them}`,
      heading: names.them,
      blurb: `Practise a hard conversation with a stand-in for ${names.them}, built from their own answers. It's a rehearsal room, not a window into their head.`,
      suggestions: [
        'Can we talk about money this weekend?',
        'I need to tell you I’ve been feeling alone lately.',
        'I want to change how we split the school runs.',
      ],
    },
  };

  const systemPrompt = useMemo(
    () => (mode === 'counsellor' ? counsellorSystemPrompt(brief, names) : partnerSystemPrompt(brief, names)),
    [mode, brief, names],
  );

  const messages = threads[mode];
  const canChat = Boolean(apiKey.trim()) || SHARED_AI;
  const meta = MODE_META[mode];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !canChat) return;
    setError(null);
    setInput('');
    const nextHistory: ChatMessage[] = [...threads[mode], { role: 'user', content: trimmed }];
    setThreads(t => ({ ...t, [mode]: nextHistory }));
    setLoading(true);
    try {
      const reply = await chatWithPersona(apiKey.trim(), systemPrompt, nextHistory);
      setThreads(t => ({ ...t, [mode]: [...nextHistory, { role: 'assistant', content: reply }] }));
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

  return (
    <section aria-label="Talk it through">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">In dialogue</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Talk It Through</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', maxWidth: 580, margin: '10px auto 0', lineHeight: 1.6 }}>
          Two conversations built from both your answers — one to think with, one to practise on.
        </p>
      </div>

      <div className="ss-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
          {(['counsellor', 'partner'] as Mode[]).map(m => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1, padding: '14px 10px', border: 'none',
                  background: active ? 'var(--tint-gold)' : 'transparent',
                  color: active ? 'var(--gold-deep)' : 'var(--ink-muted)',
                  fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: 15,
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

        <div
          ref={scrollRef}
          style={{ maxHeight: 420, minHeight: 200, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {messages.length === 0 && !loading ? (
            <div style={{ margin: 'auto 0', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--ink-faint)', marginBottom: 14 }}>
                {mode === 'counsellor' ? 'What would you like to work on?' : `Open the conversation with ${names.them}.`}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {meta.suggestions.map(s => (
                  <button
                    key={s}
                    className="ss-chip"
                    style={{ cursor: canChat ? 'pointer' : 'not-allowed', opacity: canChat ? 1 : 0.5, textAlign: 'left' }}
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
                  maxWidth: '82%', padding: '10px 14px', borderRadius: 14,
                  fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
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

        {error && <p style={{ fontSize: 13, color: 'var(--no)', margin: 0, padding: '0 18px 8px' }}>{error}</p>}

        <div style={{ borderTop: '1px solid var(--card-border)', padding: 14 }}>
          {canChat ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                className="ss-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={mode === 'counsellor' ? 'Describe what’s going on…' : `Say something to ${names.them}…`}
                aria-label="Message"
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
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  aria-label="OpenAI API key"
                  style={{ paddingRight: 40, width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 12, lineHeight: 1.5, maxWidth: 560, marginInline: 'auto' }}>
        Both of these are AI, generated from questionnaire answers. The rehearsal is a stand-in built from
        what {names.them} wrote — not {names.them}, and not a way to know what they’re really thinking.
      </p>
    </section>
  );
}

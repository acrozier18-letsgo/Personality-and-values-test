import type { DimensionKey } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';
import type { DimensionScore } from '../engine/scoring';
import type { ZodiacSign } from '../data/zodiac';
import type { Archetype } from '../data/archetypes';

// Optional shared proxy (Cloudflare Worker) that holds the site's OpenAI key
// server-side. When configured, visitors can use AI features without their own key.
// Tolerate a value entered without a scheme (e.g. "foo.workers.dev").
const RAW_PROXY = (import.meta.env.VITE_OPENAI_PROXY_URL ?? '').trim().replace(/\/+$/, '');
const PROXY_URL = RAW_PROXY && !/^https?:\/\//i.test(RAW_PROXY) ? `https://${RAW_PROXY}` : RAW_PROXY;

/** True when a shared key is available, so AI features work without the user entering one. */
export const SHARED_AI = Boolean(PROXY_URL);

// The OpenAI SDK is ~500 kB; load it lazily only when a call is actually made,
// so it stays out of the initial bundle.
async function getClient(apiKey: string) {
  const { default: OpenAI } = await import('openai');
  // A personal key always calls OpenAI directly (their own quota).
  if (apiKey) return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  // Otherwise route through the shared proxy, which injects the real key.
  if (PROXY_URL) return new OpenAI({ apiKey: 'via-proxy', baseURL: PROXY_URL + '/v1', dangerouslyAllowBrowser: true });
  throw new Error('No API key available.');
}

export interface LLMPersonaResult {
  title: string;        // e.g. "The Philosopher Goat"
  subtitle: string;     // 1–2 sentence flavour text
  imageUrl: string;     // DALL-E 3 URL (temporary, expires)
  imagePrompt: string;  // for transparency
}

// ── Persona chat ("Talk to Yourself" / "Talk to Anti-You") ────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Continue a persona chat. `systemPrompt` establishes the character (built from
 * the user's — or inverted — trait profile); `history` is the running dialogue.
 */
export async function chatWithPersona(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
): Promise<string> {
  const client = await getClient(apiKey);
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...history],
    temperature: 0.9,
    max_tokens: 500,
  });
  return resp.choices[0].message.content?.trim() ?? '…';
}

export async function generateExample(apiKey: string, statement: string): Promise<string> {
  const client = await getClient(apiKey);

  const prompt = `Create a real life example in someone's day to day that could explain this statement: "${statement}"

Respond with a short, concrete, relatable scenario (2–4 sentences) that illustrates the idea in everyday terms. Do not restate or define the statement — just tell the example. No preamble.`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 200,
  });

  return resp.choices[0].message.content?.trim() ?? 'Could not generate an example.';
}

function buildTopTraits(scores: Record<DimensionKey, DimensionScore>): string {
  const highlights: { label: string; description: string }[] = [];

  // Pick top 5 most-expressed dimensions (highest deviation from neutral)
  const ranked = (Object.keys(scores) as DimensionKey[])
    .filter(k => scores[k].confidence > 0.25)
    .sort((a, b) => {
      const devA = Math.abs(scores[a].score - (DIMENSION_MAP[a].type === 'bipolar' ? 0 : 50));
      const devB = Math.abs(scores[b].score - (DIMENSION_MAP[b].type === 'bipolar' ? 0 : 50));
      return devB - devA;
    })
    .slice(0, 5);

  for (const k of ranked) {
    const dim = DIMENSION_MAP[k];
    const score = scores[k].score;
    if (dim.type === 'unipolar') {
      const level = score >= 75 ? 'very high' : score >= 60 ? 'high' : score <= 25 ? 'very low' : 'low';
      highlights.push({ label: dim.label, description: `${level} ${dim.label.toLowerCase()} (${score}/100)` });
    } else {
      const pole = score > 0 ? dim.positiveLabel : dim.negativeLabel;
      const strength = Math.abs(score) >= 70 ? 'strongly' : 'moderately';
      highlights.push({ label: dim.label, description: `${strength} ${pole?.toLowerCase()} (${score > 0 ? '+' : ''}${score})` });
    }
  }

  return highlights.map(h => h.description).join(', ');
}

export async function generateLLMPersona(
  apiKey: string,
  scores: Record<DimensionKey, DimensionScore>,
  zodiac: ZodiacSign,
  archetype: Archetype,
  identitySentence: string,
): Promise<LLMPersonaResult> {
  const client = await getClient(apiKey);
  const topTraits = buildTopTraits(scores);

  // ── Step 1: Generate title + subtitle ────────────────────────────────────
  const titlePrompt = `You are a creative naming consultant for a personality app called Selfscape.

A user's psychological profile shows:
- Archetype: ${archetype.name} — "${archetype.tagline}"
- Identity: ${identitySentence}
- Top traits: ${topTraits}
- Zodiac sign: ${zodiac.name} (${zodiac.element} sign; traits: ${zodiac.traits.join(', ')})

Create a poetic, memorable persona title for this person that:
1. Cleverly weaves in their zodiac animal or symbol (e.g. "The Philosopher Goat" for a philosophical Capricorn)
2. Captures their top 1–2 psychological traits
3. Is 3–5 words, starting with "The"
4. Feels like a mythic title or character class, not a job title

Then write 1–2 sentences of vivid flavour text that expands on the title — evocative and slightly lyrical, referencing both their zodiac and their strongest traits. Do NOT just list traits; paint a picture.

Respond in valid JSON exactly like this (no markdown fences):
{"title": "The ...", "subtitle": "..."}`;

  const titleResp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: titlePrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
    max_tokens: 300,
  });

  const parsed = JSON.parse(titleResp.choices[0].message.content ?? '{}') as {
    title?: string;
    subtitle?: string;
  };
  const title    = parsed.title    ?? `The ${zodiac.name} ${archetype.name.replace('The ', '')}`;
  const subtitle = parsed.subtitle ?? archetype.description;

  // ── Step 2: Build DALL-E prompt ───────────────────────────────────────────
  const dallePromptRequest = `You are a creative director writing a DALL-E 3 image prompt.

The persona is: "${title}"
Zodiac: ${zodiac.name} — ${zodiac.imageDescription}
Archetype feel: ${archetype.tagline}
Top traits: ${topTraits}

Write a vivid, specific DALL-E 3 prompt (150–200 words) for a SINGLE portrait illustration of this persona.
Requirements:
- Incorporate the zodiac's visual motif (${zodiac.imageDescription}) as the central character or dominant symbol
- Reflect the psychological traits through lighting, setting, and atmosphere
- Specify an art style (e.g., "detailed watercolour illustration", "luminous oil painting", "Art Nouveau poster")
- Rich, dramatic colours fitting the ${zodiac.element} element
- Cinematic composition — this is a hero image, not a diagram
- Absolutely NO text, letters, words, or numbers in the image
- End with: "No text, no letters, no words."

Respond with ONLY the image prompt text, no preamble.`;

  const dallePromptResp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: dallePromptRequest }],
    temperature: 0.85,
    max_tokens: 400,
  });

  const imagePrompt = dallePromptResp.choices[0].message.content?.trim()
    ?? `${zodiac.imageDescription}, ${archetype.tagline}, dramatic fantasy illustration, no text`;

  // ── Step 3: Generate image ────────────────────────────────────────────────
  const imageResp = await client.images.generate({
    model: 'gpt-image-1',
    prompt: imagePrompt,
    size: '1024x1024',
    quality: 'medium',
    n: 1,
  });

  // gpt-image-1 returns base64 (b64_json); older models return a hosted url.
  const first = (imageResp.data ?? [])[0];
  const imageUrl = first?.url
    ? first.url
    : first?.b64_json
      ? `data:image/png;base64,${first.b64_json}`
      : '';

  return { title, subtitle, imageUrl, imagePrompt };
}

// ── Personalised short story ──────────────────────────────────────────────────

export interface StoryParams {
  setting: string;      // e.g. "a deep-space colony mission"
  profession: string;   // e.g. "field botanist"
  companion?: string;   // optional sidekick / ally
  challenge?: string;   // optional central quest / conflict
  tone?: string;        // e.g. "hopeful", "comedic", "noir"
  length: 'short' | 'medium';
}

export interface StoryResult {
  title: string;
  body: string;         // multi-paragraph prose, paragraphs separated by blank lines
}

export async function generateStory(
  apiKey: string,
  params: StoryParams,
  scores: Record<DimensionKey, DimensionScore>,
  personaName: string,
  identitySentence: string,
): Promise<StoryResult> {
  const client = await getClient(apiKey);
  const topTraits = buildTopTraits(scores);
  const wordTarget = params.length === 'medium' ? '650–850' : '350–500';

  const details = [
    `Setting: ${params.setting}`,
    `The protagonist's profession/role: ${params.profession}`,
    params.companion ? `A companion or ally: ${params.companion}` : '',
    params.challenge ? `The central challenge or quest: ${params.challenge}` : '',
    params.tone ? `Overall tone: ${params.tone}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `You are a gifted short-story writer. Write an original, vivid short story (${wordTarget} words) whose protagonist embodies a real person's personality profile.

The protagonist is inspired by "${personaName}" — ${identitySentence}
Their strongest psychological tendencies (from a self-assessment): ${topTraits}

Story parameters chosen by the reader:
${details}

Requirements:
- Write in third person, past tense, with the protagonist clearly at the centre.
- SHOW their personality through action, not description. Include 3–4 concrete, specific scenes where the protagonist visibly acts out their strongest tendencies — small vivid moments that a reader could picture, the way a good real-life example illustrates an abstract trait. Do NOT name the traits or use psychology jargon; dramatise them.
- Honour the chosen setting, profession, and any companion/challenge/tone.
- Warm, engaging, and imaginative. Give the protagonist a fitting first name.
- Keep it self-contained with a satisfying arc (beginning, turn, resolution).
- This is a fun, fictional, self-reflection piece — never clinical, never judgemental.

Respond in valid JSON exactly like this (no markdown fences):
{"title": "A short evocative story title", "body": "The full story. Separate paragraphs with a blank line (\\n\\n)."}`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.95,
    max_tokens: 2000,
  });

  const parsed = JSON.parse(resp.choices[0].message.content ?? '{}') as { title?: string; body?: string };
  return {
    title: parsed.title?.trim() || `${personaName}: A Short Story`,
    body: (parsed.body ?? '').trim() || 'Could not generate a story. Please try again.',
  };
}

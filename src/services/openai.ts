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
  imageUrl: string;     // generated image (data URL); '' when the image step failed
  imagePrompt: string;  // for transparency
  imageError?: string;  // set when the illustration couldn't be generated (name/subtitle still valid)
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

// ── Couples report (the Together page) ───────────────────────────────────────

/** One side of a section: written to one partner, about the other. */
export interface CoupleSectionSide {
  summary: string;
  doThis: string[];
  avoid: string[];
  sayThis: string[];
}

export interface CoupleSection {
  key: string;
  title: string;
  /** Written to the person reading, about their partner. */
  forYou: CoupleSectionSide;
  /** The mirror: written to the partner, about the reader. Shareable with them. */
  forThem: CoupleSectionSide;
}

export interface CoupleReport {
  generatedAt: number;
  names: { you: string; them: string };
  overview: string;
  strengths: { title: string; body: string }[];
  frictions: { title: string; body: string; tryThis: string }[];
  sections: CoupleSection[];
  /** One concrete thing to do together this week. */
  firstConversation: string;
}

/** Section titles live in code so the page layout stays stable across regenerations. */
export const COUPLE_SECTIONS: { key: string; title: string; brief: string }[] = [
  { key: 'think',    title: 'How They Think vs. How You Think', brief: 'How each of them reasons, decides, and processes — and where those styles collide.' },
  { key: 'talk',     title: 'How to Talk to Them',              brief: 'Tone, timing, directness, and what makes each of them shut down or open up.' },
  { key: 'ask',      title: 'How to Ask Them to Do Something',  brief: 'The way to make a request that actually lands, and what reads as nagging to each of them.' },
  { key: 'badnews',  title: 'How They Handle Bad News',         brief: 'What each needs in the first hour, the first day, and the first week of something going wrong.' },
  { key: 'conflict', title: 'How to Fight Well',                brief: 'Their escalation and cool-off patterns, and what repair looks like for each of them.' },
  { key: 'kids',     title: 'How They Handle the Kids',         brief: 'Their parenting instincts, where the two of you undercut each other, and how to hold a united front.' },
  { key: 'family',   title: 'Their Relationship With Family',   brief: 'How each relates to their own family and their in-laws, and where the boundary work is.' },
  { key: 'money',    title: 'Money & the Household',            brief: 'Spending instincts, the mental load, and how to divide things without resentment.' },
];

const COUPLE_RAILS = `
SAFETY — non-negotiable:
- You are a relationship educator, not a therapist, and this is not therapy or a diagnosis.
- NEVER coach anyone to tolerate, manage around, or take responsibility for abuse, coercive control, intimidation, or violence. If the answers suggest fear, control, or someone being isolated or degraded, say plainly in the overview that some of what's here goes beyond what a self-assessment should advise on, and that talking to a qualified professional or a domestic abuse service is the right next step. Do not soften that into a euphemism.
- Never suggest one partner is the problem, defective, or should be fixed. Difference is not failure. Two people can be very different and very happy.
- Do not tell anyone to leave or stay in their relationship. That is theirs to decide.
- No diagnosis, no attachment-style or personality-disorder labels applied to a real person.

STYLE:
- Warm, specific, and practical. A good counsellor sounds like a trusted friend who has seen a lot, not a textbook.
- Ground every claim in what they actually answered. Quote or paraphrase their own statements. If the data doesn't support a claim, leave it out — never invent an anecdote or a fact about their life.
- Behavioural, not abstract: "wait until after dinner, then open with what you appreciated" beats "communicate openly".
- Never use the words "toxic", "red flag", "narcissist", or "gaslighting".
- Second person. Plain sentences. No headings or markdown inside field values.`;

/**
 * Generate the whole couples report in one structured call: cheaper, faster, and
 * coherent across sections in a way that eight separate calls would not be.
 * `brief` comes from coupleBrief() — the compat result plus both profiles.
 */
export async function generateCoupleReport(
  apiKey: string,
  brief: string,
  names: { you: string; them: string },
): Promise<CoupleReport> {
  const client = await getClient(apiKey);

  const sectionSpec = COUPLE_SECTIONS.map(s => `  - "${s.key}" (${s.title}): ${s.brief}`).join('\n');

  const prompt = `You are an experienced couples counsellor writing a private report for ${names.you} about their relationship with ${names.them}. Both partners completed the same detailed self-assessment; their answers are below.

${brief}

Write a report with these parts. Every section has TWO sides:
- "forYou": addressed to ${names.you}, about understanding and approaching ${names.them}.
- "forThem": the mirror — addressed to ${names.them}, about understanding and approaching ${names.you}. ${names.you} may share this with them, so write it to be read by ${names.them} directly, and be just as fair to ${names.them} as to ${names.you}.

Sections to write (use these exact keys):
${sectionSpec}

Each side of each section needs:
- "summary": 3–5 sentences on how that partner actually works in this area, and what that means for the other one. Reference their real answers.
- "doThis": 3–4 concrete actions, each one sentence, specific enough to do tomorrow.
- "avoid": 2–3 things that reliably backfire with this person, each one sentence.
- "sayThis": 2 example sentences they could actually say out loud, in natural spoken English.

Also write:
- "overview": 4–6 sentences on the shape of this relationship — what they have going for them and what will take work. Honest, never bleak. If the alignment data is thin, say so.
- "strengths": 3 items, each {"title": short phrase, "body": 2–3 sentences} on a genuine strength, drawn from their common ground.
- "frictions": 3–4 items, each {"title": short phrase, "body": 2–3 sentences naming the difference and why it causes friction, "tryThis": one concrete thing to try}. Draw these from the divergences listed above. Be clear that a difference is not a verdict on the relationship.
- "firstConversation": one specific, low-stakes thing to do together this week, in 2–3 sentences. Something a real couple would actually agree to.
${COUPLE_RAILS}

Respond with valid JSON only (no markdown fences), exactly this shape:
{"overview":"…","strengths":[{"title":"…","body":"…"}],"frictions":[{"title":"…","body":"…","tryThis":"…"}],"firstConversation":"…","sections":{"think":{"forYou":{"summary":"…","doThis":["…"],"avoid":["…"],"sayThis":["…"]},"forThem":{"summary":"…","doThis":["…"],"avoid":["…"],"sayThis":["…"]}},"talk":{…},"ask":{…},"badnews":{…},"conflict":{…},"kids":{…},"family":{…},"money":{…}}}`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 8000,
  });

  const parsed = JSON.parse(resp.choices[0].message.content ?? '{}') as {
    overview?: string;
    strengths?: { title?: string; body?: string }[];
    frictions?: { title?: string; body?: string; tryThis?: string }[];
    firstConversation?: string;
    sections?: Record<string, { forYou?: Partial<CoupleSectionSide>; forThem?: Partial<CoupleSectionSide> }>;
  };

  const side = (s?: Partial<CoupleSectionSide>): CoupleSectionSide => ({
    summary: s?.summary?.trim() ?? '',
    doThis: (s?.doThis ?? []).filter(Boolean),
    avoid: (s?.avoid ?? []).filter(Boolean),
    sayThis: (s?.sayThis ?? []).filter(Boolean),
  });

  // Build sections from OUR list, not the model's keys, so a missing or
  // hallucinated key can't reshape the page.
  const sections: CoupleSection[] = COUPLE_SECTIONS.map(meta => {
    const raw = parsed.sections?.[meta.key];
    return {
      key: meta.key,
      title: meta.title,
      forYou: side(raw?.forYou),
      forThem: side(raw?.forThem),
    };
  }).filter(s => s.forYou.summary || s.forThem.summary);

  if (sections.length === 0) {
    throw new Error('The report came back empty. Please try generating it again.');
  }

  return {
    generatedAt: Date.now(),
    names,
    overview: parsed.overview?.trim() ?? '',
    strengths: (parsed.strengths ?? [])
      .map(s => ({ title: s.title?.trim() ?? '', body: s.body?.trim() ?? '' }))
      .filter(s => s.body),
    frictions: (parsed.frictions ?? [])
      .map(f => ({ title: f.title?.trim() ?? '', body: f.body?.trim() ?? '', tryThis: f.tryThis?.trim() ?? '' }))
      .filter(f => f.body),
    sections,
    firstConversation: parsed.firstConversation?.trim() ?? '',
  };
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

  // ── Step 1: title + subtitle + image prompt in a single chat call ─────────
  // (One call instead of two keeps request volume — and rate-limit pressure — down.)
  const prompt = `You are a creative director for a personality app called Selfscape.

A user's psychological profile shows:
- Archetype: ${archetype.name} — "${archetype.tagline}"
- Identity: ${identitySentence}
- Top traits: ${topTraits}
- Zodiac sign: ${zodiac.name} (${zodiac.element} sign; visual motif: ${zodiac.imageDescription}; traits: ${zodiac.traits.join(', ')})

Produce three things:
1. "title": a poetic, memorable persona title — 3–5 words starting with "The", cleverly weaving in their zodiac animal/symbol (e.g. "The Philosopher Goat") and their top 1–2 traits. A mythic title, not a job title.
2. "subtitle": 1–2 sentences of vivid, lyrical flavour text expanding the title — reference their zodiac and strongest traits; paint a picture, don't list traits.
3. "imagePrompt": a vivid, specific 150–200 word image prompt for a SINGLE portrait illustration of this persona. Make the zodiac motif (${zodiac.imageDescription}) the central character/dominant symbol; reflect the traits through lighting, setting and atmosphere; specify an art style (e.g. "luminous oil painting", "Art Nouveau poster"); rich dramatic colours fitting the ${zodiac.element} element; cinematic hero composition. Absolutely NO text, letters, words or numbers. End the prompt with: "No text, no letters, no words."

Respond in valid JSON exactly like this (no markdown fences):
{"title": "The ...", "subtitle": "...", "imagePrompt": "..."}`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
    max_tokens: 700,
  });

  const parsed = JSON.parse(resp.choices[0].message.content ?? '{}') as {
    title?: string;
    subtitle?: string;
    imagePrompt?: string;
  };
  const title    = parsed.title    ?? `The ${zodiac.name} ${archetype.name.replace('The ', '')}`;
  const subtitle = parsed.subtitle ?? archetype.description;
  const imagePrompt = parsed.imagePrompt?.trim()
    ?? `${zodiac.imageDescription}, ${archetype.tagline}, dramatic fantasy illustration, no text`;

  // ── Step 2: image (optional) ──────────────────────────────────────────────
  // Image generation is far more rate-limited than chat (and on the shared key
  // may be throttled by the proxy). If it fails, still return the written
  // persona so the name, description and story features work regardless.
  let imageUrl = '';
  let imageError: string | undefined;
  try {
    const imageResp = await client.images.generate({
      model: 'gpt-image-1',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    });
    // gpt-image-1 returns base64 (b64_json); older models return a hosted url.
    const first = (imageResp.data ?? [])[0];
    imageUrl = first?.url
      ? first.url
      : first?.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : '';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    imageError = /429|rate.?limit|1015/i.test(msg)
      ? 'The illustration is temporarily unavailable — the image service is busy. Your persona name and description are ready; try “Regenerate” again in a little while for the artwork.'
      : 'The illustration couldn’t be generated this time. Your persona name and description are ready; try “Regenerate” for the artwork.';
  }

  return { title, subtitle, imageUrl, imagePrompt, imageError };
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

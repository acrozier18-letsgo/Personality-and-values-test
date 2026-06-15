import OpenAI from 'openai';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';
import type { DimensionScore } from '../engine/scoring';
import type { ZodiacSign } from '../data/zodiac';
import type { Archetype } from '../data/archetypes';

export interface LLMPersonaResult {
  title: string;        // e.g. "The Philosopher Goat"
  subtitle: string;     // 1–2 sentence flavour text
  imageUrl: string;     // DALL-E 3 URL (temporary, expires)
  imagePrompt: string;  // for transparency
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
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
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
    model: 'dall-e-3',
    prompt: imagePrompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });

  const imageUrl = (imageResp.data ?? [])[0]?.url ?? '';

  return { title, subtitle, imageUrl, imagePrompt };
}

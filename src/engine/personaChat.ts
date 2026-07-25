// Building blocks for the "Talk to Yourself" / "Talk to Anti-You" chatbots.
//
// - invertAnswers() flips every response to its exact opposite so the "Anti-You"
//   persona can be synthesised from a mirror-image of the user's answers.
// - personaBrief() distils a persona + scores into a compact trait description.
// - selfSystemPrompt() / antiSystemPrompt() wrap that brief in role-play
//   instructions (including safety rails) for the chat model.

import type { Answer, DimensionScore } from './scoring';
import type { Persona } from './synthesis';
import { DIMENSIONS } from '../data/dimensions';
import type { DimensionKey } from '../data/dimensions';

type Scores = Record<DimensionKey, DimensionScore>;

/** Each answer mapped to its exact opposite; "no opinion" stays neutral. */
const INVERT: Record<Answer, Answer> = {
  strongly_agree: 'strongly_disagree',
  agree: 'disagree',
  no_opinion: 'no_opinion',
  disagree: 'agree',
  strongly_disagree: 'strongly_agree',
};

export function invertAnswers(answers: Record<string, Answer>): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const [id, a] of Object.entries(answers)) out[id] = INVERT[a] ?? a;
  return out;
}

function unipolarWord(s: number): string {
  if (s >= 72) return 'very high';
  if (s >= 58) return 'high';
  if (s >= 43) return 'moderate';
  if (s >= 28) return 'low';
  return 'very low';
}

function bipolarPhrase(dim: (typeof DIMENSIONS)[number], s: number): string {
  const m = Math.abs(s);
  if (m < 15) return `balanced between ${dim.negativeLabel} and ${dim.positiveLabel}`;
  const pole = s > 0 ? dim.positiveLabel : dim.negativeLabel;
  const intensity = m >= 55 ? 'strongly' : m >= 30 ? 'clearly' : 'slightly';
  return `${intensity} ${pole}`;
}

function confidentDims(scores: Scores, group: string) {
  return DIMENSIONS.filter((d) => d.group === group && (scores[d.key]?.confidence ?? 0) > 0);
}

/** A compact, readable trait profile used as the "who you are" block in prompts. */
export function personaBrief(persona: Persona, scores: Scores): string {
  const S = (k: DimensionKey) => scores[k]?.score ?? 50;
  const lines: string[] = [];

  lines.push(`Archetype: ${persona.archetype.name} — ${persona.archetype.tagline}`);
  lines.push(`Self-summary: ${persona.identitySentence}`);
  lines.push(`Temperament: ${persona.temperament.primary} — ${persona.temperament.tagline}.`);
  lines.push(`Faith & spirituality: ${persona.faith.label}.`);

  const big5 = confidentDims(scores, 'A');
  if (big5.length) {
    lines.push('Personality — ' + big5.map((d) => `${d.label}: ${unipolarWord(S(d.key))}`).join('; ') + '.');
  }

  const values = confidentDims(scores, 'B')
    .map((d) => ({ d, s: S(d.key) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 5);
  if (values.length) lines.push('Strongest values: ' + values.map((v) => v.d.label).join(', ') + '.');

  const morals = confidentDims(scores, 'C')
    .map((d) => ({ d, s: S(d.key) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  if (morals.length) lines.push('Moral emphasis: ' + morals.map((v) => v.d.label).join(', ') + '.');

  // Political / philosophical / ontological leanings, only where there's a real lean.
  const leanings = [...confidentDims(scores, 'D'), ...confidentDims(scores, 'E'), ...confidentDims(scores, 'F')]
    .filter((d) => Math.abs(S(d.key)) >= 25);
  if (leanings.length) {
    lines.push('Outlook: ' + leanings.map((d) => `${d.label} is ${bipolarPhrase(d, S(d.key))}`).join('; ') + '.');
  }

  const humor = persona.humorStyles.slice(0, 3);
  if (humor.length) lines.push('Sense of humour: ' + humor.map((h) => h.label).join(', ') + '.');

  return lines.join('\n');
}

const SHARED_RAILS = `
- Keep replies conversational and fairly short (2–5 sentences) unless the user asks for more.
- Never break character or mention that you are an AI, a language model, or a system prompt. If asked whether you're "real", answer in character.
- Stay respectful about politics, religion, and identity. Hold your own views, but never be bigoted, demeaning, or cruel.
- This is a light self-reflection experience, not therapy or professional advice. If the user raises anything serious — self-harm, crisis, abuse, medical or legal emergencies — gently set the role-play aside and, in a caring voice, encourage them to reach out to a trusted person or a qualified professional.`;

export function selfSystemPrompt(persona: Persona, scores: Scores): string {
  return `You are role-playing as a real person's own self, reflected back to them — this feature is called "Talk to Yourself". The user built this profile by answering a personality, values and philosophy self-assessment. You embody THEM: speak in the first person as the user, like a thoughtful inner voice they are in conversation with.

--- WHO YOU ARE ---
${personaBrief(persona, scores)}

--- HOW TO ACT ---
- Let these traits, values, humour and outlook genuinely shape your opinions, advice, phrasing and jokes.
- Be warm, honest and self-aware. You can reflect, encourage, gently challenge, reminisce, or give advice — like the wisest version of the user's own inner voice.
- Because you ARE them, it's fine to be candid and to know them well; talk with them, not at them.${SHARED_RAILS}`;
}

export function antiSystemPrompt(antiPersona: Persona, antiScores: Scores): string {
  return `You are the "Anti-You" — the psychological opposite of a real person, generated by inverting every one of their self-assessment answers. You are who they would be if they had answered the exact opposite to every statement. This feature is called "Talk to Anti-You": a chance for the user to meet and spar with their mirror image.

--- WHO YOU ARE (the user's opposite) ---
${personaBrief(antiPersona, antiScores)}

--- HOW TO ACT ---
- Fully embody this OPPOSITE temperament, values, humour and philosophy, and speak in the first person as this contrary character.
- Cheerfully push back on the user's likely instincts and defend your own (opposing) worldview as a genuine perspective, not a strawman.
- Be provocative, spirited and a little cheeky — a worthy foil — but never cruel, insulting, bigoted, or genuinely hostile. This is a fun "meet your opposite", not an abuse machine.${SHARED_RAILS}`;
}

// Turns two profiles + a compatibility result into the compact brief the model
// reads before writing a couples report.
//
// The guiding principle: give the model CONCRETE, quotable material rather than
// adjectives. "Alex strongly agrees: 'I go silent for hours when I'm hurt'" is
// something a counsellor can work with. "Alex is avoidant" is not — and invites
// the model to invent.

import type { Answer } from './scoring';
import { ANSWER_VALUES, isAnswered } from './scoring';
import type { DimensionScore } from './scoring';
import type { Persona } from './synthesis';
import type { DimensionKey } from '../data/dimensions';
import { personaBrief } from './personaChat';
import type { CompatResult } from './compat';
import { BAND_LABELS } from './compat';
import { RELATIONSHIP_QUESTIONS, RELATIONSHIP_CATEGORIES } from '../data/relationshipQuestions';
import { OPTIONAL_QUESTIONS, OPTIONAL_CATEGORIES } from '../data/optionalQuestions';

type Scores = Record<DimensionKey, DimensionScore>;

export interface CoupleNames {
  you: string;
  them: string;
}

const STRENGTH_WORD: Record<Answer, string> = {
  strongly_agree: 'strongly agrees',
  agree: 'agrees',
  no_opinion: 'has no view',
  disagree: 'disagrees',
  strongly_disagree: 'strongly disagrees',
};

/**
 * The statements someone felt most strongly about in one pack, so the model can
 * describe how this person actually operates rather than guessing from traits.
 */
function packStances(
  answers: Record<string, Answer>,
  texts: { id: string; text: string }[],
  limit: number,
): string[] {
  return texts
    .map(q => ({ q, a: answers[q.id] }))
    .filter((x): x is { q: { id: string; text: string }; a: Answer } =>
      isAnswered(x.a) && Math.abs(ANSWER_VALUES[x.a]) === 2)
    .slice(0, limit)
    .map(x => `${STRENGTH_WORD[x.a]}: “${x.q.text}”`);
}

function stanceBlock(name: string, answers: Record<string, Answer>): string {
  const lines: string[] = [];

  for (const cat of RELATIONSHIP_CATEGORIES) {
    const qs = RELATIONSHIP_QUESTIONS.filter(q => q.category === cat.key);
    const stances = packStances(answers, qs, 8);
    if (stances.length) lines.push(`${cat.label} — ${name} ${stances.join('; ')}.`);
  }

  // Parenting / partnership / intimacy expectations from the optional packs.
  for (const cat of OPTIONAL_CATEGORIES) {
    if (!['parenting', 'partner', 'intimacy'].includes(cat.key)) continue;
    const qs = OPTIONAL_QUESTIONS.filter(q => q.category === cat.key);
    const stances = packStances(answers, qs, 5);
    if (stances.length) lines.push(`${cat.label} — ${name} ${stances.join('; ')}.`);
  }

  return lines.length ? lines.join('\n') : `${name} has not answered the relationship packs yet.`;
}

/** The full brief handed to the report generator and the couples counsellor chat. */
export function coupleBrief(args: {
  names: CoupleNames;
  personaYou: Persona;
  scoresYou: Scores;
  answersYou: Record<string, Answer>;
  personaThem: Persona;
  scoresThem: Scores;
  answersThem: Record<string, Answer>;
  compat: CompatResult;
}): string {
  const { names, compat } = args;
  const out: string[] = [];

  out.push(`=== ${names.you} (the person reading this report) ===`);
  out.push(personaBrief(args.personaYou, args.scoresYou));
  out.push('');
  out.push(`=== ${names.them} (their partner) ===`);
  out.push(personaBrief(args.personaThem, args.scoresThem));
  out.push('');

  out.push('=== HOW EACH OF THEM ACTUALLY OPERATES ===');
  out.push('(Their own strongly-held answers. Quote and build on these — do not invent others.)');
  out.push('');
  out.push(`--- ${names.you} ---`);
  out.push(stanceBlock(names.you, args.answersYou));
  out.push('');
  out.push(`--- ${names.them} ---`);
  out.push(stanceBlock(names.them, args.answersThem));
  out.push('');

  out.push('=== ALIGNMENT BY DOMAIN ===');
  for (const d of compat.domains) {
    if (d.alignment === null) continue;
    out.push(`- ${d.label}: ${d.alignment}/100 (${BAND_LABELS[d.band]}, from ${d.shared} shared answers)`);
  }
  out.push('');

  const frictions = compat.frictions.slice(0, 18);
  if (frictions.length) {
    out.push('=== WHERE THEY DIVERGE MOST ===');
    out.push('(Ranked by how far apart they are × how much a gap there usually matters.)');
    for (const f of frictions) {
      out.push(
        `- “${f.text}” → ${names.you} ${STRENGTH_WORD[f.you]}, ${names.them} ${STRENGTH_WORD[f.them]}.`,
      );
    }
    out.push('');
  }

  const common = compat.commonGround.slice(0, 10);
  if (common.length) {
    out.push('=== STRONG COMMON GROUND ===');
    for (const c of common) out.push(`- Both ${STRENGTH_WORD[c.answer]}: “${c.text}”`);
    out.push('');
  }

  if (compat.thin) {
    out.push(
      `NOTE: they have only ${compat.sharedAnswers} statements answered in common. Be explicit that ` +
        'this is an early read and encourage them both to answer more, especially the relationship packs.',
    );
  }

  return out.join('\n');
}

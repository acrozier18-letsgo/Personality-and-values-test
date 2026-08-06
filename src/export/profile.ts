// Data portability: export/import the raw answer set, and generate a
// human-readable "profile" that can be pasted into a Claude project's Memory
// so an assistant knows who it's dealing with.
//
// The answers file is intentionally minimal and dependency-free (plain JSON):
// answers + refineAnswers + birthdate. The generated persona, AI portrait and
// story are NOT included — they regenerate deterministically from the answers.

import type { Answer } from '../engine/scoring';
import { ANSWER_VALUES } from '../engine/scoring';
import type { ScoringResult } from '../engine/scoring';
import type { Persona } from '../engine/synthesis';
import { QUESTIONS } from '../data/questions';
import { OPTIONAL_QUESTIONS, OPTIONAL_CATEGORIES } from '../data/optionalQuestions';
import { RELATIONSHIP_QUESTIONS, RELATIONSHIP_CATEGORIES } from '../data/relationshipQuestions';
import { DIMENSIONS, DIMENSION_MAP } from '../data/dimensions';
import type { DimensionKey } from '../data/dimensions';
import { getZodiacFromDate } from '../data/zodiac';
import { getChineseZodiac } from '../data/chineseZodiac';

// ── Answers file (backup / restore) ─────────────────────────────────────────

export const ANSWERS_FILE_KIND = 'selfscape-answers';
export const ANSWERS_FILE_VERSION = 1;

export interface AnswersFile {
  app: 'selfscape';
  kind: typeof ANSWERS_FILE_KIND;
  version: number;
  exportedAt: string;
  answeredCount: number;
  totalQuestions: number;
  birthdate: string;
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
}

export interface ImportPayload {
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
  birthdate: string;
}

const VALID_QUESTION_IDS = new Set([
  ...QUESTIONS.map((q) => q.id),
  ...OPTIONAL_QUESTIONS.map((q) => q.id),
  ...RELATIONSHIP_QUESTIONS.map((q) => q.id),
]);

export function buildAnswersFile(data: {
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
  birthdate: string;
}): AnswersFile {
  const answered = Object.values(data.answers).filter((a) => a in ANSWER_VALUES).length;
  return {
    app: 'selfscape',
    kind: ANSWERS_FILE_KIND,
    version: ANSWERS_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    answeredCount: answered,
    totalQuestions: QUESTIONS.length,
    birthdate: data.birthdate ?? '',
    answers: data.answers,
    refineAnswers: data.refineAnswers ?? {},
  };
}

/**
 * Parse and validate an uploaded answers file. Throws with a friendly message
 * if it isn't a Selfscape answers file. Unknown question ids and invalid answer
 * values are silently dropped so a partially-compatible file still restores.
 */
export function parseAnswersFile(text: string): ImportPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON. Please choose a Selfscape answers file.");
  }
  const obj = raw as Partial<AnswersFile>;
  if (!obj || typeof obj !== 'object' || obj.kind !== ANSWERS_FILE_KIND || !obj.answers) {
    throw new Error("That doesn't look like a Selfscape answers file.");
  }

  const answers: Record<string, Answer> = {};
  for (const [id, val] of Object.entries(obj.answers)) {
    if (VALID_QUESTION_IDS.has(id) && typeof val === 'string' && val in ANSWER_VALUES) {
      answers[id] = val as Answer;
    }
  }
  if (Object.keys(answers).length === 0) {
    throw new Error('That file contains no recognisable answers.');
  }

  const refineAnswers: Record<string, number> = {};
  if (obj.refineAnswers && typeof obj.refineAnswers === 'object') {
    for (const [id, val] of Object.entries(obj.refineAnswers)) {
      if (typeof val === 'number' && Number.isFinite(val)) refineAnswers[id] = val;
    }
  }

  const birthdate =
    typeof obj.birthdate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.birthdate)
      ? obj.birthdate
      : '';

  return { answers, refineAnswers, birthdate };
}

export function readAnswersFile(file: File): Promise<ImportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      try {
        resolve(parseAnswersFile(String(reader.result ?? '')));
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}

// ── Download / clipboard helpers ────────────────────────────────────────────

export function downloadTextFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAnswers(data: {
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
  birthdate: string;
}) {
  const file = buildAnswersFile(data);
  const stamp = file.exportedAt.slice(0, 10);
  downloadTextFile(`selfscape-answers-${stamp}.json`, JSON.stringify(file, null, 2), 'application/json');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Claude Memory profile (Markdown) ────────────────────────────────────────

const GROUP_TITLES: Record<string, string> = {
  A: 'Personality (Big Five)',
  B: 'Core values (Schwartz)',
  C: 'Moral foundations',
  D: 'Political leaning',
  E: 'Philosophical stances',
  F: 'Ontological preferences',
  G: 'Sense of humor',
  H: 'Faith & spirituality',
};

function unipolarWord(score: number): string {
  if (score >= 72) return 'very high';
  if (score >= 58) return 'high';
  if (score >= 43) return 'moderate';
  if (score >= 28) return 'low';
  return 'very low';
}

/** Describe a bipolar dimension (score in −100..+100) as a lean toward one pole. */
function bipolarPhrase(dim: (typeof DIMENSIONS)[number], score: number): string {
  const mag = Math.abs(score);
  if (mag < 15) return `balanced between ${dim.negativeLabel} and ${dim.positiveLabel}`;
  const pole = score > 0 ? dim.positiveLabel : dim.negativeLabel;
  const intensity = mag >= 55 ? 'strongly' : mag >= 30 ? 'clearly' : 'slightly';
  return `${intensity} ${pole}`;
}

/** Only surface dimensions the user actually answered toward (confidence > 0). */
function confidentDims(result: ScoringResult, group: string) {
  return DIMENSIONS.filter(
    (d) => d.group === group && (result.scores[d.key]?.confidence ?? 0) > 0,
  );
}

function topUnipolar(result: ScoringResult, group: string, n: number): DimensionKey[] {
  return confidentDims(result, group)
    .map((d) => ({ key: d.key, score: result.scores[d.key]?.score ?? 50 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.key);
}

/**
 * Build a Markdown profile suitable for pasting into a Claude project's Memory.
 * Written in second person ("You are talking to…") so the assistant reads it as
 * a description of the human it's assisting.
 */
export function buildMemoryMarkdown(
  persona: Persona,
  result: ScoringResult,
  birthdate: string,
  answers?: Record<string, Answer>,
): string {
  const L = (k: DimensionKey) => DIMENSION_MAP[k].label;
  const S = (k: DimensionKey) => result.scores[k]?.score ?? 50;
  const lines: string[] = [];

  lines.push('# About the person you are assisting');
  lines.push('');
  lines.push(
    'This is a self-reflection profile generated by Selfscape, a personality, values and ' +
      'philosophy self-assessment. It is a snapshot of how this person described themselves — ' +
      'a guide to their outlook, not a clinical or definitive judgement. Use it to tailor tone ' +
      'and framing; hold it lightly and let the person correct it.',
  );
  lines.push('');
  lines.push(`- **Archetype:** ${persona.archetype.name} — ${persona.archetype.tagline}`);
  lines.push(`- **In one line:** ${persona.identitySentence}`);
  lines.push(`- **Temperament:** ${persona.temperament.primary} (${persona.temperament.tagline})`);
  lines.push(`- **Faith & spirituality:** ${persona.faith.label}`);
  if (birthdate) {
    const z = getZodiacFromDate(birthdate);
    const c = getChineseZodiac(birthdate);
    const parts = [z?.name, c ? `${c.yearName} (Chinese zodiac)` : null].filter(Boolean);
    if (parts.length) lines.push(`- **Zodiac:** ${parts.join(', ')}`);
  }
  lines.push(
    `- **Based on:** ${Math.round(persona.overallCompletion * QUESTIONS.length)} of ${QUESTIONS.length} statements answered` +
      (persona.isEarlyRead ? ' (early read — treat as tentative)' : ''),
  );
  lines.push('');

  // Big Five
  const bigFive = confidentDims(result, 'A');
  if (bigFive.length) {
    lines.push(`## ${GROUP_TITLES.A}`);
    for (const d of bigFive) {
      lines.push(`- **${d.label}:** ${unipolarWord(S(d.key))} (${S(d.key)}/100)`);
    }
    lines.push('');
  }

  // Values (top) & moral foundations (top)
  const values = topUnipolar(result, 'B', 4);
  if (values.length) {
    lines.push(`## ${GROUP_TITLES.B}`);
    lines.push('Strongest values: ' + values.map((k) => `${L(k)} (${S(k)})`).join(', ') + '.');
    lines.push('');
  }
  const morals = topUnipolar(result, 'C', 3);
  if (morals.length) {
    lines.push(`## ${GROUP_TITLES.C}`);
    lines.push('Most weighted: ' + morals.map((k) => `${L(k)} (${S(k)})`).join(', ') + '.');
    lines.push('');
  }

  // Politics
  const politics = confidentDims(result, 'D');
  if (politics.length) {
    lines.push(`## ${GROUP_TITLES.D}`);
    lines.push(
      '_Recorded for even-handed context only — engage without pushing an agenda._',
    );
    for (const d of politics) {
      lines.push(`- **${d.label}:** ${bipolarPhrase(d, S(d.key))}`);
    }
    lines.push('');
  }

  // Philosophy & ontology (bipolar)
  for (const g of ['E', 'F'] as const) {
    const dims = confidentDims(result, g);
    if (!dims.length) continue;
    lines.push(`## ${GROUP_TITLES[g]}`);
    for (const d of dims) {
      lines.push(`- **${d.label}:** ${bipolarPhrase(d, S(d.key))}`);
    }
    lines.push('');
  }

  // Humor
  const humor = persona.humorStyles.slice(0, 3);
  if (humor.length) {
    lines.push(`## ${GROUP_TITLES.G}`);
    lines.push('Leans toward: ' + humor.map((h) => `${h.label} (${h.score})`).join(', ') + '.');
    lines.push('');
  }

  // Kindred figures & careers
  const figs = persona.figures.slice(0, 5).map((f) => f.figure.name);
  if (figs.length) {
    lines.push('## Kindred historical figures');
    lines.push(figs.join(', ') + '.');
    lines.push('');
  }
  const careers = persona.careers.map((c) => c.family.name);
  if (careers.length) {
    lines.push('## Career resonance');
    lines.push(careers.join(', ') + '.');
    lines.push('');
  }

  // Optional packs — parenting, partner, hobbies, etc. (captured, not scored)
  if (answers) {
    const optionalLines: string[] = [];
    for (const cat of OPTIONAL_CATEGORIES) {
      const qs = OPTIONAL_QUESTIONS.filter((q) => q.category === cat.key);
      const agrees = qs.filter((q) => { const a = answers[q.id]; return a && ANSWER_VALUES[a] > 0; });
      const disagrees = qs.filter((q) => { const a = answers[q.id]; return a && ANSWER_VALUES[a] < 0; });
      if (agrees.length === 0 && disagrees.length === 0) continue;
      optionalLines.push(`### ${cat.label}`);
      if (agrees.length) optionalLines.push('Agrees with:');
      for (const q of agrees) optionalLines.push(`- ${q.text}`);
      if (disagrees.length) optionalLines.push('Leans against:');
      for (const q of disagrees) optionalLines.push(`- ${q.text}`);
      optionalLines.push('');
    }
    if (optionalLines.length) {
      lines.push('## Preferences & lifestyle');
      lines.push('_Self-reported answers to optional question packs — useful context on values and preferences._');
      lines.push('');
      lines.push(...optionalLines);
    }

    // Relationship packs — how they say they actually behave with a partner.
    const relLines: string[] = [];
    for (const cat of RELATIONSHIP_CATEGORIES) {
      const qs = RELATIONSHIP_QUESTIONS.filter((q) => q.category === cat.key);
      const agrees = qs.filter((q) => { const a = answers[q.id]; return a && ANSWER_VALUES[a] > 0; });
      const disagrees = qs.filter((q) => { const a = answers[q.id]; return a && ANSWER_VALUES[a] < 0; });
      if (agrees.length === 0 && disagrees.length === 0) continue;
      relLines.push(`### ${cat.label}`);
      if (agrees.length) relLines.push('Says of themselves:');
      for (const q of agrees) relLines.push(`- ${q.text}`);
      if (disagrees.length) relLines.push('Says this is not them:');
      for (const q of disagrees) relLines.push(`- ${q.text}`);
      relLines.push('');
    }
    if (relLines.length) {
      lines.push('## How they operate in a relationship');
      lines.push(
        '_Self-reported patterns around conflict, requests, stress, money, parenting and family. ' +
          'Useful for tone and timing; not a licence to psychoanalyse them._',
      );
      lines.push('');
      lines.push(...relLines);
    }
  }

  // How to work with me — light guidance derived from the strongest traits
  lines.push('## How to work with this person');
  for (const g of guidanceFor(result)) lines.push(`- ${g}`);
  lines.push('');

  lines.push('---');
  lines.push(
    '_Generated by Selfscape. A self-portrait for entertainment and reflection, not a validated ' +
      'psychological instrument._',
  );

  return lines.join('\n');
}

/** A few practical "how to engage" hints keyed off the most decisive scores. */
function guidanceFor(result: ScoringResult): string[] {
  const S = (k: DimensionKey) => result.scores[k]?.score ?? 50;
  const has = (k: DimensionKey) => (result.scores[k]?.confidence ?? 0) > 0;
  const out: string[] = [];

  if (has('openness')) {
    out.push(
      S('openness') >= 58
        ? 'Enjoys novel ideas, tangents and the unconventional — feel free to explore and speculate.'
        : 'Prefers the concrete and proven over the speculative — keep suggestions practical and grounded.',
    );
  }
  if (has('conscientiousness')) {
    out.push(
      S('conscientiousness') >= 58
        ? 'Values structure and thoroughness — organised plans, clear steps and follow-through land well.'
        : 'Prefers flexibility over rigid plans — offer options rather than fixed procedures.',
    );
  }
  if (has('extraversion')) {
    out.push(
      S('extraversion') >= 58
        ? 'Energised by warmth and back-and-forth — a conversational, engaged tone suits them.'
        : 'Leans reflective and reserved — concise, low-key responses are welcome; no need for hype.',
    );
  }
  if (has('neuroticism') && S('neuroticism') >= 60) {
    out.push('May feel things intensely — a calm, reassuring, non-judgemental tone helps.');
  }
  if (has('epistemology')) {
    out.push(
      S('epistemology') <= 45
        ? 'Trusts evidence and concrete examples — back claims with data and real cases.'
        : 'Appreciates reasoning from first principles — walk through the logic, not just the conclusion.',
    );
  }
  if (out.length === 0) out.push('Answer honestly and adapt to their cues as you learn more about them.');
  return out;
}

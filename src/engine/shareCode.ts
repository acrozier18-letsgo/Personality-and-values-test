// Compact, server-free encoding of an answer set for "share by link".
// Every question (core + optional) maps to a digit 0–5 (0 = unanswered), packed
// two-at-a-time (base 6 → base 36) so a full profile fits in ~230 URL characters.
// No personal data beyond the answers themselves is encoded.

import { QUESTIONS } from '../data/questions';
import { OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import type { Answer } from './scoring';

// Stable canonical ordering — appending new questions stays backward-compatible
// (older codes simply run out early and leave the new ids unanswered).
const ALL_IDS: string[] = [
  ...QUESTIONS.map(q => q.id),
  ...OPTIONAL_QUESTIONS.map(q => q.id),
];

const ANSWER_ORDER: Answer[] = [
  'strongly_disagree', 'disagree', 'no_opinion', 'agree', 'strongly_agree',
];

const VERSION = 'A';

export function encodeProfile(answers: Record<string, Answer>): string {
  const digits = ALL_IDS.map(id => {
    const a = answers[id];
    const i = a ? ANSWER_ORDER.indexOf(a) : -1;
    return i < 0 ? 0 : i + 1; // 0 = unanswered, 1..5 = the five options
  });
  let out = '';
  for (let i = 0; i < digits.length; i += 2) {
    const hi = digits[i];
    const lo = i + 1 < digits.length ? digits[i + 1] : 0;
    out += (hi * 6 + lo).toString(36); // 0..35 → single base-36 char
  }
  return VERSION + out;
}

export function decodeProfile(code: string): Record<string, Answer> {
  const answers: Record<string, Answer> = {};
  if (!code || code[0] !== VERSION) return answers;
  const body = code.slice(1);
  let idx = 0;
  for (let i = 0; i < body.length; i++) {
    const v = parseInt(body[i], 36);
    if (Number.isNaN(v)) continue;
    const pair = [Math.floor(v / 6), v % 6];
    for (const d of pair) {
      if (idx < ALL_IDS.length) {
        if (d >= 1 && d <= 5) answers[ALL_IDS[idx]] = ANSWER_ORDER[d - 1];
        idx++;
      }
    }
  }
  return answers;
}

/** Full shareable URL for the current site + a profile code. */
export function shareUrl(answers: Record<string, Answer>): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/shared/${encodeProfile(answers)}`;
}

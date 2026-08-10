// Compatibility between two answer sets (yours and someone else's imported file).
// Item-level agreement over every question both people answered, rolled up into an
// overall score, per-category breakdown, and the biggest agreements / clashes.

import type { Answer } from './scoring';
import { ANSWER_VALUES, isAnswered } from './scoring';
import { QUESTIONS } from '../data/questions';
import { OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import { CATEGORY_MAP, ALL_CATEGORIES } from '../data/categories';

interface UnifiedQ { id: string; text: string; categoryKey: string }

const ALL_Q: UnifiedQ[] = [
  ...QUESTIONS.map(q => ({ id: q.id, text: q.text, categoryKey: q.group })),
  ...OPTIONAL_QUESTIONS.map(q => ({ id: q.id, text: q.text, categoryKey: q.category })),
];

/** 1.0 = identical answer, 0.0 = opposite extremes (−2..+2 scale, max distance 4). */
export function itemAgreement(a: Answer, b: Answer): number {
  return 1 - Math.abs(ANSWER_VALUES[a] - ANSWER_VALUES[b]) / 4;
}

export interface CategoryCompat {
  key: string;
  label: string;
  color: string;
  pct: number;    // 0–100
  shared: number; // questions both answered in this category
}

export interface StatementCompat {
  id: string;
  text: string;
  categoryLabel: string;
  you: Answer;
  them: Answer;
  agreement: number; // 0–1
}

export interface CompatibilityResult {
  overall: number;      // 0–100
  sharedCount: number;  // total questions both answered
  categories: CategoryCompat[];
  topAgreements: StatementCompat[];
  topClashes: StatementCompat[];
}

export function computeCompatibility(
  you: Record<string, Answer>,
  them: Record<string, Answer>,
): CompatibilityResult {
  const shared: StatementCompat[] = [];
  const byCat: Record<string, { sum: number; n: number }> = {};

  for (const q of ALL_Q) {
    const a = you[q.id];
    const b = them[q.id];
    if (!isAnswered(a) || !isAnswered(b)) continue;
    const agreement = itemAgreement(a, b);
    shared.push({
      id: q.id,
      text: q.text,
      categoryLabel: CATEGORY_MAP[q.categoryKey]?.label ?? q.categoryKey,
      you: a,
      them: b,
      agreement,
    });
    const bucket = (byCat[q.categoryKey] ??= { sum: 0, n: 0 });
    bucket.sum += agreement;
    bucket.n += 1;
  }

  const overall = shared.length
    ? Math.round((shared.reduce((s, x) => s + x.agreement, 0) / shared.length) * 100)
    : 0;

  const categories: CategoryCompat[] = ALL_CATEGORIES
    .filter(c => byCat[c.key]?.n)
    .map(c => ({
      key: c.key,
      label: c.label,
      color: c.color,
      pct: Math.round((byCat[c.key].sum / byCat[c.key].n) * 100),
      shared: byCat[c.key].n,
    }))
    .sort((a, b) => b.pct - a.pct);

  const topAgreements = [...shared]
    .sort((a, b) => b.agreement - a.agreement)
    .filter(x => x.agreement >= 0.75)
    .slice(0, 6);

  const topClashes = [...shared]
    .sort((a, b) => a.agreement - b.agreement)
    .filter(x => x.agreement <= 0.5)
    .slice(0, 6);

  return { overall, sharedCount: shared.length, categories, topAgreements, topClashes };
}

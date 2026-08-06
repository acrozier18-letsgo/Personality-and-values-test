// Unified category registry spanning the core assessment groups (A–H), the
// optional question packs, and the relationship-dynamics packs that power the
// Together page. Drives the category picker, the quiz question set, and the
// progress bar. Selecting a category adds its questions to the quiz.

import { QUESTIONS } from './questions';
import { OPTIONAL_QUESTIONS, OPTIONAL_CATEGORIES } from './optionalQuestions';
import {
  RELATIONSHIP_QUESTIONS,
  RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_DEPTH_COUNTS,
} from './relationshipQuestions';
import type { Answer } from '../engine/scoring';
import { isAnswered } from '../engine/scoring';

/** Which shelf of the picker a category belongs to. */
export type CategoryTier = 'core' | 'optional' | 'relationship';

export interface CategoryMeta {
  key: string;
  label: string;
  color: string;
  tier: CategoryTier;
  /** True for anything outside the core A–H assessment (kept for existing callers). */
  optional: boolean;
  blurb: string;
}

// Core groups mirror the labels/colours used in the quiz and radars.
export const CORE_CATEGORIES: CategoryMeta[] = [
  { key: 'A', label: 'Personality', color: '#7c5cff', tier: 'core', optional: false, blurb: 'Big Five traits — openness, conscientiousness, extraversion, and more.' },
  { key: 'B', label: 'Values',      color: '#3b82f6', tier: 'core', optional: false, blurb: 'What you prize in life (Schwartz values).' },
  { key: 'C', label: 'Morals',      color: '#10b981', tier: 'core', optional: false, blurb: 'Your moral foundations and intuitions.' },
  { key: 'D', label: 'Politics',    color: '#ef4444', tier: 'core', optional: false, blurb: 'Where you sit on the economic and social axes.' },
  { key: 'E', label: 'Philosophy',  color: '#f97316', tier: 'core', optional: false, blurb: 'Your stances on knowledge, ethics, free will, and more.' },
  { key: 'F', label: 'Ontology',    color: '#14b8a6', tier: 'core', optional: false, blurb: 'How you see reality, order, and the individual.' },
  { key: 'G', label: 'Humor',       color: '#db2777', tier: 'core', optional: false, blurb: 'Your comedic sensibility.' },
  { key: 'H', label: 'Faith',       color: '#a855f7', tier: 'core', optional: false, blurb: 'Religiosity, spirituality, and awe.' },
];

export const OPTIONAL_CATEGORY_METAS: CategoryMeta[] = OPTIONAL_CATEGORIES.map(o => ({
  key: o.key, label: o.label, color: o.color, tier: 'optional' as const, optional: true, blurb: o.blurb,
}));

export const RELATIONSHIP_CATEGORY_METAS: CategoryMeta[] = RELATIONSHIP_CATEGORIES.map(r => ({
  key: r.key, label: r.label, color: r.color, tier: 'relationship' as const, optional: true, blurb: r.blurb,
}));

export const ALL_CATEGORIES: CategoryMeta[] = [
  ...CORE_CATEGORIES,
  ...OPTIONAL_CATEGORY_METAS,
  ...RELATIONSHIP_CATEGORY_METAS,
];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  ALL_CATEGORIES.map(c => [c.key, c]),
);

export const CORE_CATEGORY_KEYS = CORE_CATEGORIES.map(c => c.key);
export const RELATIONSHIP_CATEGORY_KEYS = RELATIONSHIP_CATEGORY_METAS.map(c => c.key);

/**
 * Number of questions in each category, for display (e.g. "Parenting (60)").
 * Relationship packs count their core tier only — the deep-dive extension is
 * shown separately so the picker can read "35 · +22 deeper".
 */
export const CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const q of QUESTIONS) counts[q.group] = (counts[q.group] ?? 0) + 1;
  for (const q of OPTIONAL_QUESTIONS) counts[q.category] = (counts[q.category] ?? 0) + 1;
  for (const [key, d] of Object.entries(RELATIONSHIP_DEPTH_COUNTS)) counts[key] = d.core;
  return counts;
})();

/** Extra questions a relationship pack gains when the deep-dive is switched on. */
export const CATEGORY_DEEP_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(RELATIONSHIP_DEPTH_COUNTS).map(([key, d]) => [key, d.deep]),
);

/** Default selection: the full core assessment; every pack is opt-in. */
export const DEFAULT_SELECTED_CATEGORIES = [...CORE_CATEGORY_KEYS];

export interface ActiveQuestion {
  id: string;
  text: string;
  categoryKey: string;
}

/**
 * The ordered list of questions to present for the current selection.
 * `deepDive` adds the deep tier of any selected relationship pack.
 */
export function activeQuestions(selected: string[], deepDive = false): ActiveQuestion[] {
  const sel = new Set(selected);
  const core = QUESTIONS
    .filter(q => sel.has(q.group))
    .map(q => ({ id: q.id, text: q.text, categoryKey: q.group }));
  const optional = OPTIONAL_QUESTIONS
    .filter(q => sel.has(q.category))
    .map(q => ({ id: q.id, text: q.text, categoryKey: q.category }));
  const relationship = RELATIONSHIP_QUESTIONS
    .filter(q => sel.has(q.category) && (deepDive || q.depth === 'core'))
    .map(q => ({ id: q.id, text: q.text, categoryKey: q.category }));
  return [...core, ...optional, ...relationship];
}

/** Total core (scored) questions among the selected categories. */
export function coreSelectedTotal(selected: string[]): number {
  const sel = new Set(selected);
  return QUESTIONS.filter(q => sel.has(q.group)).length;
}

/** Count of core (scored) questions the user has answered — drives the persona gate. */
export function coreAnsweredCount(answers: Record<string, Answer>): number {
  return QUESTIONS.filter(q => isAnswered(answers[q.id])).length;
}

/** How many relationship questions this person has answered, out of those on offer. */
export function relationshipProgress(
  answers: Record<string, Answer>,
  deepDive = false,
): { answered: number; total: number } {
  const pool = RELATIONSHIP_QUESTIONS.filter(q => deepDive || q.depth === 'core');
  return {
    answered: pool.filter(q => isAnswered(answers[q.id])).length,
    total: pool.length,
  };
}

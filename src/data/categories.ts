// Unified category registry spanning the core assessment groups (A–H) and the
// optional question packs. Drives the category picker, the quiz question set,
// and the progress bar. Selecting a category adds its questions to the quiz.

import { QUESTIONS } from './questions';
import { OPTIONAL_QUESTIONS, OPTIONAL_CATEGORIES } from './optionalQuestions';
import type { Answer } from '../engine/scoring';
import { isAnswered } from '../engine/scoring';

export interface CategoryMeta {
  key: string;
  label: string;
  color: string;
  optional: boolean;
  blurb: string;
}

// Core groups mirror the labels/colours used in the quiz and radars.
export const CORE_CATEGORIES: CategoryMeta[] = [
  { key: 'A', label: 'Personality', color: '#7c5cff', optional: false, blurb: 'Big Five traits — openness, conscientiousness, extraversion, and more.' },
  { key: 'B', label: 'Values',      color: '#3b82f6', optional: false, blurb: 'What you prize in life (Schwartz values).' },
  { key: 'C', label: 'Morals',      color: '#10b981', optional: false, blurb: 'Your moral foundations and intuitions.' },
  { key: 'D', label: 'Politics',    color: '#ef4444', optional: false, blurb: 'Where you sit on the economic and social axes.' },
  { key: 'E', label: 'Philosophy',  color: '#f97316', optional: false, blurb: 'Your stances on knowledge, ethics, free will, and more.' },
  { key: 'F', label: 'Ontology',    color: '#14b8a6', optional: false, blurb: 'How you see reality, order, and the individual.' },
  { key: 'G', label: 'Humor',       color: '#db2777', optional: false, blurb: 'Your comedic sensibility.' },
  { key: 'H', label: 'Faith',       color: '#a855f7', optional: false, blurb: 'Religiosity, spirituality, and awe.' },
];

export const OPTIONAL_CATEGORY_METAS: CategoryMeta[] = OPTIONAL_CATEGORIES.map(o => ({
  key: o.key, label: o.label, color: o.color, optional: true, blurb: o.blurb,
}));

export const ALL_CATEGORIES: CategoryMeta[] = [...CORE_CATEGORIES, ...OPTIONAL_CATEGORY_METAS];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  ALL_CATEGORIES.map(c => [c.key, c]),
);

export const CORE_CATEGORY_KEYS = CORE_CATEGORIES.map(c => c.key);

/** Number of questions in each category, for display (e.g. "Parenting (50)"). */
export const CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const q of QUESTIONS) counts[q.group] = (counts[q.group] ?? 0) + 1;
  for (const q of OPTIONAL_QUESTIONS) counts[q.category] = (counts[q.category] ?? 0) + 1;
  return counts;
})();

/** Default selection: the full core assessment; optional packs are opt-in. */
export const DEFAULT_SELECTED_CATEGORIES = [...CORE_CATEGORY_KEYS];

export interface ActiveQuestion {
  id: string;
  text: string;
  categoryKey: string;
}

/** The ordered list of questions to present for the current selection. */
export function activeQuestions(selected: string[]): ActiveQuestion[] {
  const sel = new Set(selected);
  const core = QUESTIONS
    .filter(q => sel.has(q.group))
    .map(q => ({ id: q.id, text: q.text, categoryKey: q.group }));
  const optional = OPTIONAL_QUESTIONS
    .filter(q => sel.has(q.category))
    .map(q => ({ id: q.id, text: q.text, categoryKey: q.category }));
  return [...core, ...optional];
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

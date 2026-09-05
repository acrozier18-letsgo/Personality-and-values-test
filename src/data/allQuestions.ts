// The core and optional question pools flattened into one addressable list.
//
// Core questions carry dimension weights and feed the radars; optional-pack
// questions don't. Anything that works item-by-item rather than dimension-by-
// dimension — comparing two people, diffing two snapshots, predicting a
// partner — needs both pools under one shape, which is what this provides.
//
// Scoring deliberately does NOT use this: only weighted core questions produce
// dimension scores.

import { QUESTIONS } from './questions';
import { OPTIONAL_QUESTIONS } from './optionalQuestions';
import { CATEGORY_MAP } from './categories';

export interface UnifiedQuestion {
  id: string;
  text: string;
  /** Core group ('A'–'H') or optional pack key ('parenting', 'intimacy', …). */
  categoryKey: string;
  categoryLabel: string;
  categoryColor: string;
  optional: boolean;
}

function unify(id: string, text: string, categoryKey: string, optional: boolean): UnifiedQuestion {
  const cat = CATEGORY_MAP[categoryKey];
  return {
    id,
    text,
    categoryKey,
    categoryLabel: cat?.label ?? categoryKey,
    categoryColor: cat?.color ?? '#8a857a',
    optional,
  };
}

/** Every question in the app, core first, in stable canonical order. */
export const ALL_QUESTIONS: UnifiedQuestion[] = [
  ...QUESTIONS.map((q) => unify(q.id, q.text, q.group, false)),
  ...OPTIONAL_QUESTIONS.map((q) => unify(q.id, q.text, q.category, true)),
];

export const ALL_QUESTION_MAP: Record<string, UnifiedQuestion> = Object.fromEntries(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);

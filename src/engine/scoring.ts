import type { DimensionKey } from '../data/dimensions';
import { DIMENSIONS } from '../data/dimensions';
import type { Question } from '../data/questions';

export type Answer =
  | 'strongly_disagree'
  | 'disagree'
  | 'no_opinion'
  | 'agree'
  | 'strongly_agree';

/** Numeric response each option contributes (−2..+2). */
export const ANSWER_VALUES: Record<Answer, number> = {
  strongly_disagree: -2,
  disagree: -1,
  no_opinion: 0,
  agree: 1,
  strongly_agree: 2,
};

/** Human-readable labels, ordered most-agree to most-disagree for display. */
export const ANSWER_LABELS: Record<Answer, string> = {
  strongly_agree: 'Strongly Agree',
  agree: 'Agree',
  no_opinion: 'No Opinion',
  disagree: 'Disagree',
  strongly_disagree: 'Strongly Disagree',
};

export function isAnswered(a: Answer | undefined | null): a is Answer {
  return a != null && a in ANSWER_VALUES;
}

/** Count of questions the user has actually responded to (any of the 5 options). */
export function countAnswered(answers: Record<string, Answer>): number {
  return Object.values(answers).filter(isAnswered).length;
}

/** Share of questions that must be answered before the persona/results unlock. */
export const PERSONA_UNLOCK_RATIO = 0.75;

/** Minimum number of answered questions needed to unlock the persona. */
export function personaUnlockThreshold(total: number): number {
  return Math.ceil(total * PERSONA_UNLOCK_RATIO);
}

export interface DimensionScore {
  score: number;
  confidence: number;
  answeredTouching: number;
  totalTouching: number;
}

export interface ScoringResult {
  scores: Record<DimensionKey, DimensionScore>;
  overallCompletion: number;
}

export function scoreAnswers(
  answers: Record<string, Answer>,
  questions: Question[],
): ScoringResult {
  const answered = countAnswered(answers);
  const overallCompletion = questions.length === 0 ? 0 : answered / questions.length;

  const scores = {} as Record<DimensionKey, DimensionScore>;

  for (const dim of DIMENSIONS) {
    const key = dim.key;
    let raw = 0;
    let maxPossible = 0;
    let answeredTouching = 0;
    let totalTouching = 0;

    for (const q of questions) {
      const w = q.weights[key];
      if (w === undefined) continue;
      totalTouching++;
      const a = answers[q.id];
      if (isAnswered(a)) {
        // response ∈ [-2, +2]; max magnitude per answered question is |w| * 2
        raw += ANSWER_VALUES[a] * w;
        maxPossible += Math.abs(w) * 2;
        answeredTouching++;
      }
      // unanswered (question left blank): contributes nothing
    }

    const normalized = maxPossible === 0 ? 0 : raw / maxPossible;
    let score: number;
    if (dim.type === 'bipolar') {
      score = Math.round(normalized * 100);
    } else {
      score = Math.round(((normalized + 1) / 2) * 100);
    }

    scores[key] = {
      score,
      confidence: totalTouching === 0 ? 0 : answeredTouching / totalTouching,
      answeredTouching,
      totalTouching,
    };
  }

  return { scores, overallCompletion };
}

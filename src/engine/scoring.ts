import type { DimensionKey } from '../data/dimensions';
import { DIMENSIONS } from '../data/dimensions';
import type { Question } from '../data/questions';

export type Answer = 'yes' | 'no' | 'skip';

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
  const answered = Object.values(answers).filter(a => a === 'yes' || a === 'no').length;
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
      if (a === 'yes') {
        raw += w;
        maxPossible += Math.abs(w);
        answeredTouching++;
      } else if (a === 'no') {
        raw -= w;
        maxPossible += Math.abs(w);
        answeredTouching++;
      }
      // skip: contributes nothing
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

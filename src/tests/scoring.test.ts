import { describe, it, expect } from 'vitest';
import { scoreAnswers, countAnswered } from '../engine/scoring';
import { QUESTIONS } from '../data/questions';
import { DIMENSIONS } from '../data/dimensions';
import type { Answer } from '../engine/scoring';

function allAnswers(val: Answer): Record<string, Answer> {
  return Object.fromEntries(QUESTIONS.map(q => [q.id, val]));
}

describe('scoreAnswers', () => {
  it('no answers → 0 confidence for every dimension, neutral scores', () => {
    const result = scoreAnswers({}, QUESTIONS);
    for (const dim of DIMENSIONS) {
      const s = result.scores[dim.key];
      expect(s.confidence).toBe(0);
      expect(s.answeredTouching).toBe(0);
      expect(s.score).toBe(dim.type === 'bipolar' ? 0 : 50);
    }
    expect(result.overallCompletion).toBe(0);
  });

  it('all "No Opinion" → full confidence but neutral scores', () => {
    const result = scoreAnswers(allAnswers('no_opinion'), QUESTIONS);
    for (const dim of DIMENSIONS) {
      const s = result.scores[dim.key];
      if (s.totalTouching === 0) continue;
      expect(s.confidence).toBe(1);
      // Neutral contributes 0 to raw → midpoint score
      expect(s.score).toBe(dim.type === 'bipolar' ? 0 : 50);
    }
    // Every question was answered (neutral still counts as answered)
    expect(result.overallCompletion).toBe(1);
  });

  it('all "Strongly Agree" → full confidence, scores in valid range', () => {
    const result = scoreAnswers(allAnswers('strongly_agree'), QUESTIONS);
    for (const dim of DIMENSIONS) {
      const s = result.scores[dim.key];
      if (s.totalTouching > 0) {
        expect(s.confidence).toBe(1);
        if (dim.type === 'unipolar') {
          expect(s.score).toBeGreaterThanOrEqual(0);
          expect(s.score).toBeLessThanOrEqual(100);
        } else {
          expect(s.score).toBeGreaterThanOrEqual(-100);
          expect(s.score).toBeLessThanOrEqual(100);
        }
      }
    }
    expect(result.overallCompletion).toBe(1);
  });

  it('all "Strongly Disagree" → mirror of all "Strongly Agree"', () => {
    const agree    = scoreAnswers(allAnswers('strongly_agree'), QUESTIONS);
    const disagree = scoreAnswers(allAnswers('strongly_disagree'), QUESTIONS);
    for (const dim of DIMENSIONS) {
      if (agree.scores[dim.key].totalTouching === 0) continue;
      if (dim.type === 'bipolar') {
        expect(disagree.scores[dim.key].score + agree.scores[dim.key].score).toBeCloseTo(0);
      } else {
        expect(disagree.scores[dim.key].score + agree.scores[dim.key].score).toBe(100);
      }
    }
  });

  it('"Agree" is half the magnitude of "Strongly Agree"', () => {
    // q005 → { extraversion: 3 } (unipolar), only question answered
    const sa = scoreAnswers({ q005: 'strongly_agree' }, QUESTIONS).scores['extraversion'];
    const a  = scoreAnswers({ q005: 'agree' }, QUESTIONS).scores['extraversion'];
    expect(sa.score).toBe(100); // +2 * 3 / (3*2) = 1 → unipolar 100
    expect(a.score).toBe(75);   // +1 * 3 / (3*2) = 0.5 → unipolar 75
  });

  it('overallCompletion is correct for partial answers', () => {
    const partial: Record<string, Answer> = {};
    QUESTIONS.slice(0, 50).forEach(q => { partial[q.id] = 'agree'; });
    const result = scoreAnswers(partial, QUESTIONS);
    expect(result.overallCompletion).toBeCloseTo(50 / QUESTIONS.length, 5);
    expect(countAnswered(partial)).toBe(50);
  });

  it('confidence per dimension is answeredTouching/totalTouching', () => {
    // Only q001 answered (touches epistemology and timeOrientation)
    const result = scoreAnswers({ q001: 'strongly_agree' }, QUESTIONS);
    const ep = result.scores['epistemology'];
    const to = result.scores['timeOrientation'];
    expect(ep.answeredTouching).toBe(1);
    expect(ep.confidence).toBe(1 / ep.totalTouching);
    expect(to.answeredTouching).toBe(1);
    expect(to.confidence).toBe(1 / to.totalTouching);
  });

  it('"No Opinion" counts as answered but contributes nothing to the score', () => {
    // q005 → extraversion:3. Neutral answer: answered, but midpoint score.
    const e = scoreAnswers({ q005: 'no_opinion' }, QUESTIONS).scores['extraversion'];
    expect(e.answeredTouching).toBe(1);
    expect(e.score).toBe(50);
  });

  it('hand-computed: q003 Strongly Agree → economicAxis −100', () => {
    // q003 weight { economicAxis: -3 }; +2 * -3 = -6; maxPossible 6; normalized -1; bipolar → -100
    const econ = scoreAnswers({ q003: 'strongly_agree' }, QUESTIONS).scores['economicAxis'];
    expect(econ.score).toBe(-100);
  });

  it('hand-computed: q004 Strongly Disagree → moralRealism −100', () => {
    // q004 weight { moralRealism: 3 }; -2 * 3 = -6; maxPossible 6; normalized -1; bipolar → -100
    const mr = scoreAnswers({ q004: 'strongly_disagree' }, QUESTIONS).scores['moralRealism'];
    expect(mr.score).toBe(-100);
  });

  it('mixed answers produce scores in valid range', () => {
    const pool: Answer[] = ['strongly_agree', 'agree', 'no_opinion', 'disagree', 'strongly_disagree'];
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach((q, i) => { answers[q.id] = pool[i % pool.length]; });
    const result = scoreAnswers(answers, QUESTIONS);
    for (const dim of DIMENSIONS) {
      const s = result.scores[dim.key];
      if (dim.type === 'bipolar') {
        expect(s.score).toBeGreaterThanOrEqual(-100);
        expect(s.score).toBeLessThanOrEqual(100);
      } else {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

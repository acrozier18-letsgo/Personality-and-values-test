import { describe, it, expect } from 'vitest';
import { scoreAnswers } from '../engine/scoring';
import { QUESTIONS } from '../data/questions';
import { DIMENSIONS } from '../data/dimensions';
import type { Answer } from '../engine/scoring';

function allAnswers(val: Answer): Record<string, Answer> {
  return Object.fromEntries(QUESTIONS.map(q => [q.id, val]));
}

describe('scoreAnswers', () => {
  it('all-skip → 0 confidence for every dimension, neutral scores', () => {
    const result = scoreAnswers(allAnswers('skip'), QUESTIONS);
    for (const dim of DIMENSIONS) {
      const s = result.scores[dim.key];
      expect(s.confidence).toBe(0);
      if (dim.type === 'bipolar') {
        expect(s.score).toBe(0);
      } else {
        expect(s.score).toBe(50);
      }
    }
    expect(result.overallCompletion).toBe(0);
  });

  it('all-yes → full confidence, scores in valid range', () => {
    const result = scoreAnswers(allAnswers('yes'), QUESTIONS);
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

  it('all-no → opposite result from all-yes for each dimension', () => {
    const yes = scoreAnswers(allAnswers('yes'), QUESTIONS);
    const no  = scoreAnswers(allAnswers('no'),  QUESTIONS);
    for (const dim of DIMENSIONS) {
      if (yes.scores[dim.key].totalTouching === 0) continue;
      if (dim.type === 'bipolar') {
        // handle -0 === 0 in JS
        expect(no.scores[dim.key].score + yes.scores[dim.key].score).toBeCloseTo(0);
      } else {
        // unipolar mirrors around 50
        expect(no.scores[dim.key].score + yes.scores[dim.key].score).toBe(100);
      }
    }
  });

  it('overallCompletion is correct for partial answers', () => {
    const partial: Record<string, Answer> = {};
    QUESTIONS.slice(0, 50).forEach(q => { partial[q.id] = 'yes'; });
    const result = scoreAnswers(partial, QUESTIONS);
    expect(result.overallCompletion).toBeCloseTo(50 / 200, 5);
  });

  it('confidence per dimension is answeredTouching/totalTouching', () => {
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach(q => { answers[q.id] = 'skip'; });
    // Answer only q001
    answers['q001'] = 'yes';
    const result = scoreAnswers(answers, QUESTIONS);
    // q001 touches epistemology and timeOrientation
    const ep = result.scores['epistemology'];
    const to = result.scores['timeOrientation'];
    expect(ep.answeredTouching).toBe(1);
    expect(ep.confidence).toBe(1 / ep.totalTouching);
    expect(to.answeredTouching).toBe(1);
    expect(to.confidence).toBe(1 / to.totalTouching);
  });

  it('hand-computed: q005 yes → extraversion score', () => {
    // q005 has weight { extraversion: 3 }, and it's the only question answered
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach(q => { answers[q.id] = 'skip'; });
    answers['q005'] = 'yes'; // extraversion +3

    const result = scoreAnswers(answers, QUESTIONS);
    const e = result.scores['extraversion'];
    // Only one answered question with +3; maxPossible=3; normalized=1; unipolar→100
    expect(e.score).toBe(100);
    expect(e.answeredTouching).toBe(1);
  });

  it('hand-computed: q003 yes → economicAxis score', () => {
    // q003 weight { economicAxis: -3 }; yes → sign=+1; raw=-3; maxPossible=3; normalized=-1; bipolar→-100
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach(q => { answers[q.id] = 'skip'; });
    answers['q003'] = 'yes';

    const result = scoreAnswers(answers, QUESTIONS);
    const econ = result.scores['economicAxis'];
    expect(econ.score).toBe(-100);
  });

  it('hand-computed: q004 no → moralRealism score', () => {
    // q004 weight { moralRealism: 3 }; no → sign=-1; raw=-3; maxPossible=3; normalized=-1; bipolar→-100
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach(q => { answers[q.id] = 'skip'; });
    answers['q004'] = 'no';

    const result = scoreAnswers(answers, QUESTIONS);
    const mr = result.scores['moralRealism'];
    expect(mr.score).toBe(-100);
  });

  it('mixed yes/no produces scores in valid range', () => {
    const answers: Record<string, Answer> = {};
    QUESTIONS.forEach((q, i) => {
      answers[q.id] = i % 3 === 0 ? 'yes' : i % 3 === 1 ? 'no' : 'skip';
    });
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

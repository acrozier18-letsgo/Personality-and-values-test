import { describe, it, expect } from 'vitest';
import {
  ACCURACY_THRESHOLD,
  CONFIDENCE_VALUES,
  MIN_ROUND_SIZE,
  availableItemCount,
  quadrantOf,
  scoreKnowingMap,
  selectItems,
} from '../engine/knowingMap';
import type { Confidence, Prediction } from '../engine/knowingMap';
import type { Answer } from '../engine/scoring';
import { ALL_QUESTIONS } from '../data/allQuestions';

const SCALE: Answer[] = ['strongly_disagree', 'disagree', 'no_opinion', 'agree', 'strongly_agree'];

/** An answer set covering every question, cycling through the scale. */
function fullProfile(): Record<string, Answer> {
  return Object.fromEntries(ALL_QUESTIONS.map((q, i) => [q.id, SCALE[i % SCALE.length]]));
}

function predict(ids: string[], answer: (id: string) => Answer, confidence: Confidence) {
  return Object.fromEntries(
    ids.map((id) => [id, { answer: answer(id), confidence } satisfies Prediction]),
  );
}

describe('quadrantOf', () => {
  it('puts confident hits in real knowledge and confident misses in blind spots', () => {
    expect(quadrantOf(4, true)).toBe('real_knowledge');
    expect(quadrantOf(4, false)).toBe('blind_spot');
    expect(quadrantOf(3, false)).toBe('blind_spot');
  });

  it('puts unsure guesses in intuition or humble gaps', () => {
    expect(quadrantOf(1, true)).toBe('quiet_intuition');
    expect(quadrantOf(2, false)).toBe('humble_gap');
  });

  it('splits the four levels evenly either side of the midpoint', () => {
    expect(CONFIDENCE_VALUES[2]).toBeLessThan(0.5);
    expect(CONFIDENCE_VALUES[3]).toBeGreaterThan(0.5);
  });
});

describe('selectItems', () => {
  const profile = fullProfile();

  it('returns the requested number of statements', () => {
    expect(selectItems(profile, 20, 'seed')).toHaveLength(20);
    expect(selectItems(profile, 10, 'seed')).toHaveLength(10);
  });

  it('is deterministic for a given seed and varies across seeds', () => {
    const a = selectItems(profile, 20, 'alpha').map((q) => q.id);
    const b = selectItems(profile, 20, 'alpha').map((q) => q.id);
    const c = selectItems(profile, 20, 'beta').map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('never repeats a statement', () => {
    const ids = selectItems(profile, 30, 'seed').map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only picks statements the subject answered', () => {
    const sparse: Record<string, Answer> = { q001: 'agree', q002: 'disagree', q003: 'strongly_agree' };
    const picked = selectItems(sparse, 20, 'seed');
    expect(picked.map((q) => q.id).sort()).toEqual(['q001', 'q002', 'q003']);
  });

  it('spreads across categories rather than draining one pack', () => {
    const cats = new Set(selectItems(profile, 20, 'seed').map((q) => q.categoryKey));
    expect(cats.size).toBeGreaterThan(4);
  });

  it('prefers opinionated answers over no-opinion ones', () => {
    // Three real opinions, and a large pool of no-opinion answers.
    const answers: Record<string, Answer> = {};
    for (const q of ALL_QUESTIONS.slice(0, 60)) answers[q.id] = 'no_opinion';
    answers[ALL_QUESTIONS[70].id] = 'agree';
    answers[ALL_QUESTIONS[71].id] = 'disagree';
    answers[ALL_QUESTIONS[72].id] = 'strongly_agree';

    const picked = selectItems(answers, 3, 'seed').map((q) => q.id);
    expect(picked.sort()).toEqual(
      [ALL_QUESTIONS[70].id, ALL_QUESTIONS[71].id, ALL_QUESTIONS[72].id].sort(),
    );
  });

  it('tops up from no-opinion answers when there are too few opinions', () => {
    const answers: Record<string, Answer> = { q001: 'agree' };
    for (const q of ALL_QUESTIONS.slice(10, 20)) answers[q.id] = 'no_opinion';
    expect(selectItems(answers, 6, 'seed')).toHaveLength(6);
  });
});

describe('availableItemCount', () => {
  it('counts answered statements across core and optional packs', () => {
    expect(availableItemCount({ q001: 'agree', par001: 'disagree' })).toBe(2);
    expect(availableItemCount({})).toBe(0);
  });
});

describe('scoreKnowingMap', () => {
  const subject: Record<string, Answer> = {
    q001: 'strongly_agree',
    q002: 'strongly_agree',
    q003: 'agree',
    q004: 'disagree',
  };
  const ids = ['q001', 'q002', 'q003', 'q004'];

  it('scores a perfect confident round as all real knowledge', () => {
    const r = scoreKnowingMap(ids, predict(ids, (id) => subject[id], 4), subject);
    expect(r.answered).toBe(4);
    expect(r.accuracyPct).toBe(100);
    expect(r.exactPct).toBe(100);
    expect(r.quadrants.real_knowledge).toHaveLength(4);
    expect(r.blindSpots).toHaveLength(0);
  });

  it('flags confident misses as blind spots, sparing near-misses', () => {
    const r = scoreKnowingMap(ids, predict(ids, () => 'strongly_disagree', 4), subject);
    // q001–q003 are badly wrong; q004 ("disagree") is one step out, so it still
    // counts as knowing them and lands in real knowledge instead.
    expect(r.blindSpots.map((s) => s.question.id).sort()).toEqual(['q001', 'q002', 'q003']);
    expect(r.quadrants.real_knowledge.map((s) => s.question.id)).toEqual(['q004']);
    expect(r.calibrationLabel).toBe('Overconfident');
  });

  it('counts a one-step miss as accurate but not exact', () => {
    const r = scoreKnowingMap(['q001'], { q001: { answer: 'agree', confidence: 4 } }, subject);
    expect(r.scored[0].stepsOff).toBe(1);
    expect(r.scored[0].agreement).toBe(ACCURACY_THRESHOLD);
    expect(r.scored[0].accurate).toBe(true);
    expect(r.exactPct).toBe(0);
    expect(r.quadrants.real_knowledge).toHaveLength(1);
  });

  it('counts a two-step miss as inaccurate', () => {
    const r = scoreKnowingMap(['q001'], { q001: { answer: 'no_opinion', confidence: 4 } }, subject);
    expect(r.scored[0].stepsOff).toBe(2);
    expect(r.scored[0].accurate).toBe(false);
    expect(r.scored[0].quadrant).toBe('blind_spot');
  });

  it('calls unsure hits quiet intuition and reports underconfidence', () => {
    const r = scoreKnowingMap(ids, predict(ids, (id) => subject[id], 1), subject);
    expect(r.quadrants.quiet_intuition).toHaveLength(4);
    expect(r.calibration).toBeLessThan(0);
    expect(r.calibrationLabel).toBe('You know them better than you think');
  });

  it('skips statements the predictor never answered', () => {
    const r = scoreKnowingMap(ids, { q001: { answer: 'strongly_agree', confidence: 3 } }, subject);
    expect(r.answered).toBe(1);
    expect(r.total).toBe(4);
    expect(r.accuracyPct).toBe(100);
  });

  it('skips statements the subject turns out not to have answered', () => {
    const r = scoreKnowingMap(
      ['q001', 'q999'],
      { q001: { answer: 'strongly_agree', confidence: 3 }, q999: { answer: 'agree', confidence: 3 } },
      subject,
    );
    expect(r.answered).toBe(1);
  });

  it('handles an empty round without dividing by zero', () => {
    const r = scoreKnowingMap([], {}, subject);
    expect(r.answered).toBe(0);
    expect(r.accuracyPct).toBe(0);
    expect(r.confidencePct).toBe(0);
    expect(r.blindSpots).toEqual([]);
    expect(r.byCategory).toEqual([]);
  });

  it('sorts blind spots worst-miss first', () => {
    const r = scoreKnowingMap(
      ['q001', 'q002'],
      {
        q001: { answer: 'no_opinion', confidence: 4 },        // 2 steps off
        q002: { answer: 'strongly_disagree', confidence: 4 }, // 4 steps off
      },
      subject,
    );
    expect(r.blindSpots.map((s) => s.question.id)).toEqual(['q002', 'q001']);
  });

  it('groups accuracy by category', () => {
    const r = scoreKnowingMap(ids, predict(ids, (id) => subject[id], 3), subject);
    expect(r.byCategory.length).toBeGreaterThan(0);
    expect(r.byCategory.every((c) => c.pct === 100)).toBe(true);
    expect(r.byCategory.reduce((t, c) => t + c.count, 0)).toBe(4);
  });

  it('reports well-calibrated when confidence tracks accuracy', () => {
    // Half right at middling confidence lands near the diagonal.
    const r = scoreKnowingMap(
      ids,
      {
        q001: { answer: 'strongly_agree', confidence: 3 },
        q002: { answer: 'strongly_agree', confidence: 3 },
        q003: { answer: 'strongly_disagree', confidence: 2 },
        q004: { answer: 'strongly_agree', confidence: 2 },
      },
      subject,
    );
    expect(Math.abs(r.calibration)).toBeLessThan(20);
  });

  it('keeps the minimum round size meaningfully small', () => {
    expect(MIN_ROUND_SIZE).toBeGreaterThanOrEqual(5);
    expect(MIN_ROUND_SIZE).toBeLessThan(20);
  });
});

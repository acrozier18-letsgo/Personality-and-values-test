import { describe, it, expect } from 'vitest';
import {
  computeGrowth,
  describeArc,
  movementPhrase,
  scoreSnapshot,
  sortSnapshots,
  statementChanges,
  MEANINGFUL_DELTA,
} from '../engine/growth';
import type { Snapshot } from '../engine/growth';
import type { Answer } from '../engine/scoring';
import { QUESTIONS } from '../data/questions';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2024, 0, 1);

/** Every core question answered the same way — a fully-answered snapshot. */
function uniform(answer: Answer): Record<string, Answer> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, answer]));
}

function snap(id: string, takenAt: number, answers: Record<string, Answer>): Snapshot {
  return { id, label: id, takenAt, source: 'saved', answers };
}

describe('sortSnapshots', () => {
  it('orders oldest first regardless of input order', () => {
    const out = sortSnapshots([
      snap('c', T0 + 2 * DAY, {}),
      snap('a', T0, {}),
      snap('b', T0 + DAY, {}),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('scoreSnapshot', () => {
  it('counts answered questions and produces scores', () => {
    const s = scoreSnapshot(snap('x', T0, { q001: 'agree', q002: 'disagree' }));
    expect(s.answeredCount).toBe(2);
    expect(s.scores.openness).toBeDefined();
  });
});

describe('computeGrowth', () => {
  it('returns null with fewer than two snapshots', () => {
    expect(computeGrowth([])).toBeNull();
    expect(computeGrowth([snap('a', T0, uniform('agree'))])).toBeNull();
  });

  it('returns null when both endpoints resolve to the same snapshot', () => {
    const snaps = [snap('a', T0, uniform('agree')), snap('b', T0 + DAY, uniform('disagree'))];
    expect(computeGrowth(snaps, 'a', 'a')).toBeNull();
  });

  it('reports 100% continuity and no movement for an unchanged profile', () => {
    const answers = uniform('agree');
    const g = computeGrowth([snap('a', T0, answers), snap('b', T0 + 30 * DAY, answers)])!;
    expect(g.continuity).toBe(100);
    expect(g.movements).toHaveLength(0);
    expect(g.changedStatements).toHaveLength(0);
    expect(g.anchors.length).toBeGreaterThan(0);
  });

  it('defaults the endpoints to the oldest and newest snapshots', () => {
    const g = computeGrowth([
      snap('mid', T0 + DAY, uniform('agree')),
      snap('new', T0 + 2 * DAY, uniform('disagree')),
      snap('old', T0, uniform('strongly_agree')),
    ])!;
    expect(g.from.id).toBe('old');
    expect(g.to.id).toBe('new');
    expect(g.snapshots.map((s) => s.id)).toEqual(['old', 'mid', 'new']);
  });

  it('honours explicit endpoints', () => {
    const g = computeGrowth(
      [
        snap('a', T0, uniform('agree')),
        snap('b', T0 + DAY, uniform('disagree')),
        snap('c', T0 + 2 * DAY, uniform('strongly_agree')),
      ],
      'b',
      'c',
    )!;
    expect(g.from.id).toBe('b');
    expect(g.to.id).toBe('c');
  });

  it('detects large movement between opposite profiles', () => {
    const g = computeGrowth([
      snap('a', T0, uniform('strongly_disagree')),
      snap('b', T0 + 365 * DAY, uniform('strongly_agree')),
    ])!;
    expect(g.movements.length).toBeGreaterThan(0);
    expect(g.continuity).toBeLessThan(50);
    expect(g.spanDays).toBe(365);
    // Every reported movement clears the noise floor and is sorted by size.
    for (const m of g.movements) expect(Math.abs(m.delta)).toBeGreaterThanOrEqual(MEANINGFUL_DELTA);
    const sizes = g.movements.map((m) => Math.abs(m.delta));
    expect([...sizes].sort((x, y) => y - x)).toEqual(sizes);
  });

  it('excludes dimensions too thinly answered in either endpoint', () => {
    // A single answered question can never reach the confidence gate.
    const thin = { q001: 'agree' as Answer };
    const g = computeGrowth([snap('a', T0, thin), snap('b', T0 + DAY, uniform('strongly_agree'))])!;
    expect(g.comparableCount).toBe(0);
    expect(g.movements).toHaveLength(0);
    expect(g.continuity).toBe(0);
    expect(g.trends.every((t) => !t.comparable)).toBe(true);
  });

  it('keeps every dimension in trends even when not comparable', () => {
    const g = computeGrowth([snap('a', T0, { q001: 'agree' }), snap('b', T0 + DAY, uniform('agree'))])!;
    expect(g.trends.length).toBeGreaterThan(40);
    expect(g.trends[0].points).toHaveLength(2);
  });

  it('gives each trend one point per snapshot, in time order', () => {
    const g = computeGrowth([
      snap('a', T0, uniform('strongly_disagree')),
      snap('b', T0 + DAY, uniform('no_opinion')),
      snap('c', T0 + 2 * DAY, uniform('strongly_agree')),
    ])!;
    const t = g.trends[0];
    expect(t.points.map((p) => p.at)).toEqual([T0, T0 + DAY, T0 + 2 * DAY]);
    expect(t.min).toBeLessThanOrEqual(t.max);
  });

  it('never reports a negative span', () => {
    const g = computeGrowth(
      [snap('a', T0, uniform('agree')), snap('b', T0 + 10 * DAY, uniform('disagree'))],
      'b',
      'a',
    )!;
    expect(g.spanDays).toBe(0);
  });
});

describe('statementChanges', () => {
  it('reports only statements answered differently in both snapshots', () => {
    const from: Record<string, Answer> = { q001: 'agree', q002: 'agree', q003: 'agree' };
    const to: Record<string, Answer> = { q001: 'strongly_disagree', q002: 'agree' };
    const changes = statementChanges(from, to);
    expect(changes.map((c) => c.id)).toEqual(['q001']);
    expect(changes[0].distance).toBe(0.75);
    expect(changes[0].direction).toBe('toward_disagree');
    expect(changes[0].fromLabel).toBe('Agree');
  });

  it('sorts by how far the answer travelled', () => {
    const from: Record<string, Answer> = { q001: 'agree', q002: 'agree' };
    const to: Record<string, Answer> = { q001: 'no_opinion', q002: 'strongly_disagree' };
    expect(statementChanges(from, to).map((c) => c.id)).toEqual(['q002', 'q001']);
  });

  it('includes optional-pack statements', () => {
    const changes = statementChanges({ par001: 'agree' }, { par001: 'disagree' });
    expect(changes).toHaveLength(1);
    expect(changes[0].id).toBe('par001');
  });
});

describe('movementPhrase', () => {
  it('names the pole for a bipolar dimension', () => {
    const g = computeGrowth([
      snap('a', T0, uniform('strongly_disagree')),
      snap('b', T0 + DAY, uniform('strongly_agree')),
    ])!;
    const bipolar = g.trends.find((t) => t.type === 'bipolar' && t.comparable)!;
    expect(movementPhrase(bipolar)).toMatch(/^moved toward /);
  });

  it('uses rose/fell for a unipolar dimension', () => {
    const g = computeGrowth([
      snap('a', T0, uniform('strongly_disagree')),
      snap('b', T0 + DAY, uniform('strongly_agree')),
    ])!;
    const uni = g.trends.find((t) => t.type === 'unipolar' && t.comparable)!;
    expect(['rose', 'fell']).toContain(movementPhrase(uni));
  });
});

describe('describeArc', () => {
  it('explains the problem when nothing is comparable', () => {
    const g = computeGrowth([snap('a', T0, { q001: 'agree' }), snap('b', T0 + DAY, { q002: 'agree' })])!;
    expect(describeArc(g).join(' ')).toMatch(/don't overlap enough/);
  });

  it('leads with the continuity figure for a real comparison', () => {
    const answers = uniform('agree');
    const g = computeGrowth([snap('a', T0, answers), snap('b', T0 + 60 * DAY, answers)])!;
    const lines = describeArc(g);
    expect(lines[0]).toContain('100%');
    expect(lines.join(' ')).toMatch(/noise floor/);
  });
});

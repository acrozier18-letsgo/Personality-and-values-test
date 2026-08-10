import { describe, it, expect } from 'vitest';
import { computeCompatibility, itemAgreement } from '../engine/compatibility';
import type { Answer } from '../engine/scoring';

describe('itemAgreement', () => {
  it('identical answers → 1', () => expect(itemAgreement('agree', 'agree')).toBe(1));
  it('opposite extremes → 0', () => expect(itemAgreement('strongly_agree', 'strongly_disagree')).toBe(0));
  it('one step apart → 0.75', () => expect(itemAgreement('agree', 'strongly_agree')).toBe(0.75));
  it('two steps apart → 0.5', () => expect(itemAgreement('agree', 'disagree')).toBe(0.5));
});

describe('computeCompatibility', () => {
  it('is 100% when both answer everything identically', () => {
    const a: Record<string, Answer> = { q001: 'agree', q002: 'strongly_disagree', par001: 'agree' };
    const r = computeCompatibility(a, a);
    expect(r.overall).toBe(100);
    expect(r.sharedCount).toBe(3);
    expect(r.topClashes).toHaveLength(0);
  });

  it('is 0% when both answer everything oppositely', () => {
    const you: Record<string, Answer> = { q001: 'strongly_agree', q002: 'strongly_agree' };
    const them: Record<string, Answer> = { q001: 'strongly_disagree', q002: 'strongly_disagree' };
    const r = computeCompatibility(you, them);
    expect(r.overall).toBe(0);
    expect(r.topAgreements).toHaveLength(0);
    expect(r.topClashes.length).toBeGreaterThan(0);
  });

  it('only counts questions both answered', () => {
    const you: Record<string, Answer> = { q001: 'agree', q002: 'agree' };
    const them: Record<string, Answer> = { q001: 'agree' }; // q002 not answered
    const r = computeCompatibility(you, them);
    expect(r.sharedCount).toBe(1);
    expect(r.overall).toBe(100);
  });

  it('groups shared questions into their categories', () => {
    const you: Record<string, Answer> = { q001: 'agree', par001: 'agree' };
    const them: Record<string, Answer> = { q001: 'agree', par001: 'disagree' };
    const r = computeCompatibility(you, them);
    const keys = r.categories.map(c => c.key);
    expect(keys).toContain('parenting');
    // q001 is a core Philosophy/E question; ensure a core group is represented too
    expect(r.categories.length).toBeGreaterThanOrEqual(2);
  });
});

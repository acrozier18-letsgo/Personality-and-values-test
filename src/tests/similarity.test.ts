import { describe, it, expect } from 'vitest';
import { normalizeScore, cosineSimilarity, euclideanDistance } from '../engine/similarity';
import type { DimensionKey, DimensionType } from '../data/dimensions';

const bipolarTypes: Record<DimensionKey, DimensionType> = {
  openness: 'unipolar', conscientiousness: 'unipolar', extraversion: 'unipolar',
  agreeableness: 'unipolar', neuroticism: 'unipolar', selfDirection: 'unipolar',
  stimulation: 'unipolar', hedonism: 'unipolar', achievement: 'unipolar', power: 'unipolar',
  security: 'unipolar', conformity: 'unipolar', tradition: 'unipolar', benevolence: 'unipolar',
  universalism: 'unipolar', care: 'unipolar', fairness: 'unipolar', loyalty: 'unipolar',
  authority: 'unipolar', sanctity: 'unipolar', liberty: 'unipolar',
  economicAxis: 'bipolar', socialAxis: 'bipolar', epistemology: 'bipolar',
  metaphysics: 'bipolar', freeWill: 'bipolar', ethicsFramework: 'bipolar',
  moralRealism: 'bipolar', humanNature: 'bipolar', timeOrientation: 'bipolar',
  realismConstructivism: 'bipolar', orderChaos: 'bipolar', individualCollective: 'bipolar',
  reductionHolism: 'bipolar',
};

describe('normalizeScore', () => {
  it('bipolar: 100 → 1', () => expect(normalizeScore(100, 'bipolar')).toBeCloseTo(1));
  it('bipolar: -100 → -1', () => expect(normalizeScore(-100, 'bipolar')).toBeCloseTo(-1));
  it('bipolar: 0 → 0', () => expect(normalizeScore(0, 'bipolar')).toBeCloseTo(0));
  it('unipolar: 100 → 1', () => expect(normalizeScore(100, 'unipolar')).toBeCloseTo(1));
  it('unipolar: 0 → -1', () => expect(normalizeScore(0, 'unipolar')).toBeCloseTo(-1));
  it('unipolar: 50 → 0', () => expect(normalizeScore(50, 'unipolar')).toBeCloseTo(0));
});

describe('cosineSimilarity', () => {
  it('identical bipolar vectors → ~1', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 60, socialAxis: -40 };
    const b: Partial<Record<DimensionKey, number>> = { economicAxis: 60, socialAxis: -40 };
    expect(cosineSimilarity(a, b, bipolarTypes)).toBeCloseTo(1);
  });

  it('opposite bipolar vectors → ~-1', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 100, socialAxis: 100 };
    const b: Partial<Record<DimensionKey, number>> = { economicAxis: -100, socialAxis: -100 };
    expect(cosineSimilarity(a, b, bipolarTypes)).toBeCloseTo(-1);
  });

  it('orthogonal vectors → ~0', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 100, socialAxis: 0 };
    const b: Partial<Record<DimensionKey, number>> = { economicAxis: 0, socialAxis: 100 };
    expect(cosineSimilarity(a, b, bipolarTypes)).toBeCloseTo(0);
  });

  it('returns 0 for no shared keys', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 50 };
    const b: Partial<Record<DimensionKey, number>> = { socialAxis: 50 };
    expect(cosineSimilarity(a, b, bipolarTypes)).toBe(0);
  });
});

describe('euclideanDistance', () => {
  it('identical vectors → 0', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 50 };
    const b: Partial<Record<DimensionKey, number>> = { economicAxis: 50 };
    expect(euclideanDistance(a, b, bipolarTypes)).toBeCloseTo(0);
  });

  it('max-distance bipolar vectors → 1', () => {
    const a: Partial<Record<DimensionKey, number>> = { economicAxis: 100 };
    const b: Partial<Record<DimensionKey, number>> = { economicAxis: -100 };
    // normalized: 1 vs -1, diff²=4, divided by 4*1 keys → sqrt(1)=1
    expect(euclideanDistance(a, b, bipolarTypes)).toBeCloseTo(1, 5);
  });
});

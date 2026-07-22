import { describe, it, expect } from 'vitest';
import { normalizeScore, cosineSimilarity, euclideanDistance } from '../engine/similarity';
import type { DimensionKey, DimensionType } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';

// Derived from the dimension data so it stays in sync as dimensions are added.
const bipolarTypes = Object.fromEntries(
  Object.entries(DIMENSION_MAP).map(([k, v]) => [k, v.type]),
) as Record<DimensionKey, DimensionType>;

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

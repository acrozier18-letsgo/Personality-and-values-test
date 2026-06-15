import type { DimensionKey, DimensionType } from '../data/dimensions';

export function normalizeScore(score: number, type: DimensionType): number {
  if (type === 'bipolar') {
    return score / 100; // -100..100 → -1..1
  } else {
    return score / 50 - 1; // 0..100 → -1..1
  }
}

export function cosineSimilarity(
  a: Partial<Record<DimensionKey, number>>,
  b: Partial<Record<DimensionKey, number>>,
  dimensionTypes: Record<DimensionKey, DimensionType>,
): number {
  const sharedKeys = (Object.keys(a) as DimensionKey[]).filter(k => b[k] !== undefined);
  if (sharedKeys.length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const k of sharedKeys) {
    const na = normalizeScore(a[k]!, dimensionTypes[k]);
    const nb = normalizeScore(b[k]!, dimensionTypes[k]);
    dot += na * nb;
    magA += na * na;
    magB += nb * nb;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function euclideanDistance(
  a: Partial<Record<DimensionKey, number>>,
  b: Partial<Record<DimensionKey, number>>,
  dimensionTypes: Record<DimensionKey, DimensionType>,
): number {
  const sharedKeys = (Object.keys(a) as DimensionKey[]).filter(k => b[k] !== undefined);
  if (sharedKeys.length === 0) return 1;

  let sum = 0;
  for (const k of sharedKeys) {
    const na = normalizeScore(a[k]!, dimensionTypes[k]);
    const nb = normalizeScore(b[k]!, dimensionTypes[k]);
    sum += (na - nb) ** 2;
  }

  // Normalize to 0–1: max possible squared diff per key is 4 (from -1 to +1)
  return Math.sqrt(sum / (4 * sharedKeys.length));
}

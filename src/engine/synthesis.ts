import { ARCHETYPES } from '../data/archetypes';
import { FIGURES } from '../data/figures';
import { CAREER_FAMILIES } from '../data/careers';
import { COUNTRIES } from '../data/countries';
import { DIMENSION_MAP } from '../data/dimensions';
import type { DimensionKey } from '../data/dimensions';
import { cosineSimilarity } from './similarity';
import { identitySentence, introductions, timeRecommendations } from './copy';
import type { DimensionScore, ScoringResult } from './scoring';
import type { Archetype } from '../data/archetypes';
import type { HistoricalFigure } from '../data/figures';
import type { CareerFamily } from '../data/careers';
import type { Country } from '../data/countries';

type Scores = Record<DimensionKey, DimensionScore>;

const DIMENSION_TYPES = Object.fromEntries(
  Object.entries(DIMENSION_MAP).map(([k, v]) => [k, v.type])
) as Record<DimensionKey, 'bipolar' | 'unipolar'>;

function scoreVector(scores: Scores): Partial<Record<DimensionKey, number>> {
  return Object.fromEntries(
    Object.entries(scores)
      .filter(([, v]) => (v as DimensionScore).confidence > 0)
      .map(([k, v]) => [k, (v as DimensionScore).score])
  ) as Partial<Record<DimensionKey, number>>;
}

function affinityPct(sim: number): number {
  return Math.round(((sim + 1) / 2) * 100);
}

export interface FigureMatch {
  figure: HistoricalFigure;
  affinity: number; // 0–100
}

export interface CareerMatch {
  family: CareerFamily;
  fit: number; // 0–100
}

export interface CountryMatch {
  country: Country;
  fit: number; // 0–100
}

export interface Persona {
  archetype: Archetype;
  identitySentence: string;
  figures: FigureMatch[];
  careers: CareerMatch[];
  countries: CountryMatch[];
  introductions: string[];
  timeRecommendations: string[];
  overallCompletion: number;
  isEarlyRead: boolean;
}

export function synthesize(result: ScoringResult): Persona {
  const { scores, overallCompletion } = result;
  const userVector = scoreVector(scores);

  // ── Archetype matching ──────────────────────────────────────────────────
  const archetypeScores = ARCHETYPES.map(a => ({
    archetype: a,
    sim: cosineSimilarity(userVector, a.vector, DIMENSION_TYPES),
  })).sort((a, b) => b.sim - a.sim);
  const bestArchetype = archetypeScores[0].archetype;

  // ── Figure matching ─────────────────────────────────────────────────────
  const figureMatches: FigureMatch[] = FIGURES.map(f => ({
    figure: f,
    affinity: affinityPct(cosineSimilarity(userVector, f.vector, DIMENSION_TYPES)),
  }))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 5);

  // ── Career matching ─────────────────────────────────────────────────────
  const careerMatches: CareerMatch[] = CAREER_FAMILIES.map(c => ({
    family: c,
    fit: affinityPct(cosineSimilarity(userVector, c.vector, DIMENSION_TYPES)),
  }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 3);

  // ── Country matching ────────────────────────────────────────────────────
  const countryMatches: CountryMatch[] = COUNTRIES.map(c => ({
    country: c,
    fit: affinityPct(cosineSimilarity(userVector, c.vector, DIMENSION_TYPES)),
  }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 3);

  return {
    archetype: bestArchetype,
    identitySentence: identitySentence(scores),
    figures: figureMatches,
    careers: careerMatches,
    countries: countryMatches,
    introductions: introductions(scores),
    timeRecommendations: timeRecommendations(scores),
    overallCompletion,
    isEarlyRead: overallCompletion < 0.4,
  };
}

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

export interface TemperamentResult {
  primary: string;
  secondary: string;
  tagline: string;
  blurb: string;
  ratios: { name: string; pct: number }[];
}

export interface HumorStyle {
  key: DimensionKey;
  label: string;
  description: string;
  score: number;
}

export interface FaithResult {
  label: string;
  blurb: string;
  bars: { key: DimensionKey; label: string; score: number }[];
}

export interface Persona {
  archetype: Archetype;
  identitySentence: string;
  figures: FigureMatch[];
  careers: CareerMatch[];
  countries: CountryMatch[];
  introductions: string[];
  timeRecommendations: string[];
  temperament: TemperamentResult;
  humorStyles: HumorStyle[];
  faith: FaithResult;
  overallCompletion: number;
  isEarlyRead: boolean;
}

// ── Four classical temperaments (derived from extraversion + emotional stability) ──
const TEMPERAMENTS: Record<string, { tagline: string; blurb: string }> = {
  Sanguine: {
    tagline: 'Warm, sociable, and optimistic',
    blurb: "You bring energy and warmth wherever you go — outgoing, enthusiastic, and quick to connect. You tend to ride life's ups without dwelling too long on the downs, though the same buoyancy can make it hard to sit still or see quieter tasks through.",
  },
  Choleric: {
    tagline: 'Driven, intense, and decisive',
    blurb: 'You move through the world with force and conviction — ambitious, quick to act, and unafraid of friction. That fire makes you a natural mover of things, though it can flare into impatience when the world runs slower than you do.',
  },
  Melancholic: {
    tagline: 'Deep, sensitive, and reflective',
    blurb: 'You feel things deeply and think before you leap — perceptive, meaning-seeking, with a rich inner life. Your depth is a gift, though you can be hard on yourself and inclined to linger in difficult feelings.',
  },
  Phlegmatic: {
    tagline: 'Calm, steady, and easygoing',
    blurb: 'You are the still point in a turning world — even-tempered, patient, and hard to rattle. People trust your composure, though a reluctance to make waves can leave your own preferences unspoken.',
  },
};

function temperamentOf(scores: Scores): TemperamentResult {
  const ext = scores['extraversion']?.score ?? 50;
  const stable = 100 - (scores['neuroticism']?.score ?? 50);
  const corners: Record<string, [number, number]> = {
    Sanguine: [100, 100], Choleric: [100, 0], Phlegmatic: [0, 100], Melancholic: [0, 0],
  };
  const maxD = Math.hypot(100, 100);
  const ratios = Object.entries(corners)
    .map(([name, [cx, cy]]) => ({ name, pct: Math.round((1 - Math.hypot(ext - cx, stable - cy) / maxD) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  const primary = ratios[0].name;
  return { primary, secondary: ratios[1].name, tagline: TEMPERAMENTS[primary].tagline, blurb: TEMPERAMENTS[primary].blurb, ratios };
}

const HUMOR_KEYS: DimensionKey[] = ['humorSarcastic', 'humorDry', 'humorAbsurdist', 'humorDark', 'humorObservational', 'humorSelfDeprecating', 'humorWholesome', 'humorWordplay'];

function humorStylesOf(scores: Scores): HumorStyle[] {
  return HUMOR_KEYS
    .map(k => ({ key: k, label: DIMENSION_MAP[k].label, description: DIMENSION_MAP[k].description, score: scores[k]?.score ?? 50 }))
    .sort((a, b) => b.score - a.score);
}

function faithOf(scores: Scores): FaithResult {
  const rel = scores['religiosity']?.score ?? 50;
  const spi = scores['spirituality']?.score ?? 50;
  const mys = scores['mysticism']?.score ?? 50;
  let label: string, blurb: string;
  if (rel >= 60) {
    label = 'Devout';
    blurb = 'Religious faith is a real anchor in your life — you draw guidance, belonging, and meaning from its beliefs and practices.';
  } else if (spi >= 60 || mys >= 60) {
    label = 'Spiritual, not religious';
    blurb = 'You sense something sacred or transcendent in life without locating it in an organised religion — open to mystery and to meaning beyond the material.';
  } else if (rel <= 40 && spi <= 40 && mys <= 40) {
    label = 'Secular & grounded';
    blurb = 'You look to reason, evidence, and human experience rather than the sacred — finding meaning in this world rather than beyond it.';
  } else {
    label = 'Quietly open';
    blurb = 'You hold the big questions lightly — neither firmly religious nor strictly secular, and comfortable leaving some mysteries unresolved.';
  }
  return {
    label, blurb,
    bars: [
      { key: 'religiosity', label: DIMENSION_MAP['religiosity'].label, score: rel },
      { key: 'spirituality', label: DIMENSION_MAP['spirituality'].label, score: spi },
      { key: 'mysticism', label: DIMENSION_MAP['mysticism'].label, score: mys },
    ],
  };
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
    temperament: temperamentOf(scores),
    humorStyles: humorStylesOf(scores),
    faith: faithOf(scores),
    overallCompletion,
    isEarlyRead: overallCompletion < 0.4,
  };
}

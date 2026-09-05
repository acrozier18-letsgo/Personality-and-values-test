// The Knowing Map — how well you actually know someone, and how well you know
// how well you know them.
//
// You answer a set of statements AS YOU THINK YOUR PARTNER WOULD, rating how
// sure you are each time. Scoring that against their real answers gives two
// numbers per item — accuracy and confidence — and the interesting result is
// where those two disagree:
//
//   sure + right   → real knowledge
//   sure + wrong   → BLIND SPOT, the whole point of the instrument
//   unsure + right → quiet intuition
//   unsure + wrong → a gap you already knew about
//
// Nobody can self-report their way into the blind-spot quadrant, which is why
// this needs both people's answers to exist.

import type { Answer } from './scoring';
import { ANSWER_LABELS, ANSWER_VALUES, isAnswered } from './scoring';
import { itemAgreement } from './compatibility';
import { ALL_QUESTIONS, ALL_QUESTION_MAP } from '../data/allQuestions';
import type { UnifiedQuestion } from '../data/allQuestions';

/** How sure the predictor was. Four levels, so there is no fence-sitting middle. */
export type Confidence = 1 | 2 | 3 | 4;

export const CONFIDENCE_LEVELS: Confidence[] = [1, 2, 3, 4];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  1: 'Guessing',
  2: 'Leaning',
  3: 'Fairly sure',
  4: 'Certain',
};

/** Mapped onto 0–1 so the two lower levels sit left of centre and the two higher right. */
export const CONFIDENCE_VALUES: Record<Confidence, number> = {
  1: 0.125,
  2: 0.375,
  3: 0.625,
  4: 0.875,
};

export const CONFIDENCE_MIDPOINT = 0.5;

/**
 * How close a guess has to be to count as right. Answers sit on a 5-point
 * scale, so being one step out ("agree" for "strongly agree") is knowing
 * someone, not missing them; two steps out is a different opinion.
 */
export const ACCURACY_THRESHOLD = 0.75;

/** Default number of statements in a round. */
export const DEFAULT_ROUND_SIZE = 20;

/** Below this there isn't enough overlap for a round to say anything. */
export const MIN_ROUND_SIZE = 6;

export interface Prediction {
  answer: Answer;
  confidence: Confidence;
}

export type Quadrant = 'real_knowledge' | 'blind_spot' | 'quiet_intuition' | 'humble_gap';

export interface QuadrantMeta {
  key: Quadrant;
  label: string;
  axis: string;
  blurb: string;
}

export const QUADRANTS: Record<Quadrant, QuadrantMeta> = {
  real_knowledge: {
    key: 'real_knowledge',
    label: 'Real knowledge',
    axis: 'Sure, and right',
    blurb: 'You knew, and you knew that you knew. This is the ground you can build on.',
  },
  blind_spot: {
    key: 'blind_spot',
    label: 'Blind spots',
    axis: 'Sure, and wrong',
    blurb:
      'You were confident and you were wrong — so you have been acting on a picture of them that isn’t accurate. Start the conversation here.',
  },
  quiet_intuition: {
    key: 'quiet_intuition',
    label: 'Quiet intuition',
    axis: 'Unsure, but right',
    blurb: 'You knew more than you gave yourself credit for. Trust the hunch a little more.',
  },
  humble_gap: {
    key: 'humble_gap',
    label: 'Humble gaps',
    axis: 'Unsure, and wrong',
    blurb: 'You didn’t know, and you knew you didn’t. Honest, and the easiest kind to fix — just ask.',
  },
};

export interface ScoredPrediction {
  question: UnifiedQuestion;
  predicted: Answer;
  actual: Answer;
  predictedLabel: string;
  actualLabel: string;
  confidence: Confidence;
  confidenceValue: number;
  /** 0–1, where 1 is an exact match (shared with the compatibility engine). */
  agreement: number;
  /** 0–4 positions apart on the answer scale. */
  stepsOff: number;
  accurate: boolean;
  quadrant: Quadrant;
}

export interface CategoryAccuracy {
  key: string;
  label: string;
  color: string;
  pct: number;
  count: number;
}

export interface KnowingMapResult {
  scored: ScoredPrediction[];
  answered: number;
  total: number;
  /** Mean agreement across scored items, 0–100. */
  accuracyPct: number;
  /** Share of items guessed exactly right, 0–100. */
  exactPct: number;
  /** Mean self-reported confidence, 0–100. */
  confidencePct: number;
  /**
   * confidencePct − accuracyPct. Positive means overconfident: you were surer
   * than you were right.
   */
  calibration: number;
  calibrationLabel: string;
  calibrationBlurb: string;
  quadrants: Record<Quadrant, ScoredPrediction[]>;
  /** Confident misses, worst first — the headline output. */
  blindSpots: ScoredPrediction[];
  byCategory: CategoryAccuracy[];
}

// ── Item selection ───────────────────────────────────────────────────────────

/** Small deterministic string hash, so a given seed always picks the same round. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Choose the statements for a round, spread evenly across the categories the
 * subject actually answered so one pack can't dominate.
 *
 * Statements they had an opinion on come first — "no opinion" is technically
 * predictable but tells you nothing about knowing them — with the rest used
 * only to top up a short round.
 */
export function selectItems(
  subjectAnswers: Record<string, Answer>,
  count: number = DEFAULT_ROUND_SIZE,
  seed: string = 'default',
): UnifiedQuestion[] {
  const h = hashSeed(seed);

  const opinionated: Record<string, UnifiedQuestion[]> = {};
  const neutral: UnifiedQuestion[] = [];

  for (const q of ALL_QUESTIONS) {
    const a = subjectAnswers[q.id];
    if (!isAnswered(a)) continue;
    if (ANSWER_VALUES[a] === 0) {
      neutral.push(q);
      continue;
    }
    (opinionated[q.categoryKey] ??= []).push(q);
  }

  // Round-robin across categories so a 226-item pack can't crowd out the rest.
  const buckets = shuffle(Object.keys(opinionated), h).map((k) => shuffle(opinionated[k], h + k.length));
  const picked: UnifiedQuestion[] = [];
  for (let depth = 0; picked.length < count; depth++) {
    let addedThisPass = false;
    for (const bucket of buckets) {
      if (depth >= bucket.length) continue;
      picked.push(bucket[depth]);
      addedThisPass = true;
      if (picked.length >= count) break;
    }
    if (!addedThisPass) break;
  }

  if (picked.length < count) {
    picked.push(...shuffle(neutral, h).slice(0, count - picked.length));
  }
  return picked;
}

/** How many statements a round with this subject could draw on. */
export function availableItemCount(subjectAnswers: Record<string, Answer>): number {
  return ALL_QUESTIONS.filter((q) => isAnswered(subjectAnswers[q.id])).length;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export function quadrantOf(confidence: Confidence, accurate: boolean): Quadrant {
  const sure = CONFIDENCE_VALUES[confidence] >= CONFIDENCE_MIDPOINT;
  if (sure) return accurate ? 'real_knowledge' : 'blind_spot';
  return accurate ? 'quiet_intuition' : 'humble_gap';
}

function calibrationCopy(gap: number, accuracyPct: number): { label: string; blurb: string } {
  if (gap >= 20) {
    return {
      label: 'Overconfident',
      blurb:
        'You were markedly surer than you were right. The risk isn’t not knowing them — it’s not knowing that you don’t.',
    };
  }
  if (gap >= 8) {
    return {
      label: 'Slightly overconfident',
      blurb: 'You ran a little ahead of your evidence, but not dangerously so.',
    };
  }
  if (gap <= -20) {
    return {
      label: 'You know them better than you think',
      blurb:
        'You were right far more often than you felt sure. Your read on them is good — you’re just not trusting it.',
    };
  }
  if (gap <= -8) {
    return {
      label: 'Slightly underconfident',
      blurb: 'You hedged on answers you actually had right. Trust the hunch a bit more.',
    };
  }
  return {
    label: 'Well calibrated',
    blurb:
      accuracyPct >= 70
        ? 'You know them well, and you know exactly where the edges of that knowledge are. That is rarer than being right.'
        : 'You know where your knowledge runs out, which is the more useful half of knowing someone.',
  };
}

/**
 * Score a round. Items the predictor skipped, or that the subject turns out not
 * to have answered, are left out rather than counted as misses.
 */
export function scoreKnowingMap(
  itemIds: string[],
  predictions: Record<string, Prediction>,
  subjectAnswers: Record<string, Answer>,
): KnowingMapResult {
  const scored: ScoredPrediction[] = [];

  for (const id of itemIds) {
    const question = ALL_QUESTION_MAP[id];
    const prediction = predictions[id];
    const actual = subjectAnswers[id];
    if (!question || !prediction || !isAnswered(prediction.answer) || !isAnswered(actual)) continue;

    const agreement = itemAgreement(prediction.answer, actual);
    const accurate = agreement >= ACCURACY_THRESHOLD;
    scored.push({
      question,
      predicted: prediction.answer,
      actual,
      predictedLabel: ANSWER_LABELS[prediction.answer],
      actualLabel: ANSWER_LABELS[actual],
      confidence: prediction.confidence,
      confidenceValue: CONFIDENCE_VALUES[prediction.confidence],
      agreement,
      stepsOff: Math.round((1 - agreement) * 4),
      accurate,
      quadrant: quadrantOf(prediction.confidence, accurate),
    });
  }

  const quadrants: Record<Quadrant, ScoredPrediction[]> = {
    real_knowledge: [],
    blind_spot: [],
    quiet_intuition: [],
    humble_gap: [],
  };
  for (const s of scored) quadrants[s.quadrant].push(s);

  const n = scored.length;
  const accuracyPct = n ? Math.round((scored.reduce((t, s) => t + s.agreement, 0) / n) * 100) : 0;
  const exactPct = n ? Math.round((scored.filter((s) => s.agreement === 1).length / n) * 100) : 0;
  const confidencePct = n
    ? Math.round((scored.reduce((t, s) => t + s.confidenceValue, 0) / n) * 100)
    : 0;
  const calibration = confidencePct - accuracyPct;
  const { label, blurb } = calibrationCopy(calibration, accuracyPct);

  const byCat: Record<string, { sum: number; n: number; q: UnifiedQuestion }> = {};
  for (const s of scored) {
    const b = (byCat[s.question.categoryKey] ??= { sum: 0, n: 0, q: s.question });
    b.sum += s.agreement;
    b.n += 1;
  }

  return {
    scored,
    answered: n,
    total: itemIds.length,
    accuracyPct,
    exactPct,
    confidencePct,
    calibration,
    calibrationLabel: label,
    calibrationBlurb: blurb,
    quadrants,
    blindSpots: [...quadrants.blind_spot].sort(
      (a, b) =>
        a.agreement - b.agreement ||
        b.confidenceValue - a.confidenceValue ||
        a.question.id.localeCompare(b.question.id),
    ),
    byCategory: Object.entries(byCat)
      .map(([key, b]) => ({
        key,
        label: b.q.categoryLabel,
        color: b.q.categoryColor,
        pct: Math.round((b.sum / b.n) * 100),
        count: b.n,
      }))
      .sort((a, b) => b.pct - a.pct || a.label.localeCompare(b.label)),
  };
}

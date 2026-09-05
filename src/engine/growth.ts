// Longitudinal growth — how one person's portrait has moved across snapshots
// taken at different times.
//
// Every snapshot is re-scored with the same engine, so the comparison is always
// apples-to-apples. The real hazard is not the maths but the sampling: a thin
// snapshot (few questions answered) put next to a thick one will show "movement"
// that is really just a different subset of questions. Two gates guard that:
//
//   MIN_TREND_CONFIDENCE — a dimension is only comparable when it was
//     meaningfully answered in BOTH endpoints.
//   MEANINGFUL_DELTA — below this, a difference is noise, not growth.
//
// Anything that fails a gate is still shown, but labelled as not comparable
// rather than quietly folded into the headline numbers.

import type { Answer, DimensionScore } from './scoring';
import { ANSWER_VALUES, ANSWER_LABELS, countAnswered, isAnswered, scoreAnswers } from './scoring';
import { QUESTIONS } from '../data/questions';
import { ALL_QUESTIONS } from '../data/allQuestions';
import { DIMENSIONS, DIMENSION_MAP } from '../data/dimensions';
import type { DimensionGroup, DimensionKey, DimensionType } from '../data/dimensions';
import { euclideanDistance } from './similarity';

/**
 * Share of a dimension's questions that must be answered in BOTH endpoints
 * before a change between them is treated as real. Below this the dimension is
 * marked `comparable: false` and kept out of every headline figure.
 */
export const MIN_TREND_CONFIDENCE = 0.5;

/**
 * Score points a dimension must move before it counts as movement. Scores are
 * 0–100 (unipolar) or −100..+100 (bipolar); re-answering the same questionnaire
 * in the same mood routinely jitters a few points either way.
 */
export const MEANINGFUL_DELTA = 8;

export type SnapshotSource = 'current' | 'saved' | 'imported';

/** One point in time: an answer set plus when it was taken. */
export interface Snapshot {
  id: string;
  label: string;
  /** When the answers were given (not when the file was uploaded). */
  takenAt: number;
  source: SnapshotSource;
  answers: Record<string, Answer>;
}

export interface ScoredSnapshot extends Snapshot {
  answeredCount: number;
  scores: Record<DimensionKey, DimensionScore>;
}

export interface TrendPoint {
  at: number;
  score: number;
  confidence: number;
}

export type TrendDirection = 'up' | 'down' | 'steady';

export interface DimensionTrend {
  key: DimensionKey;
  label: string;
  description: string;
  group: DimensionGroup;
  type: DimensionType;
  /** Every snapshot's reading for this dimension, oldest first. */
  points: TrendPoint[];
  from: number;
  to: number;
  delta: number;
  direction: TrendDirection;
  /** False when either endpoint is too thinly answered to trust. */
  comparable: boolean;
  /** Range across the comparable points — reveals a there-and-back arc. */
  min: number;
  max: number;
}

export interface StatementChange {
  id: string;
  text: string;
  categoryLabel: string;
  from: Answer;
  to: Answer;
  fromLabel: string;
  toLabel: string;
  /** 0–1: how far the answer travelled on the 5-point scale. */
  distance: number;
  direction: 'toward_agree' | 'toward_disagree';
}

export interface GrowthResult {
  /** Every snapshot in the timeline, oldest first. */
  snapshots: ScoredSnapshot[];
  from: ScoredSnapshot;
  to: ScoredSnapshot;
  spanDays: number;
  /** All dimensions, comparable ones first, then by absolute movement. */
  trends: DimensionTrend[];
  /** Comparable dimensions that moved meaningfully, biggest first. */
  movements: DimensionTrend[];
  /** Comparable dimensions that barely budged — the person's fixed points. */
  anchors: DimensionTrend[];
  /** 0–100: how much of the portrait held steady between the endpoints. */
  continuity: number;
  /** Specific statements answered differently, furthest travelled first. */
  changedStatements: StatementChange[];
  comparableCount: number;
}

const DIMENSION_TYPES = Object.fromEntries(
  DIMENSIONS.map((d) => [d.key, d.type]),
) as Record<DimensionKey, DimensionType>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Re-score a snapshot's answers with the standard engine. */
export function scoreSnapshot(snapshot: Snapshot): ScoredSnapshot {
  const { scores } = scoreAnswers(snapshot.answers, QUESTIONS);
  return {
    ...snapshot,
    answeredCount: countAnswered(snapshot.answers),
    scores,
  };
}

/** Oldest first; ties broken by label so the order is stable across renders. */
export function sortSnapshots(snapshots: Snapshot[]): Snapshot[] {
  return [...snapshots].sort(
    (a, b) => a.takenAt - b.takenAt || a.label.localeCompare(b.label),
  );
}

function directionOf(delta: number): TrendDirection {
  if (delta >= MEANINGFUL_DELTA) return 'up';
  if (delta <= -MEANINGFUL_DELTA) return 'down';
  return 'steady';
}

/** Which statements the person answered differently between two snapshots. */
export function statementChanges(
  from: Record<string, Answer>,
  to: Record<string, Answer>,
): StatementChange[] {
  const out: StatementChange[] = [];
  for (const q of ALL_QUESTIONS) {
    const a = from[q.id];
    const b = to[q.id];
    if (!isAnswered(a) || !isAnswered(b)) continue;
    const shift = ANSWER_VALUES[b] - ANSWER_VALUES[a];
    if (shift === 0) continue;
    out.push({
      id: q.id,
      text: q.text,
      categoryLabel: q.categoryLabel,
      from: a,
      to: b,
      fromLabel: ANSWER_LABELS[a],
      toLabel: ANSWER_LABELS[b],
      distance: Math.abs(shift) / 4,
      direction: shift > 0 ? 'toward_agree' : 'toward_disagree',
    });
  }
  return out.sort((x, y) => y.distance - x.distance || x.id.localeCompare(y.id));
}

/**
 * Build the growth picture across a set of snapshots. `fromId`/`toId` pick the
 * two endpoints to compare; they default to the oldest and newest.
 *
 * Returns null when there aren't two distinct snapshots to compare.
 */
export function computeGrowth(
  snapshots: Snapshot[],
  fromId?: string,
  toId?: string,
): GrowthResult | null {
  const ordered = sortSnapshots(snapshots).map(scoreSnapshot);
  if (ordered.length < 2) return null;

  const from = ordered.find((s) => s.id === fromId) ?? ordered[0];
  const to = ordered.find((s) => s.id === toId) ?? ordered[ordered.length - 1];
  if (from.id === to.id) return null;

  const trends: DimensionTrend[] = DIMENSIONS.map((dim) => {
    const points: TrendPoint[] = ordered.map((s) => ({
      at: s.takenAt,
      score: s.scores[dim.key]?.score ?? 0,
      confidence: s.scores[dim.key]?.confidence ?? 0,
    }));

    const a = from.scores[dim.key];
    const b = to.scores[dim.key];
    const comparable =
      (a?.confidence ?? 0) >= MIN_TREND_CONFIDENCE &&
      (b?.confidence ?? 0) >= MIN_TREND_CONFIDENCE;

    const fromScore = a?.score ?? 0;
    const toScore = b?.score ?? 0;
    const delta = toScore - fromScore;

    // Range is only meaningful over points we'd actually trust.
    const trusted = points.filter((p) => p.confidence >= MIN_TREND_CONFIDENCE);
    const pool = trusted.length ? trusted : points;

    return {
      key: dim.key,
      label: dim.label,
      description: dim.description,
      group: dim.group,
      type: dim.type,
      points,
      from: fromScore,
      to: toScore,
      delta,
      direction: comparable ? directionOf(delta) : 'steady',
      comparable,
      min: Math.min(...pool.map((p) => p.score)),
      max: Math.max(...pool.map((p) => p.score)),
    };
  });

  const comparable = trends.filter((t) => t.comparable);

  // Continuity reuses the same normalised distance the compatibility engine
  // uses between two people — here between one person and their past self.
  const fromMap: Partial<Record<DimensionKey, number>> = {};
  const toMap: Partial<Record<DimensionKey, number>> = {};
  for (const t of comparable) {
    fromMap[t.key] = t.from;
    toMap[t.key] = t.to;
  }
  const continuity = comparable.length
    ? Math.round((1 - euclideanDistance(fromMap, toMap, DIMENSION_TYPES)) * 100)
    : 0;

  const byMovement = (x: DimensionTrend, y: DimensionTrend) =>
    Math.abs(y.delta) - Math.abs(x.delta) || x.label.localeCompare(y.label);

  return {
    snapshots: ordered,
    from,
    to,
    spanDays: Math.max(0, Math.round((to.takenAt - from.takenAt) / DAY_MS)),
    trends: [...trends].sort(
      (x, y) => Number(y.comparable) - Number(x.comparable) || byMovement(x, y),
    ),
    movements: comparable
      .filter((t) => Math.abs(t.delta) >= MEANINGFUL_DELTA)
      .sort(byMovement),
    anchors: comparable
      .filter((t) => Math.abs(t.delta) < MEANINGFUL_DELTA)
      .sort((x, y) => Math.abs(x.delta) - Math.abs(y.delta) || x.label.localeCompare(y.label)),
    continuity,
    changedStatements: statementChanges(from.answers, to.answers),
    comparableCount: comparable.length,
  };
}

/** Which way a trend reads in plain words, respecting bipolar pole names. */
export function movementPhrase(trend: DimensionTrend): string {
  const dim = DIMENSION_MAP[trend.key];
  if (dim.type === 'bipolar') {
    const pole = trend.delta > 0 ? dim.positiveLabel : dim.negativeLabel;
    return `moved toward ${pole}`;
  }
  return trend.delta > 0 ? 'rose' : 'fell';
}

function humanSpan(days: number): string {
  if (days <= 0) return 'the same day';
  if (days === 1) return 'a day';
  if (days < 45) return `${days} days`;
  const months = Math.round(days / 30.4);
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const years = (days / 365.25).toFixed(1).replace(/\.0$/, '');
  return `${years} years`;
}

/**
 * A deterministic written arc — the fallback when no AI key is available, and
 * the framing the AI reading builds on. Reads the pattern, never diagnoses.
 */
export function describeArc(growth: GrowthResult): string[] {
  const lines: string[] = [];
  const span = humanSpan(growth.spanDays);

  if (growth.comparableCount === 0) {
    return [
      `These two snapshots don't overlap enough to compare — they cover different sets of questions. Answer more of the same areas in both and the arc will appear.`,
    ];
  }

  const { continuity, movements, anchors } = growth;
  const settled =
    continuity >= 90
      ? 'Over that stretch you have been remarkably consistent'
      : continuity >= 75
        ? 'Over that stretch the core of you held, with real movement at the edges'
        : continuity >= 55
          ? 'Over that stretch a fair amount shifted'
          : 'Over that stretch a great deal shifted';
  lines.push(
    `Across ${span}, ${continuity}% of your portrait stayed put. ${settled} — ${movements.length} of ${growth.comparableCount} measured traits moved meaningfully.`,
  );

  if (movements.length) {
    const top = movements.slice(0, 3);
    lines.push(
      'The biggest movement: ' +
        top
          .map((t) => `${t.label} ${movementPhrase(t)} (${t.from} → ${t.to})`)
          .join('; ') +
        '.',
    );
  } else {
    lines.push(
      'Nothing moved past the noise floor. Either little changed, or not enough time has passed for it to show.',
    );
  }

  // A there-and-back arc is more interesting than a straight line, so call it out.
  if (growth.snapshots.length >= 3) {
    const roundTrip = movements.find(
      (t) => t.max - t.min >= Math.abs(t.delta) + MEANINGFUL_DELTA,
    );
    if (roundTrip) {
      lines.push(
        `${roundTrip.label} didn't move in a straight line — it ranged from ${roundTrip.min} to ${roundTrip.max} before settling at ${roundTrip.to}. Journeys out and back are easy to miss when you only look at the endpoints.`,
      );
    }
  }

  if (anchors.length) {
    lines.push(
      'Your fixed points — steady the whole way through: ' +
        anchors.slice(0, 4).map((t) => t.label).join(', ') +
        '.',
    );
  }

  const changed = growth.changedStatements.length;
  if (changed) {
    lines.push(
      `You answered ${changed} individual statement${changed === 1 ? '' : 's'} differently the second time around.`,
    );
  }

  return lines;
}

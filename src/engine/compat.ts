// Compatibility & friction engine.
//
// Deliberately produces NO single compatibility percentage. A couple is not one
// number, and a low one lands badly on real people. Instead this reports, domain
// by domain, how closely two people align — and then names the specific
// statements they answered furthest apart on, because those are the actual
// conversations worth having.
//
// Two kinds of domain:
//   • trait domains  (temperament, values, worldview, humour, faith) compare the
//     scored dimension vectors, which is what the core assessment is designed for.
//   • item domains   (conflict, money, parenting, …) compare answers statement by
//     statement, weighted by how much a gap on that statement actually matters.
//
// Both kinds surface item-level divergences, so every bar can be opened up into
// "here is precisely where you two differ".

import type { Answer } from './scoring';
import { ANSWER_VALUES, isAnswered, scoreAnswers } from './scoring';
import { euclideanDistance } from './similarity';
import { QUESTIONS } from '../data/questions';
import { OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import type { OptionalCategoryKey } from '../data/optionalQuestions';
import { RELATIONSHIP_QUESTIONS } from '../data/relationshipQuestions';
import type { RelationshipCategoryKey, RelationshipFacet } from '../data/relationshipQuestions';
import { DIMENSION_MAP, DIMENSIONS } from '../data/dimensions';
import type { DimensionGroup, DimensionKey } from '../data/dimensions';

const DIMENSION_TYPES = Object.fromEntries(
  Object.entries(DIMENSION_MAP).map(([k, v]) => [k, v.type]),
) as Record<DimensionKey, 'bipolar' | 'unipolar'>;

export type CompatDomainKey =
  | 'temperament' | 'values' | 'worldview' | 'humour' | 'faith'
  | 'conflict' | 'communication' | 'stress' | 'money'
  | 'parenting' | 'family' | 'partnership' | 'intimacy' | 'lifestyle';

/** Which half of the page a domain belongs under. */
export type CompatSection = 'self' | 'together';

export type CompatBand = 'aligned' | 'workable' | 'friction' | 'unknown';

/** A statement the two answered differently, with both answers. */
export interface Divergence {
  id: string;
  text: string;
  domain: CompatDomainKey;
  /** Topic tag where we have one (relationship packs only). */
  facet?: RelationshipFacet;
  you: Answer;
  them: Answer;
  /** 1–4 points apart on the 5-point scale. */
  gap: number;
  /** How much a gap here tends to matter: 1 harmless … 3 genuine fault line. */
  weight: number;
  /** gap × weight — what the list is ranked by. */
  severity: number;
}

/** A statement they both feel the same way about, and not mildly. */
export interface Agreement {
  id: string;
  text: string;
  domain: CompatDomainKey;
  answer: Answer;
  /** Both answers point the same way; strength is the weaker of the two. */
  strength: number;
}

export interface CompatDomain {
  key: CompatDomainKey;
  label: string;
  blurb: string;
  section: CompatSection;
  color: string;
  /** 0–100. Null when neither person answered enough to say anything. */
  alignment: number | null;
  band: CompatBand;
  /** Statements (or dimensions) both people covered. */
  shared: number;
  divergences: Divergence[];
  agreements: Agreement[];
}

export interface CompatResult {
  domains: CompatDomain[];
  /** Every divergence across every domain, worst first. */
  frictions: Divergence[];
  /** Every strong shared conviction, strongest first. */
  commonGround: Agreement[];
  /** Domains that came out best and worst, for the summary line. */
  strongest: CompatDomain[];
  weakest: CompatDomain[];
  /** How much of the picture we actually have: shared answers across everything. */
  sharedAnswers: number;
  /** True when there is too little overlap to say much of anything. */
  thin: boolean;
}

interface DomainSpec {
  key: CompatDomainKey;
  label: string;
  blurb: string;
  section: CompatSection;
  color: string;
  /** Dimension groups whose vectors drive the alignment score. */
  groups?: DimensionGroup[];
  /** Relationship packs whose items drive it. */
  packs?: RelationshipCategoryKey[];
  /** Optional packs whose items drive it. */
  optional?: OptionalCategoryKey[];
}

const DOMAIN_SPECS: DomainSpec[] = [
  // ── Who you each are ──
  { key: 'temperament',   label: 'Temperament',            section: 'self', color: '#7c5cff', groups: ['A'], blurb: 'Energy, steadiness, openness — the raw material each of you brings.' },
  { key: 'values',        label: 'Values & Morals',        section: 'self', color: '#3b82f6', groups: ['B', 'C'], blurb: 'What you each prize, and what you each treat as right and wrong.' },
  { key: 'worldview',     label: 'Worldview',              section: 'self', color: '#f97316', groups: ['D', 'E', 'F'], blurb: 'Politics, philosophy, and how you each read reality.' },
  { key: 'humour',        label: 'Sense of Humour',        section: 'self', color: '#db2777', groups: ['G'], blurb: 'Whether you laugh at the same things — quietly one of the load-bearing ones.' },
  { key: 'faith',         label: 'Faith & Meaning',        section: 'self', color: '#a855f7', groups: ['H'], blurb: 'Religion, spirituality, and where you each find significance.' },
  // ── How you operate together ──
  { key: 'conflict',      label: 'Conflict & Repair',      section: 'together', color: '#dc2626', packs: ['conflict'], blurb: 'How you each fight, cool off, apologise and come back.' },
  { key: 'communication', label: 'Communication',          section: 'together', color: '#2563eb', packs: ['requests'], blurb: 'How you each ask, listen, and take feedback.' },
  { key: 'stress',        label: 'Stress & Bad News',      section: 'together', color: '#7c3aed', packs: ['stress'], blurb: 'What each of you needs when things go wrong.' },
  { key: 'money',         label: 'Money & Household',      section: 'together', color: '#059669', packs: ['moneyhome'], blurb: 'Spending, saving, chores, and who carries the invisible load.' },
  { key: 'parenting',     label: 'Parenting',              section: 'together', color: '#ea580c', packs: ['coparent'], optional: ['parenting'], blurb: 'Both the philosophy and the day-to-day of raising children together.' },
  { key: 'family',        label: 'Family & In-Laws',       section: 'together', color: '#c026d3', packs: ['kin'], blurb: 'Boundaries, holidays, and what you each inherited from home.' },
  { key: 'partnership',   label: 'Partnership Expectations', section: 'together', color: '#e11d48', optional: ['partner'], blurb: 'What you each want a long partnership to look like.' },
  { key: 'intimacy',      label: 'Intimacy & Affection',   section: 'together', color: '#be123c', optional: ['intimacy'], blurb: 'Closeness, desire, and how you each want to be wanted.' },
  { key: 'lifestyle',     label: 'Lifestyle & Interests',  section: 'together', color: '#16a34a', optional: ['hobbies', 'interests', 'travel', 'education'], blurb: 'How you each like to spend time, learn, and see the world.' },
];

/** Every question we can compare, with the metadata the engine needs. */
interface ComparableItem {
  id: string;
  text: string;
  domain: CompatDomainKey;
  weight: number;
  facet?: RelationshipFacet;
}

const ITEMS_BY_DOMAIN: Record<CompatDomainKey, ComparableItem[]> = (() => {
  const out = Object.fromEntries(
    DOMAIN_SPECS.map(s => [s.key, [] as ComparableItem[]]),
  ) as Record<CompatDomainKey, ComparableItem[]>;

  for (const spec of DOMAIN_SPECS) {
    // Core questions belong to the trait domains via their dimension group.
    for (const g of spec.groups ?? []) {
      for (const q of QUESTIONS) {
        if (q.group === g) out[spec.key].push({ id: q.id, text: q.text, domain: spec.key, weight: 2 });
      }
    }
    for (const pack of spec.packs ?? []) {
      for (const q of RELATIONSHIP_QUESTIONS) {
        if (q.category === pack) {
          out[spec.key].push({ id: q.id, text: q.text, domain: spec.key, weight: q.gapWeight, facet: q.facet });
        }
      }
    }
    for (const pack of spec.optional ?? []) {
      for (const q of OPTIONAL_QUESTIONS) {
        if (q.category === pack) out[spec.key].push({ id: q.id, text: q.text, domain: spec.key, weight: 2 });
      }
    }
  }
  return out;
})();

const MAX_GAP = 4; // strongly_disagree (−2) to strongly_agree (+2)

function band(alignment: number | null, shared: number): CompatBand {
  if (alignment === null || shared < 4) return 'unknown';
  if (alignment >= 78) return 'aligned';
  if (alignment >= 62) return 'workable';
  return 'friction';
}

type Scores = ReturnType<typeof scoreAnswers>['scores'];

/** Alignment of two dimension vectors over the given groups, as 0–100. */
function traitAlignment(
  scoresA: Scores,
  scoresB: Scores,
  groups: DimensionGroup[],
): { alignment: number | null; shared: number } {
  const keys = DIMENSIONS.filter(d => groups.includes(d.group)).map(d => d.key);

  const vecA: Partial<Record<DimensionKey, number>> = {};
  const vecB: Partial<Record<DimensionKey, number>> = {};
  let shared = 0;
  for (const k of keys) {
    // Only compare dimensions BOTH people actually answered toward.
    if ((scoresA[k]?.confidence ?? 0) > 0 && (scoresB[k]?.confidence ?? 0) > 0) {
      vecA[k] = scoresA[k].score;
      vecB[k] = scoresB[k].score;
      shared++;
    }
  }
  if (shared === 0) return { alignment: null, shared: 0 };

  // euclideanDistance returns 0 (identical) … 1 (maximally opposed).
  const dist = euclideanDistance(vecA, vecB, DIMENSION_TYPES);
  return { alignment: Math.round((1 - dist) * 100), shared };
}

/** Alignment from statement-by-statement gaps, weighted by how much each matters. */
function itemAlignment(
  a: Record<string, Answer>,
  b: Record<string, Answer>,
  items: ComparableItem[],
): { alignment: number | null; shared: number } {
  let weightedGap = 0;
  let weightTotal = 0;
  let shared = 0;
  for (const item of items) {
    const av = a[item.id];
    const bv = b[item.id];
    if (!isAnswered(av) || !isAnswered(bv)) continue;
    weightedGap += Math.abs(ANSWER_VALUES[av] - ANSWER_VALUES[bv]) * item.weight;
    weightTotal += MAX_GAP * item.weight;
    shared++;
  }
  if (shared === 0) return { alignment: null, shared: 0 };
  return { alignment: Math.round(100 - (weightedGap / weightTotal) * 100), shared };
}

function divergencesFor(
  a: Record<string, Answer>,
  b: Record<string, Answer>,
  items: ComparableItem[],
): Divergence[] {
  const out: Divergence[] = [];
  for (const item of items) {
    const av = a[item.id];
    const bv = b[item.id];
    if (!isAnswered(av) || !isAnswered(bv)) continue;
    const gap = Math.abs(ANSWER_VALUES[av] - ANSWER_VALUES[bv]);
    if (gap < 2) continue; // one step apart is noise, not a difference
    out.push({
      id: item.id,
      text: item.text,
      domain: item.domain,
      facet: item.facet,
      you: av,
      them: bv,
      gap,
      weight: item.weight,
      severity: gap * item.weight,
    });
  }
  return out.sort((x, y) => y.severity - x.severity || y.gap - x.gap);
}

function agreementsFor(
  a: Record<string, Answer>,
  b: Record<string, Answer>,
  items: ComparableItem[],
): Agreement[] {
  const out: Agreement[] = [];
  for (const item of items) {
    const av = a[item.id];
    const bv = b[item.id];
    if (!isAnswered(av) || !isAnswered(bv)) continue;
    const na = ANSWER_VALUES[av];
    const nb = ANSWER_VALUES[bv];
    // Same direction, and neither of them merely lukewarm.
    if (na === 0 || nb === 0 || Math.sign(na) !== Math.sign(nb)) continue;
    const strength = Math.min(Math.abs(na), Math.abs(nb));
    if (strength < 2) continue; // both must feel it strongly
    out.push({ id: item.id, text: item.text, domain: item.domain, answer: av, strength });
  }
  return out.sort((x, y) => y.strength - x.strength);
}

/**
 * Compare two answer sets. `you` is whoever is looking at the page; `them` is
 * the partner whose profile was shared. The result is symmetric except that
 * `Divergence.you` / `.them` are labelled from the viewer's side.
 */
export function compareProfiles(
  you: Record<string, Answer>,
  them: Record<string, Answer>,
): CompatResult {
  // Score both sides once; the five trait domains all read from these.
  const scoresYou = scoreAnswers(you, QUESTIONS).scores;
  const scoresThem = scoreAnswers(them, QUESTIONS).scores;

  const domains: CompatDomain[] = DOMAIN_SPECS.map(spec => {
    const items = ITEMS_BY_DOMAIN[spec.key];
    // Trait domains score from the dimension vectors; item domains from the gaps.
    const { alignment, shared } = spec.groups?.length
      ? traitAlignment(scoresYou, scoresThem, spec.groups)
      : itemAlignment(you, them, items);

    return {
      key: spec.key,
      label: spec.label,
      blurb: spec.blurb,
      section: spec.section,
      color: spec.color,
      alignment,
      band: band(alignment, spec.groups?.length ? shared * 3 : shared),
      shared,
      divergences: divergencesFor(you, them, items).slice(0, 12),
      agreements: agreementsFor(you, them, items).slice(0, 8),
    };
  });

  const allItems = DOMAIN_SPECS.flatMap(s => ITEMS_BY_DOMAIN[s.key]);
  const sharedAnswers = allItems.filter(
    i => isAnswered(you[i.id]) && isAnswered(them[i.id]),
  ).length;

  const rated = domains.filter(d => d.alignment !== null && d.band !== 'unknown');
  const byAlignment = [...rated].sort((a, b) => (b.alignment ?? 0) - (a.alignment ?? 0));

  return {
    domains,
    frictions: domains
      .flatMap(d => d.divergences)
      .sort((a, b) => b.severity - a.severity || b.gap - a.gap),
    commonGround: domains
      .flatMap(d => d.agreements)
      .sort((a, b) => b.strength - a.strength),
    strongest: byAlignment.slice(0, 3),
    weakest: byAlignment.slice(-3).reverse(),
    sharedAnswers,
    thin: sharedAnswers < 40,
  };
}

export const BAND_LABELS: Record<CompatBand, string> = {
  aligned: 'Closely aligned',
  workable: 'Workable difference',
  friction: 'Live friction',
  unknown: 'Not enough answers',
};

export const BAND_COLORS: Record<CompatBand, string> = {
  aligned: '#2f7d54',
  workable: '#b68235',
  friction: '#b23b3b',
  unknown: '#b0a894',
};

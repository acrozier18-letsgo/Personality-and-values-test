export type DimensionKey =
  // Group A – Big Five
  | 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'
  // Group B – Schwartz values
  | 'selfDirection' | 'stimulation' | 'hedonism' | 'achievement' | 'power'
  | 'security' | 'conformity' | 'tradition' | 'benevolence' | 'universalism'
  // Group C – Moral foundations
  | 'care' | 'fairness' | 'loyalty' | 'authority' | 'sanctity' | 'liberty'
  // Group D – Political
  | 'economicAxis' | 'socialAxis'
  // Group E – Philosophy
  | 'epistemology' | 'metaphysics' | 'freeWill' | 'ethicsFramework'
  | 'moralRealism' | 'humanNature' | 'timeOrientation'
  // Group F – Ontological
  | 'realismConstructivism' | 'orderChaos' | 'individualCollective' | 'reductionHolism';

export type DimensionGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type DimensionType = 'bipolar' | 'unipolar';

export interface Dimension {
  key: DimensionKey;
  group: DimensionGroup;
  label: string;
  type: DimensionType;
  description: string;
  negativeLabel?: string;
  positiveLabel?: string;
}

export const DIMENSIONS: Dimension[] = [
  // ── Group A: Big Five ──────────────────────────────────────────────────────
  { key: 'openness',          group: 'A', type: 'unipolar', label: 'Openness',          description: 'Curiosity, imagination, and appetite for new experiences and ideas.' },
  { key: 'conscientiousness', group: 'A', type: 'unipolar', label: 'Conscientiousness', description: 'Organisation, dependability, and self-discipline.' },
  { key: 'extraversion',      group: 'A', type: 'unipolar', label: 'Extraversion',      description: 'Sociability, assertiveness, and positive emotional energy.' },
  { key: 'agreeableness',     group: 'A', type: 'unipolar', label: 'Agreeableness',     description: 'Cooperation, trust, and concern for others\' wellbeing.' },
  { key: 'neuroticism',       group: 'A', type: 'unipolar', label: 'Neuroticism',       description: 'Tendency to experience anxiety, moodiness, and emotional instability.' },

  // ── Group B: Schwartz Values ───────────────────────────────────────────────
  { key: 'selfDirection', group: 'B', type: 'unipolar', label: 'Self-Direction', description: 'Valuing independent thought, creativity, and freedom to choose your own path.' },
  { key: 'stimulation',   group: 'B', type: 'unipolar', label: 'Stimulation',   description: 'Seeking excitement, novelty, and challenge in life.' },
  { key: 'hedonism',      group: 'B', type: 'unipolar', label: 'Hedonism',      description: 'Placing importance on pleasure, sensory enjoyment, and having fun.' },
  { key: 'achievement',   group: 'B', type: 'unipolar', label: 'Achievement',   description: 'Pursuing personal success and demonstrating competence.' },
  { key: 'power',         group: 'B', type: 'unipolar', label: 'Power',         description: 'Valuing social status, prestige, and control over people or resources.' },
  { key: 'security',      group: 'B', type: 'unipolar', label: 'Security',      description: 'Prioritising safety, harmony, and stability in society and relationships.' },
  { key: 'conformity',    group: 'B', type: 'unipolar', label: 'Conformity',    description: 'Restraining impulses and following social norms and expectations.' },
  { key: 'tradition',     group: 'B', type: 'unipolar', label: 'Tradition',     description: 'Respecting and maintaining cultural and religious customs.' },
  { key: 'benevolence',   group: 'B', type: 'unipolar', label: 'Benevolence',   description: 'Caring for the welfare of close others and wanting to be helpful.' },
  { key: 'universalism',  group: 'B', type: 'unipolar', label: 'Universalism',  description: 'Caring for all people and nature; valuing tolerance and social justice.' },

  // ── Group C: Moral Foundations ────────────────────────────────────────────
  { key: 'care',      group: 'C', type: 'unipolar', label: 'Care',      description: 'Sensitivity to suffering; valuing compassion and protecting the vulnerable.' },
  { key: 'fairness',  group: 'C', type: 'unipolar', label: 'Fairness',  description: 'Concern for justice, reciprocity, and equal treatment.' },
  { key: 'loyalty',   group: 'C', type: 'unipolar', label: 'Loyalty',   description: 'Commitment to one\'s group and valuing solidarity and self-sacrifice.' },
  { key: 'authority', group: 'C', type: 'unipolar', label: 'Authority', description: 'Respecting leadership, hierarchy, and legitimate social roles.' },
  { key: 'sanctity',  group: 'C', type: 'unipolar', label: 'Sanctity',  description: 'Valuing purity and feeling that some things are sacred or degrading.' },
  { key: 'liberty',   group: 'C', type: 'unipolar', label: 'Liberty',   description: 'Resistance to domination and concern for freedom from coercion.' },

  // ── Group D: Political ────────────────────────────────────────────────────
  {
    key: 'economicAxis', group: 'D', type: 'bipolar', label: 'Economic Axis',
    negativeLabel: 'Egalitarian / Left', positiveLabel: 'Market / Right',
    description: 'Attitudes toward economic equality, redistribution, and the role of markets vs. the state.',
  },
  {
    key: 'socialAxis', group: 'D', type: 'bipolar', label: 'Social Axis',
    negativeLabel: 'Libertarian', positiveLabel: 'Authoritarian',
    description: 'Attitudes toward personal freedom vs. social order, authority, and collective discipline.',
  },

  // ── Group E: Philosophical Stances ────────────────────────────────────────
  {
    key: 'epistemology', group: 'E', type: 'bipolar', label: 'Epistemology',
    negativeLabel: 'Empiricism', positiveLabel: 'Rationalism',
    description: 'Whether you trust sensory experience (empiricism) or reason and innate ideas (rationalism) as the primary source of knowledge.',
  },
  {
    key: 'metaphysics', group: 'E', type: 'bipolar', label: 'Metaphysics',
    negativeLabel: 'Materialism', positiveLabel: 'Idealism',
    description: 'Whether reality is fundamentally physical/material (materialism) or mental/experiential (idealism).',
  },
  {
    key: 'freeWill', group: 'E', type: 'bipolar', label: 'Free Will',
    negativeLabel: 'Determinism', positiveLabel: 'Libertarian Free Will',
    description: 'Whether human choices are determined by prior causes (determinism) or arise from genuine free agency.',
  },
  {
    key: 'ethicsFramework', group: 'E', type: 'bipolar', label: 'Ethics Framework',
    negativeLabel: 'Consequentialism', positiveLabel: 'Deontology',
    description: 'Whether the morality of an action is judged by its outcomes (consequentialism) or by adherence to duties and rules (deontology).',
  },
  {
    key: 'moralRealism', group: 'E', type: 'bipolar', label: 'Moral Realism',
    negativeLabel: 'Anti-realism / Relativism', positiveLabel: 'Moral Realism',
    description: 'Whether moral facts are objective and mind-independent (realism) or culturally constructed/relative (anti-realism).',
  },
  {
    key: 'humanNature', group: 'E', type: 'bipolar', label: 'Human Nature',
    negativeLabel: 'Pessimism', positiveLabel: 'Optimism',
    description: 'Whether humans are fundamentally selfish and prone to conflict (pessimism) or cooperative and good-natured (optimism).',
  },
  {
    key: 'timeOrientation', group: 'E', type: 'bipolar', label: 'Time Orientation',
    negativeLabel: 'Progressive', positiveLabel: 'Traditional',
    description: 'Whether you tend to look forward toward change and improvement, or backward to preserve inherited wisdom and ways of life.',
  },

  // ── Group F: Ontological Preferences ──────────────────────────────────────
  {
    key: 'realismConstructivism', group: 'F', type: 'bipolar', label: 'Realism vs. Constructivism',
    negativeLabel: 'Constructivism', positiveLabel: 'Realism',
    description: 'Whether reality exists independently of perception (realism) or is shaped by cultural/mental frameworks (constructivism).',
  },
  {
    key: 'orderChaos', group: 'F', type: 'bipolar', label: 'Order vs. Spontaneity',
    negativeLabel: 'Chaos / Spontaneity', positiveLabel: 'Order / Structure',
    description: 'Whether you thrive amid unpredictability and improvisation or prefer clear structures and predictability.',
  },
  {
    key: 'individualCollective', group: 'F', type: 'bipolar', label: 'Individual vs. Collective',
    negativeLabel: 'Collective', positiveLabel: 'Individual',
    description: 'Whether you place greater value on the group\'s needs and identity or on individual autonomy and self-determination.',
  },
  {
    key: 'reductionHolism', group: 'F', type: 'bipolar', label: 'Reductionism vs. Holism',
    negativeLabel: 'Holism', positiveLabel: 'Reductionism',
    description: 'Whether complex phenomena are best understood by analysing their parts (reductionism) or as unified wholes (holism).',
  },
];

export const DIMENSION_MAP: Record<DimensionKey, Dimension> = Object.fromEntries(
  DIMENSIONS.map(d => [d.key, d])
) as Record<DimensionKey, Dimension>;

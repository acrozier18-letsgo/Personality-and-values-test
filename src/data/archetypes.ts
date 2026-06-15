import type { DimensionKey } from './dimensions';

export interface Archetype {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  description: string;
  vector: Partial<Record<DimensionKey, number>>;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'restless-cartographer',
    name: 'The Restless Cartographer',
    tagline: 'Always mapping, never settled.',
    emoji: '\u{1F5FA}',
    description: "You draw maps of territory others haven't visited — intellectually, geographically, philosophically. Curiosity is your compass. Standing still feels like a small death.",
    vector: { openness: 90, stimulation: 85, selfDirection: 85, conscientiousness: 45, extraversion: 60, security: 20, epistemology: -30 },
  },
  {
    id: 'steady-gardener',
    name: 'The Steady Gardener',
    tagline: 'Patient, purposeful, and deeply rooted.',
    emoji: '\u{1F331}',
    description: "You grow things slowly and well: relationships, skills, communities, gardens. Consistency is your superpower. You're the person others count on when everything else shifts.",
    vector: { conscientiousness: 90, benevolence: 80, security: 75, tradition: 65, openness: 45, neuroticism: 20, orderChaos: 70 },
  },
  {
    id: 'lighthouse-contrarian',
    name: 'The Lighthouse Contrarian',
    tagline: 'Illuminating the unlit corners.',
    emoji: '\u{1F4A1}',
    description: "You instinctively question consensus. Not from stubbornness but from a genuine need to test ideas against reality. You make everyone sharper, even when you're annoying.",
    vector: { openness: 85, liberty: 80, selfDirection: 90, authority: 15, conformity: 10, fairness: 70, epistemology: -40, moralRealism: -20 },
  },
  {
    id: 'architect-of-systems',
    name: 'The Architect of Systems',
    tagline: 'Building structures that outlast you.',
    emoji: '\u{1F3DB}',
    description: "You see patterns others miss and build frameworks to harness them. Whether it's code, organisations, or ideas, you crave elegance and coherence over improvisation.",
    vector: { conscientiousness: 90, openness: 75, reductionHolism: 60, orderChaos: 80, achievement: 80, selfDirection: 75 },
  },
  {
    id: 'empathic-weaver',
    name: 'The Empathic Weaver',
    tagline: 'Holding the threads together.',
    emoji: '\u{1F578}',
    description: "You sense the emotional undercurrents in every room. People open up to you easily, and you feel the weight of that. You weave connections between people as naturally as breathing.",
    vector: { agreeableness: 90, care: 90, benevolence: 85, extraversion: 65, neuroticism: 55, universalism: 75, individualCollective: -50 },
  },
  {
    id: 'principled-dissenter',
    name: 'The Principled Dissenter',
    tagline: 'Justice over comfort, every time.',
    emoji: '⚖️',
    description: "You hold a firm moral line and you will not cross it — not for approval, not for convenience. You frustrate and inspire in equal measure. History tends to vindicate people like you.",
    vector: { fairness: 90, moralRealism: 70, ethicsFramework: 60, liberty: 75, authority: 20, conformity: 15, conscientiousness: 65 },
  },
  {
    id: 'sovereign-pragmatist',
    name: 'The Sovereign Pragmatist',
    tagline: "What works is what matters.",
    emoji: '\u{1F3AF}',
    description: "You have no time for ideology that doesn't produce results. You cut through debate to find solutions, adapt readily, and judge success by outcomes — not by how things look on paper.",
    vector: { achievement: 85, ethicsFramework: -60, openness: 65, conscientiousness: 70, power: 55, selfDirection: 80, reductionHolism: 50 },
  },
  {
    id: 'quiet-mystic',
    name: 'The Quiet Mystic',
    tagline: 'The interior life is the real one.',
    emoji: '\u{1F319}',
    description: "You live a rich inner life that most people never see. The unseen, the numinous, and the space between things fascinate you. You know something most people have decided not to look at.",
    vector: { metaphysics: 70, openness: 80, extraversion: 20, sanctity: 65, tradition: 50, neuroticism: 45, hedonism: 30 },
  },
  {
    id: 'frontier-builder',
    name: 'The Frontier Builder',
    tagline: 'Make the new thing, then the next one.',
    emoji: '\u{1F680}',
    description: "Existing structures bore you; the open frontier calls you. You get energy from making something out of nothing. Comfort is just another word for stagnation.",
    vector: { openness: 90, stimulation: 90, achievement: 80, conscientiousness: 55, security: 15, selfDirection: 90, timeOrientation: -50 },
  },
  {
    id: 'guardian-of-the-commons',
    name: 'The Guardian of the Commons',
    tagline: "What we share is worth protecting.",
    emoji: '\u{1F6E1}',
    description: "You feel the pull of collective responsibility deeply. Community, tradition, and shared institutions aren't abstractions — they're the connective tissue of civilisation, and someone has to tend them.",
    vector: { loyalty: 85, tradition: 75, authority: 65, security: 75, conformity: 60, benevolence: 80, individualCollective: -70, timeOrientation: 60 },
  },
  {
    id: 'curious-empiricist',
    name: 'The Curious Empiricist',
    tagline: 'Show me the data.',
    emoji: '\u{1F52C}',
    description: "You trust evidence and distrust grand theories that outrun it. Intellectual humility isn't a pose for you — it's the working method. You're genuinely open to being wrong.",
    vector: { epistemology: -70, openness: 80, conscientiousness: 70, metaphysics: -60, moralRealism: -30, reductionHolism: 50, selfDirection: 70 },
  },
  {
    id: 'tender-rebel',
    name: 'The Tender Rebel',
    tagline: 'Angry because you care.',
    emoji: '\u{1F339}',
    description: "You push back against what's unfair with a fierceness that springs from love, not contempt. You dream of a world where no one falls through the cracks, and you argue loudly for it.",
    vector: { care: 90, fairness: 90, liberty: 75, universalism: 85, economicAxis: -70, authority: 20, neuroticism: 50 },
  },
  {
    id: 'stoic-craftsperson',
    name: 'The Stoic Craftsperson',
    tagline: 'The work is the reward.',
    emoji: '\u{1F528}',
    description: "You find meaning in mastery. Long hours, quiet focus, and the satisfaction of something well made are your languages. You don't need applause — just the problem and the tools.",
    vector: { conscientiousness: 90, achievement: 75, openness: 55, extraversion: 25, power: 20, hedonism: 30, orderChaos: 70 },
  },
  {
    id: 'social-architect',
    name: 'The Social Architect',
    tagline: 'People are the project.',
    emoji: '\u{1F91D}',
    description: "You have a gift for seeing how social systems could work better and for rallying people to build them. Leadership isn't a role for you; it's the natural outcome of caring a lot and being good with people.",
    vector: { extraversion: 85, agreeableness: 70, achievement: 75, power: 60, universalism: 65, benevolence: 70, individualCollective: -30 },
  },
];

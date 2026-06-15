import type { DimensionScore } from './scoring';

type Scores = Record<string, DimensionScore>;

export function identitySentence(scores: Scores): string {

  const highOpen = scores['openness']?.score >= 70;
  const highCon   = scores['conscientiousness']?.score >= 70;
  const highExtra  = scores['extraversion']?.score >= 65;
  const lowExtra   = scores['extraversion']?.score <= 35;

  const leftEcon = scores['economicAxis']?.score <= -40;
  const rightEcon = scores['economicAxis']?.score >= 40;
  const libSocial = scores['socialAxis']?.score <= -40;
  const authSocial = scores['socialAxis']?.score >= 40;

  const parts: string[] = [];

  if (highOpen && highCon) parts.push('a methodical explorer — curious about everything but rigorous about what you keep');
  else if (highOpen && !highCon) parts.push('a wide-ranging intellectual magpie, drawn to ideas before systems');
  else if (!highOpen && highCon) parts.push('a precise executor who finds beauty in things done well');

  if (highExtra) parts.push('energised by people and the social world');
  else if (lowExtra) parts.push('someone who does your best thinking away from the crowd');

  if (leftEcon && libSocial) parts.push('with a libertarian-left streak');
  else if (rightEcon && authSocial) parts.push('with a traditional, ordered-society outlook');
  else if (leftEcon && authSocial) parts.push('who believes in collective responsibility and clear rules');
  else if (rightEcon && libSocial) parts.push('who thinks free markets and personal freedom go together');

  if (scores['care']?.score >= 80) parts.push('moved by others\' suffering');
  if (scores['moralRealism']?.score >= 60) parts.push('convinced that some things are genuinely right or wrong');
  if (scores['moralRealism']?.score <= -50) parts.push('sceptical that morality is anything more than perspective');

  if (parts.length === 0) {
    parts.push('a balanced, hard-to-categorise thinker');
  }

  return `You are ${parts[0]}${parts.length > 1 ? ', ' + parts.slice(1).join(', ') : ''}.`;
}

export function introductions(scores: Scores): string[] {
  const casual: string[] = [];
  const work: string[] = [];
  const bio: string[] = [];

  const extraversion = scores['extraversion']?.score ?? 50;
  const openness     = scores['openness']?.score ?? 50;
  const care         = scores['care']?.score ?? 50;
  const achievement  = scores['achievement']?.score ?? 50;
  const selfDir      = scores['selfDirection']?.score ?? 50;

  if (extraversion >= 65) {
    casual.push('I\'m the one at the party who\'s somehow already friends with everyone.');
  } else if (extraversion <= 35) {
    casual.push('I\'m great in small groups and a bit allergic to small talk.');
  } else {
    casual.push('I like people in the right doses — deep conversation over cocktail party noise.');
  }

  if (openness >= 70) {
    work.push('At work I\'m the person who keeps asking "but what if we tried it differently?"');
  } else if (achievement >= 75) {
    work.push('At work I\'m the person who ships, tracks, and won\'t let good enough be the enemy of done.');
  } else {
    work.push('At work I care about doing things properly, even when it takes longer.');
  }

  if (care >= 75) {
    bio.push('I\'m a chronic helper. I\'m also trying to get better at helping myself.');
  } else if (selfDir >= 75) {
    bio.push('I\'m building something — still figuring out the edges, but the direction is clear.');
  } else {
    bio.push('I take ideas seriously and people seriously — not always simultaneously.');
  }

  return [casual[0], work[0], bio[0]];
}

export function timeRecommendations(scores: Scores): string[] {
  const recs: string[] = [];
  const open      = scores['openness']?.score ?? 50;
  const stim      = scores['stimulation']?.score ?? 50;
  const con       = scores['conscientiousness']?.score ?? 50;
  const extra     = scores['extraversion']?.score ?? 50;
  const care      = scores['care']?.score ?? 50;
  const hedon     = scores['hedonism']?.score ?? 50;
  const selfDir   = scores['selfDirection']?.score ?? 50;
  const univers   = scores['universalism']?.score ?? 50;
  const achievem  = scores['achievement']?.score ?? 50;
  const security  = scores['security']?.score ?? 50;
  const neuro     = scores['neuroticism']?.score ?? 50;
  const order     = scores['orderChaos']?.score ?? 0; // bipolar

  if (open >= 75 || stim >= 75) {
    recs.push('Schedule one genuinely unfamiliar experience a month — a lecture topic you know nothing about, a cuisine, a city district. Your mind expands on contact with the foreign.');
  }
  if (con >= 75) {
    recs.push('Give yourself one "deep work" block a day with no notifications. You do your best work in long, uninterrupted stretches — protect those windows ferociously.');
  }
  if (extra >= 70) {
    recs.push('Don\'t skip the social invitations when you\'re tired. You tend to underestimate how much energy other people give you until you\'re in the room.');
  }
  if (extra <= 35) {
    recs.push('Guard your solitude the same way you\'d guard a meeting with someone important. It\'s not wasted time — it\'s the engine room.');
  }
  if (care >= 80 || univers >= 80) {
    recs.push('Find one cause or organisation you believe in and commit to it consistently. Scattered generosity is less satisfying than a sustained relationship with something that matters to you.');
  }
  if (hedon >= 70) {
    recs.push('Build small pleasures into your week on purpose: the good coffee, the afternoon walk, the album you love. Enjoyment is not a reward for finishing — it\'s part of the design.');
  }
  if (achievem >= 80) {
    recs.push('Track one meaningful goal with a very short feedback loop. You thrive on progress, and short loops make progress visible before motivation flags.');
  }
  if (security >= 75 || order > 40) {
    recs.push('Set aside thirty minutes a week to review the upcoming week\'s shape. Knowing what\'s coming transforms anxiety into readiness.');
  }
  if (neuro >= 70) {
    recs.push('Build a brief daily practice — a walk, journalling, breathing — that doesn\'t depend on circumstances being good. It\'s the floor you land on when things get wobbly.');
  }
  if (selfDir >= 80) {
    recs.push('Identify the one project or question that is truly yours — not assigned, not expected — and give it real time. Self-directed work is where you\'re most alive.');
  }

  return recs.slice(0, 6);
}

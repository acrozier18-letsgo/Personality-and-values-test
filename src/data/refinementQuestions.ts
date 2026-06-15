import type { DimensionKey } from './dimensions';

export interface RefinementQuestion {
  id: string;
  text: string;
  weights: Partial<Record<DimensionKey, number>>;
  targetDimensions: DimensionKey[];
}

// Likert 1–5 maps to: 1→-2, 2→-1, 3→0, 4→+1, 5→+2 (multiplied by weight)
export const REFINEMENT_QUESTIONS: RefinementQuestion[] = [
  { id:'r001', text:"When making an important decision, I prefer to gather every available fact before acting.", weights:{ epistemology:-2, conscientiousness:1 }, targetDimensions:['epistemology', 'conscientiousness'] },
  { id:'r002', text:"I believe the world is fundamentally a good place that rewards effort.", weights:{ humanNature:2, freeWill:1 }, targetDimensions:['humanNature', 'freeWill'] },
  { id:'r003', text:"I enjoy solitude and find it restorative rather than lonely.", weights:{ extraversion:-2 }, targetDimensions:['extraversion'] },
  { id:'r004', text:"I think following rules is generally more important than bending them, even for good reasons.", weights:{ ethicsFramework:2, conformity:1, authority:1 }, targetDimensions:['ethicsFramework', 'conformity'] },
  { id:'r005', text:"I feel that economic inequality is one of the most pressing moral problems of our time.", weights:{ economicAxis:-2, fairness:1 }, targetDimensions:['economicAxis', 'fairness'] },
  { id:'r006', text:"My sense of self depends more on who I am as an individual than on the groups I belong to.", weights:{ individualCollective:2 }, targetDimensions:['individualCollective'] },
  { id:'r007', text:"I think consciousness and subjective experience are irreducible — they can't be explained away by science.", weights:{ metaphysics:2, reductionHolism:-1 }, targetDimensions:['metaphysics', 'reductionHolism'] },
  { id:'r008', text:"I prefer environments that feel structured and well-organised over ones that feel fluid and improvisational.", weights:{ orderChaos:2 }, targetDimensions:['orderChaos'] },
  { id:'r009', text:"I would rather risk something for a potentially great outcome than accept a safe but mediocre one.", weights:{ stimulation:2, security:-1, freeWill:1 }, targetDimensions:['stimulation', 'security'] },
  { id:'r010', text:"I feel a strong personal responsibility to contribute to causes larger than my own wellbeing.", weights:{ universalism:2, benevolence:2 }, targetDimensions:['universalism', 'benevolence'] },
  { id:'r011', text:"I believe that traditions generally contain more wisdom than their critics give them credit for.", weights:{ tradition:2, timeOrientation:2 }, targetDimensions:['tradition', 'timeOrientation'] },
  { id:'r012', text:"The idea that people can genuinely choose otherwise — that free will is real — seems important to me.", weights:{ freeWill:2 }, targetDimensions:['freeWill'] },
  { id:'r013', text:"I worry frequently about things outside my control.", weights:{ neuroticism:2, security:-1 }, targetDimensions:['neuroticism', 'security'] },
  { id:'r014', text:"I think people who work harder generally deserve more — effort should be rewarded.", weights:{ achievement:2, economicAxis:1, fairness:1 }, targetDimensions:['achievement', 'economicAxis'] },
  { id:'r015', text:"I find myself drawn to questions about meaning, consciousness, or the nature of reality.", weights:{ openness:1, metaphysics:1, sanctity:1 }, targetDimensions:['openness', 'metaphysics'] },
  { id:'r016', text:"I believe that most conflicts could be resolved if people were less selfish.", weights:{ humanNature:2, care:1 }, targetDimensions:['humanNature', 'care'] },
  { id:'r017', text:"I think personal freedom is more important than most other social goods.", weights:{ liberty:2, socialAxis:-2 }, targetDimensions:['liberty', 'socialAxis'] },
  { id:'r018', text:"I am more moved by injustice than by violation of social norms or traditions.", weights:{ fairness:2, tradition:-1 }, targetDimensions:['fairness', 'tradition'] },
  { id:'r019', text:"I feel that art and music can express truths that logic and science cannot reach.", weights:{ metaphysics:1, openness:2 }, targetDimensions:['metaphysics', 'openness'] },
  { id:'r020', text:"I believe the state should play a significant role in reducing inequality.", weights:{ economicAxis:-2, universalism:1 }, targetDimensions:['economicAxis', 'universalism'] },
  { id:'r021', text:"I think that understanding a phenomenon means breaking it into its component parts.", weights:{ reductionHolism:2 }, targetDimensions:['reductionHolism'] },
  { id:'r022', text:"I find that I'm sensitive to other people's emotional states, even when they don't say anything.", weights:{ agreeableness:2, care:1 }, targetDimensions:['agreeableness', 'care'] },
  { id:'r023', text:"I tend to finish what I start, even when it stops being interesting.", weights:{ conscientiousness:2 }, targetDimensions:['conscientiousness'] },
  { id:'r024', text:"I think human nature is more shaped by culture and circumstances than by biology.", weights:{ realismConstructivism:-1, humanNature:1, freeWill:1 }, targetDimensions:['realismConstructivism', 'humanNature'] },
  { id:'r025', text:"I believe that some things — human life, sacred places, certain principles — should not be traded off.", weights:{ sanctity:2, ethicsFramework:1 }, targetDimensions:['sanctity', 'ethicsFramework'] },
  { id:'r026', text:"I prefer to see the big picture rather than focus on details.", weights:{ reductionHolism:-1, openness:1 }, targetDimensions:['reductionHolism', 'openness'] },
  { id:'r027', text:"I often reconsider my beliefs when I encounter strong counter-arguments.", weights:{ openness:2, moralRealism:-1 }, targetDimensions:['openness', 'moralRealism'] },
  { id:'r028', text:"I think social order and stability are underrated as political priorities.", weights:{ socialAxis:2, security:2, authority:1 }, targetDimensions:['socialAxis', 'security'] },
  { id:'r029', text:"I believe that what is morally right doesn't depend on the culture one lives in.", weights:{ moralRealism:2 }, targetDimensions:['moralRealism'] },
  { id:'r030', text:"I feel that I am the primary author of my own life story.", weights:{ freeWill:2, selfDirection:2 }, targetDimensions:['freeWill', 'selfDirection'] },
  { id:'r031', text:"I am drawn to elegant, minimal solutions over complicated ones.", weights:{ conscientiousness:1, orderChaos:1, reductionHolism:1 }, targetDimensions:['conscientiousness', 'orderChaos'] },
  { id:'r032', text:"I think loyalty — to friends, family, community — is one of the most important virtues.", weights:{ loyalty:2, benevolence:1 }, targetDimensions:['loyalty', 'benevolence'] },
  { id:'r033', text:"I believe that the best life involves regular exposure to beauty and pleasure.", weights:{ hedonism:2, openness:1 }, targetDimensions:['hedonism', 'openness'] },
  { id:'r034', text:"I feel that the world is becoming more complex and uncertain, and I find that unsettling.", weights:{ neuroticism:1, security:2, timeOrientation:1 }, targetDimensions:['neuroticism', 'security', 'timeOrientation'] },
  { id:'r035', text:"I think individual responsibility is often used to excuse structural failures.", weights:{ economicAxis:-2, freeWill:-1, fairness:1 }, targetDimensions:['economicAxis', 'freeWill'] },
  { id:'r036', text:"I find that I learn best through doing and experiencing, not through theory.", weights:{ epistemology:-2 }, targetDimensions:['epistemology'] },
  { id:'r037', text:"I think our identity is mostly constructed through language and social interaction.", weights:{ realismConstructivism:-2, individualCollective:-1 }, targetDimensions:['realismConstructivism', 'individualCollective'] },
  { id:'r038', text:"I believe that achievement and ambition are core to who I am.", weights:{ achievement:2, selfDirection:1 }, targetDimensions:['achievement', 'selfDirection'] },
  { id:'r039', text:"I feel that society has become too permissive and could use clearer moral standards.", weights:{ socialAxis:2, conformity:2, authority:1, timeOrientation:2 }, targetDimensions:['socialAxis', 'conformity', 'authority'] },
  { id:'r040', text:"I believe that a world without poverty is achievable if people choose to prioritise it.", weights:{ humanNature:2, universalism:2, economicAxis:-1 }, targetDimensions:['humanNature', 'universalism'] },
];

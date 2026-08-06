// Relationship-dynamics question packs — the data behind the "Together" page.
//
// These differ from the `partner` pack in optionalQuestions.ts in one crucial
// way. That pack asks what someone wants in a HYPOTHETICAL partner ("I need a
// partner who…"), which is mate-selection data. These ask how a person ACTUALLY
// operates right now — how they fight, how they repair, how they take bad news,
// how they run a household, how they parent, how they handle their family. That
// is what a couples report can reason about, because two people's answers to the
// same behavioural statement can be compared directly.
//
// Like the optional packs these are unscored: they carry no dimension weights and
// never touch the radars. Instead each question carries:
//   - `facet`    which slice of relationship life it measures (drives the friction map)
//   - `gapWeight` how much a DIFFERENCE between two partners on this item actually
//                 matters. Not every mismatch is a problem: differing on who cooks
//                 is survivable, differing on whether shouting is acceptable is not.
//   - `depth`    'core' (the ~180-question baseline) or 'deep' (opt-in extra depth)

export type RelationshipCategoryKey =
  | 'conflict'
  | 'requests'
  | 'stress'
  | 'moneyhome'
  | 'coparent'
  | 'kin';

/** Fine-grained topic within a pack. Grouped into report sections by SECTION_FACETS. */
export type RelationshipFacet =
  // conflict
  | 'escalation' | 'repair' | 'timeout' | 'grudges'
  // requests
  | 'directness' | 'feedback' | 'listening' | 'asking'
  // stress
  | 'badnews' | 'stressStyle' | 'support'
  // money & household
  | 'spending' | 'planning' | 'chores' | 'mentalLoad'
  // co-parenting
  | 'discipline' | 'unitedFront' | 'childTime' | 'schooling'
  // family & in-laws
  | 'inlaws' | 'boundaries' | 'holidays' | 'origin';

export type QuestionDepth = 'core' | 'deep';

export interface RelationshipCategoryMeta {
  key: RelationshipCategoryKey;
  label: string;
  color: string;
  blurb: string;
}

export const RELATIONSHIP_CATEGORIES: RelationshipCategoryMeta[] = [
  { key: 'conflict',  label: 'Conflict & Repair',       color: '#dc2626', blurb: 'How you argue, escalate, cool off, apologise, and find your way back.' },
  { key: 'requests',  label: 'Communication & Requests', color: '#2563eb', blurb: 'How you ask, how you like to be asked, and how you take feedback.' },
  { key: 'stress',    label: 'Stress & Bad News',        color: '#7c3aed', blurb: 'What you need when life goes wrong — and how you break hard news.' },
  { key: 'moneyhome', label: 'Money & Household',        color: '#059669', blurb: 'Spending, saving, chores, and the invisible admin of running a life.' },
  { key: 'coparent',  label: 'Co-Parenting in Practice', color: '#ea580c', blurb: 'Not parenting ideals — how you two actually operate as a team with kids.' },
  { key: 'kin',       label: 'Family & In-Laws',         color: '#c026d3', blurb: 'Your family, their family, boundaries, holidays, and what you inherited.' },
];

export const RELATIONSHIP_CATEGORY_MAP: Record<RelationshipCategoryKey, RelationshipCategoryMeta> =
  Object.fromEntries(RELATIONSHIP_CATEGORIES.map(c => [c.key, c])) as Record<
    RelationshipCategoryKey,
    RelationshipCategoryMeta
  >;

export const RELATIONSHIP_CATEGORY_KEYS = RELATIONSHIP_CATEGORIES.map(c => c.key);

export interface RelationshipQuestion {
  id: string;
  category: RelationshipCategoryKey;
  facet: RelationshipFacet;
  /** 1 = a gap here is usually harmless, 3 = a gap here is a genuine fault line. */
  gapWeight: 1 | 2 | 3;
  depth: QuestionDepth;
  text: string;
}

export const RELATIONSHIP_QUESTIONS: RelationshipQuestion[] = [
  // ══ Conflict & Repair ══════════════════════════════════════════════════════
  // ── core (35) ──
  { id: 'cnf001', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'When something upsets me, I say so straight away rather than letting it sit.' },
  { id: 'cnf002', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'I raise my voice when an argument gets heated.' },
  { id: 'cnf003', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'core', text: 'I need to finish an argument before we go to sleep.' },
  { id: 'cnf004', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'core', text: 'I go quiet and withdraw when a disagreement gets intense.' },
  { id: 'cnf005', category: 'conflict', facet: 'grudges',    gapWeight: 2, depth: 'core', text: 'I bring up past grievances when we argue about something new.' },
  { id: 'cnf006', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I would rather drop a small annoyance than have a conversation about it.' },
  { id: 'cnf007', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'In an argument I focus on being understood more than on being right.' },
  { id: 'cnf008', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I get defensive quickly when I feel criticised.' },
  { id: 'cnf009', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I can stay calm even when my partner is clearly upset.' },
  { id: 'cnf010', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'I use sarcasm or a cutting remark when I’m angry.' },
  { id: 'cnf011', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'core', text: 'Once I’m flooded with emotion, I can’t think straight until I’ve had a break.' },
  { id: 'cnf012', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I tend to keep arguing until the other person concedes.' },
  { id: 'cnf013', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I find it easy to admit when I was the one in the wrong.' },
  { id: 'cnf014', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I apologise quickly, even before I fully understand what went wrong.' },
  { id: 'cnf015', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'A sincere apology from my partner resets things for me almost immediately.' },
  { id: 'cnf016', category: 'conflict', facet: 'repair',     gapWeight: 3, depth: 'core', text: 'I need time to forgive, even after an apology.' },
  { id: 'cnf017', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I want physical affection — a hug, a hand — as part of making up.' },
  { id: 'cnf018', category: 'conflict', facet: 'repair',     gapWeight: 3, depth: 'core', text: 'I want to talk through what happened after a fight, not just move on.' },
  { id: 'cnf019', category: 'conflict', facet: 'timeout',    gapWeight: 2, depth: 'core', text: 'I’d rather let things settle overnight and revisit them the next day.' },
  { id: 'cnf020', category: 'conflict', facet: 'repair',     gapWeight: 1, depth: 'core', text: 'Humour is a good way to defuse tension between us.' },
  { id: 'cnf021', category: 'conflict', facet: 'grudges',    gapWeight: 2, depth: 'core', text: 'I keep score of who has given in more often.' },
  { id: 'cnf022', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'I threaten to leave or end things when I’m very angry.' },
  { id: 'cnf023', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'core', text: 'I go silent for hours or days when I’m hurt.' },
  { id: 'cnf024', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I’d rather be told bluntly that I’ve upset someone than have them hint at it.' },
  { id: 'cnf025', category: 'conflict', facet: 'escalation', gapWeight: 1, depth: 'core', text: 'I think most arguments between couples are about the surface issue, not something deeper.' },
  { id: 'cnf026', category: 'conflict', facet: 'listening',  gapWeight: 2, depth: 'core', text: 'I need to feel heard before I can hear my partner’s side.' },
  { id: 'cnf027', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'I find it hard to argue without feeling the whole relationship is at stake.' },
  { id: 'cnf028', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'core', text: 'I can disagree strongly with my partner and still feel close to them.' },
  { id: 'cnf029', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I want a disagreement resolved in one conversation rather than several.' },
  { id: 'cnf030', category: 'conflict', facet: 'timeout',    gapWeight: 2, depth: 'core', text: 'I’m comfortable saying “I don’t want to talk about this right now.”' },
  { id: 'cnf031', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'core', text: 'When my partner asks for space mid-argument, I take it personally.' },
  { id: 'cnf032', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I believe some disagreements simply won’t be resolved, and that’s okay.' },
  { id: 'cnf033', category: 'conflict', facet: 'grudges',    gapWeight: 2, depth: 'core', text: 'I replay arguments in my head long after they end.' },
  { id: 'cnf034', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'core', text: 'I’d want a third party — a counsellor, a friend — involved if we kept having the same fight.' },
  { id: 'cnf035', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'core', text: 'I’d rather we argue openly than avoid conflict to keep the peace.' },
  // ── deep (22) ──
  { id: 'cnf101', category: 'conflict', facet: 'support',    gapWeight: 2, depth: 'deep', text: 'When I’m hurt I want my partner to fix the problem rather than just listen.' },
  { id: 'cnf102', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'deep', text: 'I find it hard to let go of an argument until I feel my partner understands exactly why I was hurt.' },
  { id: 'cnf103', category: 'conflict', facet: 'directness',  gapWeight: 1, depth: 'deep', text: 'I’d rather write down what I feel than say it out loud in the moment.' },
  { id: 'cnf104', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'deep', text: 'Arguing over text makes things worse for me.' },
  { id: 'cnf105', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'deep', text: 'I need to know an argument is over before I can be affectionate again.' },
  { id: 'cnf106', category: 'conflict', facet: 'escalation', gapWeight: 1, depth: 'deep', text: 'I can tell within seconds when my partner is about to get upset.' },
  { id: 'cnf107', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'deep', text: 'I tend to assume the worst about my partner’s intentions when I’m angry.' },
  { id: 'cnf108', category: 'conflict', facet: 'escalation', gapWeight: 1, depth: 'deep', text: 'I think couples who never argue are hiding something.' },
  { id: 'cnf109', category: 'conflict', facet: 'timeout',    gapWeight: 3, depth: 'deep', text: 'I want my partner to check in on me after I’ve withdrawn, rather than leave me alone.' },
  { id: 'cnf110', category: 'conflict', facet: 'support',    gapWeight: 2, depth: 'deep', text: 'I feel responsible for my partner’s mood.' },
  { id: 'cnf111', category: 'conflict', facet: 'boundaries', gapWeight: 2, depth: 'deep', text: 'I would rather resolve conflict privately than involve friends or family.' },
  { id: 'cnf112', category: 'conflict', facet: 'escalation', gapWeight: 3, depth: 'deep', text: 'Being teased or mocked in an argument cuts deeper for me than being shouted at.' },
  { id: 'cnf113', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'deep', text: 'I need a clear agreement about what changes after a fight, not just an apology.' },
  { id: 'cnf114', category: 'conflict', facet: 'timeout',    gapWeight: 2, depth: 'deep', text: 'I find “we’ll talk about it later” reassuring rather than frustrating.' },
  { id: 'cnf115', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'deep', text: 'I bring up problems when we’re already tired or busy, rather than waiting for a good moment.' },
  { id: 'cnf116', category: 'conflict', facet: 'grudges',    gapWeight: 3, depth: 'deep', text: 'If I feel dismissed once, I stop bringing that topic up at all.' },
  { id: 'cnf117', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'deep', text: 'I can apologise for the hurt I caused even if I still think I was right.' },
  { id: 'cnf118', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'deep', text: 'I’m more upset by how something was said than by what was said.' },
  { id: 'cnf119', category: 'conflict', facet: 'repair',     gapWeight: 1, depth: 'deep', text: 'I want us to have rules about how we fight, agreed in advance.' },
  { id: 'cnf120', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'deep', text: 'I take a partner’s frustration about a chore as a comment on me as a person.' },
  { id: 'cnf121', category: 'conflict', facet: 'escalation', gapWeight: 2, depth: 'deep', text: 'I’d rather have one big honest row than weeks of low-level tension.' },
  { id: 'cnf122', category: 'conflict', facet: 'repair',     gapWeight: 2, depth: 'deep', text: 'After a serious fight, I need reassurance that we’re still solid.' },

  // ══ Communication & Requests ═══════════════════════════════════════════════
  // ── core (30) ──
  { id: 'req001', category: 'requests', facet: 'directness', gapWeight: 3, depth: 'core', text: 'I say exactly what I mean rather than hinting.' },
  { id: 'req002', category: 'requests', facet: 'asking',     gapWeight: 3, depth: 'core', text: 'I expect my partner to notice what I need without me asking.' },
  { id: 'req003', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I’d rather be asked directly for something than have it implied.' },
  { id: 'req004', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I find “can you do X?” easier to hear than “X never gets done.”' },
  { id: 'req005', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I need to know why I’m being asked to do something, not just what.' },
  { id: 'req006', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I’d rather be given a task and left to do it my own way.' },
  { id: 'req007', category: 'requests', facet: 'asking',     gapWeight: 1, depth: 'core', text: 'I prefer requests in writing — a text, a list, a note — over spoken ones.' },
  { id: 'req008', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'A reminder about something I’ve forgotten feels like nagging to me.' },
  { id: 'req009', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'core', text: 'I say yes to things I don’t actually want to do.' },
  { id: 'req010', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'core', text: 'I find it easy to say no to my partner.' },
  { id: 'req011', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I need time to consider a request before answering.' },
  { id: 'req012', category: 'requests', facet: 'asking',     gapWeight: 1, depth: 'core', text: 'I like being asked at the moment something needs doing rather than in advance.' },
  { id: 'req013', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'Being thanked for ordinary tasks matters to me.' },
  { id: 'req014', category: 'requests', facet: 'feedback',   gapWeight: 3, depth: 'core', text: 'I’d rather hear criticism straight away than have it saved up.' },
  { id: 'req015', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'I take feedback better when it starts with something positive.' },
  { id: 'req016', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'I want my partner to tell me when I’ve disappointed them, even about small things.' },
  { id: 'req017', category: 'requests', facet: 'listening',  gapWeight: 2, depth: 'core', text: 'I interrupt when I’m excited about what I’m saying.' },
  { id: 'req018', category: 'requests', facet: 'listening',  gapWeight: 2, depth: 'core', text: 'I need my partner to put their phone down when we’re talking about something important.' },
  { id: 'req019', category: 'requests', facet: 'directness', gapWeight: 3, depth: 'core', text: 'I process my thoughts by talking them out loud.' },
  { id: 'req020', category: 'requests', facet: 'directness', gapWeight: 3, depth: 'core', text: 'I need to think something through alone before I can discuss it.' },
  { id: 'req021', category: 'requests', facet: 'directness', gapWeight: 1, depth: 'core', text: 'I’d rather have a hard conversation face to face than by phone or text.' },
  { id: 'req022', category: 'requests', facet: 'listening',  gapWeight: 2, depth: 'core', text: 'I like having a regular time set aside to talk about how we’re doing.' },
  { id: 'req023', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'core', text: 'I find it hard to ask for help.' },
  { id: 'req024', category: 'requests', facet: 'support',    gapWeight: 2, depth: 'core', text: 'I’d rather my partner ask “how can I help?” than just take over.' },
  { id: 'req025', category: 'requests', facet: 'listening',  gapWeight: 2, depth: 'core', text: 'I want my partner to remember details of what I tell them about my day.' },
  { id: 'req026', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'I show love more through actions than through words.' },
  { id: 'req027', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'Hearing “I love you” regularly matters to me.' },
  { id: 'req028', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'core', text: 'I need my partner to be specific about what they want changed.' },
  { id: 'req029', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'core', text: 'Being told “it’s fine” when it clearly isn’t frustrates me deeply.' },
  { id: 'req030', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'core', text: 'I would rather over-communicate than risk a misunderstanding.' },
  // ── deep (20) ──
  { id: 'req101', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'deep', text: 'I’d rather my partner ask me a direct question than guess how I feel.' },
  { id: 'req102', category: 'requests', facet: 'listening',  gapWeight: 1, depth: 'deep', text: 'I need silence between us to be comfortable, not filled.' },
  { id: 'req103', category: 'requests', facet: 'directness', gapWeight: 3, depth: 'deep', text: 'I find talking about feelings draining, even when it helps.' },
  { id: 'req104', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'deep', text: 'I use humour to deflect when a conversation gets too serious.' },
  { id: 'req105', category: 'requests', facet: 'listening',  gapWeight: 1, depth: 'deep', text: 'I want my partner to repeat back what I’ve said so I know they heard it.' },
  { id: 'req106', category: 'requests', facet: 'directness', gapWeight: 3, depth: 'deep', text: 'I find long conversations about the relationship exhausting.' },
  { id: 'req107', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'deep', text: 'I’d rather be told a hard truth than a kind half-truth.' },
  { id: 'req108', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'deep', text: 'I need to be warned before a serious conversation starts.' },
  { id: 'req109', category: 'requests', facet: 'directness', gapWeight: 1, depth: 'deep', text: 'I speak more freely on a walk or a drive than sitting face to face.' },
  { id: 'req110', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'deep', text: 'I want my partner to be as open about our problems as I am about mine.' },
  { id: 'req111', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'deep', text: 'I need my partner to tell me what they appreciate about me out loud.' },
  { id: 'req112', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'deep', text: 'I’d rather be asked once and trusted than reminded repeatedly.' },
  { id: 'req113', category: 'requests', facet: 'asking',     gapWeight: 1, depth: 'deep', text: 'I find it easier to accept a request when I’m given a deadline.' },
  { id: 'req114', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'deep', text: 'I resent being asked for something in front of other people.' },
  { id: 'req115', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'deep', text: 'I want to be consulted before plans involving me are made.' },
  { id: 'req116', category: 'requests', facet: 'directness', gapWeight: 2, depth: 'deep', text: 'I struggle to express what I want because I’m not sure myself.' },
  { id: 'req117', category: 'requests', facet: 'asking',     gapWeight: 2, depth: 'deep', text: 'I’d rather my partner say “I need you to…” than “you should…”' },
  { id: 'req118', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'deep', text: 'Tone matters more to me than the words chosen.' },
  { id: 'req119', category: 'requests', facet: 'feedback',   gapWeight: 2, depth: 'deep', text: 'I want my partner to raise something the first time it bothers them.' },
  { id: 'req120', category: 'requests', facet: 'asking',     gapWeight: 1, depth: 'deep', text: 'I like decisions to be talked through, even small ones.' },

  // ══ Stress & Bad News ══════════════════════════════════════════════════════
  // ── core (25) ──
  { id: 'str001', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'core', text: 'When I get bad news I want to be left alone at first.' },
  { id: 'str002', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'core', text: 'I want to be told bad news immediately, however bad it is.' },
  { id: 'str003', category: 'stress', facet: 'badnews',     gapWeight: 2, depth: 'core', text: 'I’d rather be given bad news gently and gradually.' },
  { id: 'str004', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'When I’m stressed I become quiet and withdrawn.' },
  { id: 'str005', category: 'stress', facet: 'stressStyle', gapWeight: 3, depth: 'core', text: 'When I’m stressed I become irritable and short-tempered.' },
  { id: 'str006', category: 'stress', facet: 'support',     gapWeight: 3, depth: 'core', text: 'I want practical solutions when I’m upset, not sympathy.' },
  { id: 'str007', category: 'stress', facet: 'support',     gapWeight: 3, depth: 'core', text: 'I want to be comforted first and solve the problem later.' },
  { id: 'str008', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'I take on more work when I’m anxious rather than less.' },
  { id: 'str009', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'core', text: 'I want my partner to ask what I need rather than assume.' },
  { id: 'str010', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'core', text: 'I keep bad news from my partner until I’ve worked out what to do about it.' },
  { id: 'str011', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'core', text: 'I’d want to know straight away if my partner was struggling, even if they weren’t ready to talk.' },
  { id: 'str012', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'I recover from a setback quickly.' },
  { id: 'str013', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'core', text: 'I need to talk through a worry several times before it settles.' },
  { id: 'str014', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'core', text: 'Physical touch calms me down when I’m distressed.' },
  { id: 'str015', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'core', text: 'I want to be distracted when things are going badly.' },
  { id: 'str016', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'core', text: 'I’d rather my partner stay calm than match my level of upset.' },
  { id: 'str017', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'I get frustrated when my partner assumes the worst outcome.' },
  { id: 'str018', category: 'stress', facet: 'stressStyle', gapWeight: 1, depth: 'core', text: 'I handle other people’s crises better than my own.' },
  { id: 'str019', category: 'stress', facet: 'badnews',     gapWeight: 1, depth: 'core', text: 'I want to be the one who breaks bad news to the family.' },
  { id: 'str020', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'I keep going as normal when something bad happens rather than pausing.' },
  { id: 'str021', category: 'stress', facet: 'support',     gapWeight: 3, depth: 'core', text: 'I need my partner to check on me repeatedly during a hard week.' },
  { id: 'str022', category: 'stress', facet: 'support',     gapWeight: 3, depth: 'core', text: 'Being asked “are you okay?” repeatedly makes it worse for me.' },
  { id: 'str023', category: 'stress', facet: 'badnews',     gapWeight: 2, depth: 'core', text: 'I want to make big decisions quickly after bad news, not sit with it.' },
  { id: 'str024', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'core', text: 'I’d rather cry in private than in front of my partner.' },
  { id: 'str025', category: 'stress', facet: 'badnews',     gapWeight: 2, depth: 'core', text: 'I want my partner to protect me from stressful details when they can.' },
  // ── deep (18) ──
  { id: 'str101', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'deep', text: 'I sleep badly when something is unresolved between us.' },
  { id: 'str102', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I turn to friends or family before I turn to my partner when I’m struggling.' },
  { id: 'str103', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I want my partner to take something off my plate without asking when I’m overwhelmed.' },
  { id: 'str104', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'deep', text: 'I find it hard to admit when I’m not coping.' },
  { id: 'str105', category: 'stress', facet: 'stressStyle', gapWeight: 1, depth: 'deep', text: 'I get physically unwell when I’m under sustained stress.' },
  { id: 'str106', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'deep', text: 'I want to be told the full picture even when nothing can be done about it.' },
  { id: 'str107', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'deep', text: 'Financial worry affects me more than any other kind.' },
  { id: 'str108', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'deep', text: 'I need routine and structure most when life is chaotic.' },
  { id: 'str109', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I want my partner to make the decisions when I’m overwhelmed.' },
  { id: 'str110', category: 'stress', facet: 'stressStyle', gapWeight: 2, depth: 'deep', text: 'I get angry before I get sad.' },
  { id: 'str111', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I want to be held to my normal responsibilities even when I’m struggling.' },
  { id: 'str112', category: 'stress', facet: 'badnews',     gapWeight: 2, depth: 'deep', text: 'I would rather my partner overstate their optimism than share their fear.' },
  { id: 'str113', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I need to know what the plan is, even a rough one, to feel calm.' },
  { id: 'str114', category: 'stress', facet: 'badnews',     gapWeight: 3, depth: 'deep', text: 'Bad news about my health is something I would want to face together, immediately.' },
  { id: 'str115', category: 'stress', facet: 'badnews',     gapWeight: 2, depth: 'deep', text: 'I go quiet about work stress because I don’t want to bring it home.' },
  { id: 'str116', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I find it steadying when my partner names what I’m feeling.' },
  { id: 'str117', category: 'stress', facet: 'support',     gapWeight: 2, depth: 'deep', text: 'I want my partner to defend me publicly even when I’m in the wrong.' },
  { id: 'str118', category: 'stress', facet: 'stressStyle', gapWeight: 1, depth: 'deep', text: 'I need permission to rest, even from myself.' },

  // ══ Money & Household ══════════════════════════════════════════════════════
  // ── core (30) ──
  { id: 'mny001', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'core', text: 'I check our finances regularly.' },
  { id: 'mny002', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'I’d rather save for security than spend on experiences now.' },
  { id: 'mny003', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'Big purchases should be agreed jointly, however affordable.' },
  { id: 'mny004', category: 'moneyhome', facet: 'planning',   gapWeight: 1, depth: 'core', text: 'I know roughly what we spend each month without looking.' },
  { id: 'mny005', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'core', text: 'I feel guilty spending money on myself.' },
  { id: 'mny006', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'core', text: 'I’d want us to have a shared budget we both stick to.' },
  { id: 'mny007', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'Debt makes me deeply uncomfortable.' },
  { id: 'mny008', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'core', text: 'I’d rather earn more than spend less.' },
  { id: 'mny009', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'I want complete transparency about each other’s spending.' },
  { id: 'mny010', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'I should be free to spend my own money without explaining.' },
  { id: 'mny011', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'core', text: 'I want us to agree a limit above which we consult each other.' },
  { id: 'mny012', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'core', text: 'I find talking about money stressful.' },
  { id: 'mny013', category: 'moneyhome', facet: 'spending',   gapWeight: 1, depth: 'core', text: 'Money is a fair thing to argue about.' },
  { id: 'mny014', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'core', text: 'Whoever earns more should have more say in how it’s spent.' },
  { id: 'mny015', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'core', text: 'I’d rather have less money and more time together.' },
  { id: 'mny016', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'core', text: 'I keep the house tidier than most people would.' },
  { id: 'mny017', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'core', text: 'Mess in shared spaces genuinely bothers me.' },
  { id: 'mny018', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'core', text: 'I do household tasks when I notice them, not on a schedule.' },
  { id: 'mny019', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'core', text: 'I’d rather split chores by preference than divide them evenly.' },
  { id: 'mny020', category: 'moneyhome', facet: 'mentalLoad', gapWeight: 3, depth: 'core', text: 'I carry more of the mental load of running our life than my partner does.' },
  { id: 'mny021', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'core', text: 'I want a written or agreed division of household responsibilities.' },
  { id: 'mny022', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'core', text: 'Being asked to do a chore I was already going to do irritates me.' },
  { id: 'mny023', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'core', text: 'I’d rather pay someone to do a task than argue about who does it.' },
  { id: 'mny024', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'core', text: 'Cooking is something I want us to share.' },
  { id: 'mny025', category: 'moneyhome', facet: 'mentalLoad', gapWeight: 2, depth: 'core', text: 'I notice when things need doing before they become a problem.' },
  { id: 'mny026', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'core', text: 'I’d rather do a task myself than explain how I want it done.' },
  { id: 'mny027', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'core', text: 'Standards of cleanliness are something couples have to compromise on.' },
  { id: 'mny028', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'core', text: 'I want us to plan financially five or more years ahead.' },
  { id: 'mny029', category: 'moneyhome', facet: 'planning',   gapWeight: 3, depth: 'core', text: 'I’d want us to help family members financially if they needed it.' },
  { id: 'mny030', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'core', text: 'How we spend money says a lot about what we value.' },
  // ── deep (20) ──
  { id: 'mny101', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'I’d rather have separate accounts and a shared one for joint costs.' },
  { id: 'mny102', category: 'moneyhome', facet: 'planning',   gapWeight: 3, depth: 'deep', text: 'I would want a prenuptial or formal financial agreement.' },
  { id: 'mny103', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'deep', text: 'I’d feel uncomfortable if my partner earned significantly more than me.' },
  { id: 'mny104', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'deep', text: 'I’d feel uncomfortable if I earned significantly more than my partner.' },
  { id: 'mny105', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'Inherited money should stay with the person who inherited it.' },
  { id: 'mny106', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'I want to retire as early as possible, even on less.' },
  { id: 'mny107', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'deep', text: 'I’d take on debt for a holiday or a wedding.' },
  { id: 'mny108', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'I’d rather rent and stay flexible than own and be tied down.' },
  { id: 'mny109', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'deep', text: 'I want to know exactly what my partner earns.' },
  { id: 'mny110', category: 'moneyhome', facet: 'spending',   gapWeight: 3, depth: 'deep', text: 'I have hidden a purchase from a partner before.' },
  { id: 'mny111', category: 'moneyhome', facet: 'spending',   gapWeight: 2, depth: 'deep', text: 'I want us to give a fixed share of our income to charity or a faith community.' },
  { id: 'mny112', category: 'moneyhome', facet: 'planning',   gapWeight: 1, depth: 'deep', text: 'Our children should be given money rather than made to earn it.' },
  { id: 'mny113', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'I’d rather live somewhere cheaper so we can work less.' },
  { id: 'mny114', category: 'moneyhome', facet: 'mentalLoad', gapWeight: 3, depth: 'deep', text: 'I do more than my share of the invisible admin — appointments, forms, birthdays.' },
  { id: 'mny115', category: 'moneyhome', facet: 'planning',   gapWeight: 1, depth: 'deep', text: 'I’d want us to review our finances together on a set schedule.' },
  { id: 'mny116', category: 'moneyhome', facet: 'chores',     gapWeight: 2, depth: 'deep', text: 'A messy home affects my mood by the end of the day.' },
  { id: 'mny117', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'deep', text: 'I’d rather one of us specialise in a chore than both do it badly.' },
  { id: 'mny118', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'deep', text: 'Guests coming over is what makes me tidy up.' },
  { id: 'mny119', category: 'moneyhome', facet: 'chores',     gapWeight: 1, depth: 'deep', text: 'I want whoever cooks to be excused from cleaning up.' },
  { id: 'mny120', category: 'moneyhome', facet: 'planning',   gapWeight: 2, depth: 'deep', text: 'Financial decisions should be made by whoever is better at them.' },

  // ══ Co-Parenting in Practice ═══════════════════════════════════════════════
  // ── core (30) ──
  { id: 'cop001', category: 'coparent', facet: 'unitedFront', gapWeight: 3, depth: 'core', text: 'We should present a united front to the children even when we disagree.' },
  { id: 'cop002', category: 'coparent', facet: 'unitedFront', gapWeight: 3, depth: 'core', text: 'I’d correct my partner’s parenting in front of the children if I thought they were wrong.' },
  { id: 'cop003', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I’m the more lenient parent.' },
  { id: 'cop004', category: 'coparent', facet: 'discipline',  gapWeight: 3, depth: 'core', text: 'I raise my voice with the children more than I’d like.' },
  { id: 'cop005', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I follow through on consequences I’ve set.' },
  { id: 'cop006', category: 'coparent', facet: 'unitedFront', gapWeight: 3, depth: 'core', text: 'I’d undo a punishment my partner set if I thought it was too harsh.' },
  { id: 'cop007', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'Bedtime and routines should be the same whoever is on duty.' },
  { id: 'cop008', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I’m comfortable being the one who says no.' },
  { id: 'cop009', category: 'coparent', facet: 'unitedFront', gapWeight: 3, depth: 'core', text: 'I need my partner to back me up in the moment, even if we discuss it later.' },
  { id: 'cop010', category: 'coparent', facet: 'unitedFront', gapWeight: 2, depth: 'core', text: 'Children should see their parents disagree and then resolve it.' },
  { id: 'cop011', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I’d rather explain a decision to a child than simply require it.' },
  { id: 'cop012', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I lose patience faster than my partner does.' },
  { id: 'cop013', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'I want us to agree on discipline before a situation arises, not during it.' },
  { id: 'cop014', category: 'coparent', facet: 'childTime',   gapWeight: 3, depth: 'core', text: 'I take on more of the day-to-day child care.' },
  { id: 'cop015', category: 'coparent', facet: 'childTime',   gapWeight: 3, depth: 'core', text: 'I’d want us to split night wakings and early mornings evenly.' },
  { id: 'cop016', category: 'coparent', facet: 'childTime',   gapWeight: 1, depth: 'core', text: 'I want time alone with each child regularly.' },
  { id: 'cop017', category: 'coparent', facet: 'childTime',   gapWeight: 2, depth: 'core', text: 'I need regular time away from the children to be a good parent.' },
  { id: 'cop018', category: 'coparent', facet: 'unitedFront', gapWeight: 2, depth: 'core', text: 'I’d rather take over than watch my partner struggle with the children.' },
  { id: 'cop019', category: 'coparent', facet: 'discipline',  gapWeight: 3, depth: 'core', text: 'I worry my partner is too soft with the children.' },
  { id: 'cop020', category: 'coparent', facet: 'discipline',  gapWeight: 3, depth: 'core', text: 'I worry my partner is too hard on the children.' },
  { id: 'cop021', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'core', text: 'Screen time rules should be strictly enforced by both of us.' },
  { id: 'cop022', category: 'coparent', facet: 'schooling',   gapWeight: 2, depth: 'core', text: 'I want us to make schooling decisions jointly and slowly.' },
  { id: 'cop023', category: 'coparent', facet: 'childTime',   gapWeight: 3, depth: 'core', text: 'I would prioritise our relationship over the children when the two conflict.' },
  { id: 'cop024', category: 'coparent', facet: 'unitedFront', gapWeight: 2, depth: 'core', text: 'We should never argue in front of the children.' },
  { id: 'cop025', category: 'coparent', facet: 'childTime',   gapWeight: 2, depth: 'core', text: 'I’d want to keep our own interests and friendships alive while raising children.' },
  { id: 'cop026', category: 'coparent', facet: 'childTime',   gapWeight: 1, depth: 'core', text: 'I want our children to see us being affectionate.' },
  { id: 'cop027', category: 'coparent', facet: 'unitedFront', gapWeight: 3, depth: 'core', text: 'I feel judged by my partner about how I parent.' },
  { id: 'cop028', category: 'coparent', facet: 'origin',      gapWeight: 2, depth: 'core', text: 'I’d want to talk through how we were each raised before deciding how to raise ours.' },
  { id: 'cop029', category: 'coparent', facet: 'inlaws',      gapWeight: 2, depth: 'core', text: 'Grandparents should follow our rules when looking after the children.' },
  { id: 'cop030', category: 'coparent', facet: 'childTime',   gapWeight: 2, depth: 'core', text: 'I’d want date nights protected even in the busiest years.' },
  // ── deep (20) ──
  { id: 'cop101', category: 'coparent', facet: 'schooling',   gapWeight: 2, depth: 'deep', text: 'I’d let a child stay home from school for a mental health day.' },
  { id: 'cop102', category: 'coparent', facet: 'discipline',  gapWeight: 3, depth: 'deep', text: 'I’d want to know everything about my teenager’s life, even at the cost of their privacy.' },
  { id: 'cop103', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'deep', text: 'I’d rather my child be disappointed than uncomfortable telling me the truth.' },
  { id: 'cop104', category: 'coparent', facet: 'unitedFront', gapWeight: 1, depth: 'deep', text: 'I would go to a parenting course with my partner.' },
  { id: 'cop105', category: 'coparent', facet: 'childTime',   gapWeight: 2, depth: 'deep', text: 'I take it personally when my child prefers my partner.' },
  { id: 'cop106', category: 'coparent', facet: 'schooling',   gapWeight: 3, depth: 'deep', text: 'I’d want us to agree a shared line on faith and religion before children arrive.' },
  { id: 'cop107', category: 'coparent', facet: 'unitedFront', gapWeight: 2, depth: 'deep', text: 'I would talk to my child about our arguments afterwards.' },
  { id: 'cop108', category: 'coparent', facet: 'discipline',  gapWeight: 1, depth: 'deep', text: 'I’d rather over-explain to a child than under-explain.' },
  { id: 'cop109', category: 'coparent', facet: 'childTime',   gapWeight: 3, depth: 'deep', text: 'I want my partner to handle the school and admin side, not just the fun side.' },
  { id: 'cop110', category: 'coparent', facet: 'inlaws',      gapWeight: 2, depth: 'deep', text: 'I’d want us to agree how much we tell family about our children’s difficulties.' },
  { id: 'cop111', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'deep', text: 'I would push a child harder than my partner would.' },
  { id: 'cop112', category: 'coparent', facet: 'childTime',   gapWeight: 3, depth: 'deep', text: 'I’d want us to decide together whether one of us steps back from work.' },
  { id: 'cop113', category: 'coparent', facet: 'childTime',   gapWeight: 2, depth: 'deep', text: 'I need my partner to notice when I’m at my limit with the children.' },
  { id: 'cop114', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'deep', text: 'I’d want the same rules for all our children, regardless of temperament.' },
  { id: 'cop115', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'deep', text: 'I’d rather my child struggle now than be rescued.' },
  { id: 'cop116', category: 'coparent', facet: 'unitedFront', gapWeight: 2, depth: 'deep', text: 'I would let my partner parent their own way when I’m not there.' },
  { id: 'cop117', category: 'coparent', facet: 'childTime',   gapWeight: 1, depth: 'deep', text: 'I want us to talk about the children after they’re in bed, not during.' },
  { id: 'cop118', category: 'coparent', facet: 'unitedFront', gapWeight: 1, depth: 'deep', text: 'I would apologise to my child in front of my partner.' },
  { id: 'cop119', category: 'coparent', facet: 'discipline',  gapWeight: 2, depth: 'deep', text: 'I’d want to protect one child’s needs even if it seems unfair to the others.' },
  { id: 'cop120', category: 'coparent', facet: 'unitedFront', gapWeight: 1, depth: 'deep', text: 'I want us to review how we’re doing as parents, not just as a couple.' },

  // ══ Family & In-Laws ═══════════════════════════════════════════════════════
  // ── core (30) ──
  { id: 'kin001', category: 'kin', facet: 'origin',     gapWeight: 2, depth: 'core', text: 'I’m close to my parents and speak to them often.' },
  { id: 'kin002', category: 'kin', facet: 'inlaws',     gapWeight: 2, depth: 'core', text: 'My family’s opinion of my partner matters a great deal to me.' },
  { id: 'kin003', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'core', text: 'My partner should come before my parents in every decision.' },
  { id: 'kin004', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'core', text: 'I’d defend my partner to my family, even when my family had a point.' },
  { id: 'kin005', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I’d defend my family to my partner.' },
  { id: 'kin006', category: 'kin', facet: 'inlaws',     gapWeight: 2, depth: 'core', text: 'I find my family exhausting in large doses.' },
  { id: 'kin007', category: 'kin', facet: 'holidays',   gapWeight: 3, depth: 'core', text: 'I want us to spend major holidays with my family.' },
  { id: 'kin008', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'core', text: 'I’d be happy to alternate holidays between our two families.' },
  { id: 'kin009', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'core', text: 'I’d want to live near my parents.' },
  { id: 'kin010', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'core', text: 'I’d move far from family for the right opportunity.' },
  { id: 'kin011', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'core', text: 'I tell my family things about our relationship that my partner might not want shared.' },
  { id: 'kin012', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I’d want us to agree what stays private between us.' },
  { id: 'kin013', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'core', text: 'I would help my parents financially if they needed it.' },
  { id: 'kin014', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'core', text: 'I expect to care for a parent in old age, possibly in our home.' },
  { id: 'kin015', category: 'kin', facet: 'inlaws',     gapWeight: 2, depth: 'core', text: 'I’d want my partner to have their own relationship with my family, not one that runs through me.' },
  { id: 'kin016', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'Unannounced visits from family are fine with me.' },
  { id: 'kin017', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I need my partner to handle their own family’s difficult conversations.' },
  { id: 'kin018', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I find it hard to say no to my family.' },
  { id: 'kin019', category: 'kin', facet: 'origin',     gapWeight: 2, depth: 'core', text: 'My upbringing shapes how I behave in this relationship more than I’d like.' },
  { id: 'kin020', category: 'kin', facet: 'origin',     gapWeight: 1, depth: 'core', text: 'I’d want us to talk about what we’re each repeating from our parents’ relationship.' },
  { id: 'kin021', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'core', text: 'I’d cut contact with a family member who disrespected my partner.' },
  { id: 'kin022', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'core', text: 'Family traditions matter enough to me that I’d want to keep them.' },
  { id: 'kin023', category: 'kin', facet: 'inlaws',     gapWeight: 2, depth: 'core', text: 'I’d want our children to have a close relationship with both sets of grandparents.' },
  { id: 'kin024', category: 'kin', facet: 'holidays',   gapWeight: 3, depth: 'core', text: 'I resent how much time we spend with one side of the family.' },
  { id: 'kin025', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I’d want us to set clear boundaries with family together.' },
  { id: 'kin026', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'core', text: 'I’d rather my partner raise an issue with my family than have me do it.' },
  { id: 'kin027', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'core', text: 'My family gives advice about our relationship that I take seriously.' },
  { id: 'kin028', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'core', text: 'I want my partner to attend family events they don’t enjoy.' },
  { id: 'kin029', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'core', text: 'I feel caught between my partner and my family.' },
  { id: 'kin030', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'core', text: 'I’d want us to decide together how much we see each family.' },
  // ── deep (20) ──
  { id: 'kin101', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'deep', text: 'I would tell my parents about a serious problem in our relationship.' },
  { id: 'kin102', category: 'kin', facet: 'inlaws',     gapWeight: 1, depth: 'deep', text: 'A sibling’s opinion of my partner matters to me.' },
  { id: 'kin103', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'deep', text: 'I’d host family for extended stays.' },
  { id: 'kin104', category: 'kin', facet: 'origin',     gapWeight: 2, depth: 'deep', text: 'My family is where I go first in a crisis.' },
  { id: 'kin105', category: 'kin', facet: 'inlaws',     gapWeight: 1, depth: 'deep', text: 'I’d want my partner to call my parents themselves rather than through me.' },
  { id: 'kin106', category: 'kin', facet: 'origin',     gapWeight: 2, depth: 'deep', text: 'I would keep a family estrangement to myself.' },
  { id: 'kin107', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'deep', text: 'I’d want to spend our first holiday as a family just us, with no relatives.' },
  { id: 'kin108', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'deep', text: 'I would let a parent’s disapproval change a decision we’d already made.' },
  { id: 'kin109', category: 'kin', facet: 'inlaws',     gapWeight: 2, depth: 'deep', text: 'I’d want us to agree on how much financial help we give either family.' },
  { id: 'kin110', category: 'kin', facet: 'inlaws',     gapWeight: 1, depth: 'deep', text: 'My partner’s family treats me as one of their own.' },
  { id: 'kin111', category: 'kin', facet: 'origin',     gapWeight: 1, depth: 'deep', text: 'I would go to therapy about my family of origin.' },
  { id: 'kin112', category: 'kin', facet: 'inlaws',     gapWeight: 1, depth: 'deep', text: 'I find my partner’s family easier than my own.' },
  { id: 'kin113', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'deep', text: 'I want us to build our own traditions rather than inherit them.' },
  { id: 'kin114', category: 'kin', facet: 'boundaries', gapWeight: 1, depth: 'deep', text: 'I’d expect my partner to visit my family without me sometimes.' },
  { id: 'kin115', category: 'kin', facet: 'holidays',   gapWeight: 2, depth: 'deep', text: 'I’d want a difficult family member excluded from big occasions.' },
  { id: 'kin116', category: 'kin', facet: 'boundaries', gapWeight: 2, depth: 'deep', text: 'I’d take my partner’s side even when my family is grieving or vulnerable.' },
  { id: 'kin117', category: 'kin', facet: 'boundaries', gapWeight: 3, depth: 'deep', text: 'I want my parents to be involved in our big decisions.' },
  { id: 'kin118', category: 'kin', facet: 'inlaws',     gapWeight: 3, depth: 'deep', text: 'I would move to care for a parent, even at a cost to us.' },
  { id: 'kin119', category: 'kin', facet: 'origin',     gapWeight: 1, depth: 'deep', text: 'I’d want to know my partner’s family history before having children.' },
  { id: 'kin120', category: 'kin', facet: 'origin',     gapWeight: 2, depth: 'deep', text: 'I’ve inherited a way of handling conflict from my parents that I’d like to change.' },
];

export const RELATIONSHIP_QUESTION_MAP: Record<string, RelationshipQuestion> =
  Object.fromEntries(RELATIONSHIP_QUESTIONS.map(q => [q.id, q]));

/** Core-only questions for a category (the ~180 baseline). */
export function coreQuestionsFor(category: RelationshipCategoryKey): RelationshipQuestion[] {
  return RELATIONSHIP_QUESTIONS.filter(q => q.category === category && q.depth === 'core');
}

/** Counts used by the category picker: "Conflict & Repair (35 · +22 deep)". */
export const RELATIONSHIP_DEPTH_COUNTS: Record<RelationshipCategoryKey, { core: number; deep: number }> =
  RELATIONSHIP_CATEGORIES.reduce((acc, c) => {
    const inCat = RELATIONSHIP_QUESTIONS.filter(q => q.category === c.key);
    acc[c.key] = {
      core: inCat.filter(q => q.depth === 'core').length,
      deep: inCat.filter(q => q.depth === 'deep').length,
    };
    return acc;
  }, {} as Record<RelationshipCategoryKey, { core: number; deep: number }>);

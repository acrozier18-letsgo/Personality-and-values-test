import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';
import { DIMENSION_MAP } from '../data/dimensions';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

interface RadarDatum {
  label: string;   // short axis label
  full: string;
  desc: string;
  value: number;
}

function makeData(keys: DimensionKey[], scores: Record<DimensionKey, DimensionScore>, labels: Record<string, string>): RadarDatum[] {
  return keys.map(k => ({
    label: labels[k] ?? k,
    full: DIMENSION_MAP[k]?.label ?? k,
    desc: DIMENSION_MAP[k]?.description ?? '',
    value: scores[k]?.score ?? 50,
  }));
}

const OCEAN_KEYS: DimensionKey[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
const OCEAN_LABELS: Record<string, string> = { openness: 'Openness', conscientiousness: 'Conscientious', extraversion: 'Extraversion', agreeableness: 'Agreeable', neuroticism: 'Neuroticism' };

const SCHWARTZ_KEYS: DimensionKey[] = ['selfDirection', 'stimulation', 'hedonism', 'achievement', 'power', 'security', 'conformity', 'tradition', 'benevolence', 'universalism'];
const SCHWARTZ_LABELS: Record<string, string> = { selfDirection: 'Self-Dir', stimulation: 'Stim', hedonism: 'Hedonism', achievement: 'Achieve', power: 'Power', security: 'Security', conformity: 'Conform', tradition: 'Tradition', benevolence: 'Benevol', universalism: 'Universal' };

const MORAL_KEYS: DimensionKey[] = ['care', 'fairness', 'loyalty', 'authority', 'sanctity', 'liberty'];
const MORAL_LABELS: Record<string, string> = { care: 'Care', fairness: 'Fairness', loyalty: 'Loyalty', authority: 'Authority', sanctity: 'Sanctity', liberty: 'Liberty' };

const FRAMEWORK_INFO: Record<string, string> = {
  'Big Five · OCEAN':
    'The Big Five (OCEAN) — the five broad traits psychologists use to describe most personality variation: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism. Higher means the trait is more strongly expressed. Hover a point for detail.',
  'Schwartz Values':
    "Schwartz's Theory of Basic Human Values — ten motivational values recognised across cultures, from self-direction and achievement to benevolence and tradition. Higher means you emphasised that value more. Hover a point for detail.",
  'Moral Foundations':
    'Moral Foundations Theory (Jonathan Haidt) — the intuitive bases of moral judgement: care, fairness, loyalty, authority, sanctity, and liberty. Higher means that foundation weighs more heavily. Hover a point for detail.',
};

function Radar({ data }: { data: RadarDatum[] }) {
  const S = 230, c = S / 2, R = S * 0.33, LR = S * 0.46, n = data.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (a: number, r: number): [number, number] => [c + r * Math.cos(a), c + r * Math.sin(a)];
  const poly = data.map((d, i) => pt(ang(i), R * d.value / 100).map(v => v.toFixed(1)).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 230, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((f, ri) => (
        <polygon key={`r${ri}`} points={data.map((_, i) => pt(ang(i), R * f).map(v => v.toFixed(1)).join(',')).join(' ')} fill="none" stroke="var(--ring)" strokeWidth={1} />
      ))}
      {data.map((_, i) => { const [x, y] = pt(ang(i), R); return <line key={`a${i}`} x1={c} y1={c} x2={x} y2={y} stroke="var(--spoke)" strokeWidth={1} />; })}
      <polygon points={poly} fill="rgba(182,130,53,.16)" stroke="var(--gold)" strokeWidth={1.5} />
      {data.map((d, i) => { const [x, y] = pt(ang(i), R * d.value / 100); return <circle key={`d${i}`} cx={x} cy={y} r={2.4} fill="var(--gold)" />; })}
      {data.map((d, i) => {
        const [x, y] = pt(ang(i), LR);
        return (
          <text key={`t${i}`} x={x} y={y} fill="#8a8272" fontSize={8.5} fontFamily="Lora" textAnchor={x < c - 3 ? 'end' : x > c + 3 ? 'start' : 'middle'} dominantBaseline="middle">{d.label}</text>
        );
      })}
      {/* invisible hover targets for per-spoke detail */}
      {data.map((d, i) => { const [x, y] = pt(ang(i), R * d.value / 100); return (
        <circle key={`h${i}`} cx={x} cy={y} r={11} fill="transparent">
          <title>{d.full}: {d.value}/100{d.desc ? ` — ${d.desc}` : ''}</title>
        </circle>
      ); })}
    </svg>
  );
}

function RadarCard({ title, data }: { title: string; data: RadarDatum[] }) {
  return (
    <div className="ss-card" style={{ padding: '18px 16px 14px', textAlign: 'center' }}>
      <h4 className="font-display" style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink-3)', margin: '0 0 8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {title}
        <InfoTooltip text={FRAMEWORK_INFO[title] ?? ''} label={`About ${title}`} />
      </h4>
      <Radar data={data} />
    </div>
  );
}

export function RadarPanel({ scores }: Props) {
  return (
    <section aria-label="Trait profiles">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div className="kicker">Instruments</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 0' }}>Trait Profiles</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        <RadarCard title="Big Five · OCEAN" data={makeData(OCEAN_KEYS, scores, OCEAN_LABELS)} />
        <RadarCard title="Schwartz Values" data={makeData(SCHWARTZ_KEYS, scores, SCHWARTZ_LABELS)} />
        <RadarCard title="Moral Foundations" data={makeData(MORAL_KEYS, scores, MORAL_LABELS)} />
      </div>
    </section>
  );
}

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

function makeData(keys: DimensionKey[], scores: Record<DimensionKey, DimensionScore>, labels: Record<string, string>) {
  return keys.map(k => ({
    subject: labels[k] ?? k,
    value: scores[k]?.score ?? 50,
    confidence: scores[k]?.confidence ?? 0,
  }));
}

const OCEAN_KEYS: DimensionKey[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
const OCEAN_LABELS: Record<string, string> = { openness: 'Openness', conscientiousness: 'Conscientious', extraversion: 'Extraversion', agreeableness: 'Agreeable', neuroticism: 'Neuroticism' };

const SCHWARTZ_KEYS: DimensionKey[] = ['selfDirection', 'stimulation', 'hedonism', 'achievement', 'power', 'security', 'conformity', 'tradition', 'benevolence', 'universalism'];
const SCHWARTZ_LABELS: Record<string, string> = { selfDirection: 'Self-Dir', stimulation: 'Stim', hedonism: 'Hedonsim', achievement: 'Achieve', power: 'Power', security: 'Security', conformity: 'Conform', tradition: 'Tradition', benevolence: 'Benovl', universalism: 'Universal' };

const MORAL_KEYS: DimensionKey[] = ['care', 'fairness', 'loyalty', 'authority', 'sanctity', 'liberty'];
const MORAL_LABELS: Record<string, string> = { care: 'Care', fairness: 'Fairness', loyalty: 'Loyalty', authority: 'Authority', sanctity: 'Sanctity', liberty: 'Liberty' };

function RadarCard({ title, data, color }: { title: string; data: ReturnType<typeof makeData>; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col items-center">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <Radar
            name="You"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(val) => [`${val}`, 'Score']}
            contentStyle={{ background: '#1f2937', border: 'none', color: '#f3f4f6', fontSize: 12, borderRadius: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RadarPanel({ scores }: Props) {
  const oceanData    = makeData(OCEAN_KEYS, scores, OCEAN_LABELS);
  const schwartzData = makeData(SCHWARTZ_KEYS, scores, SCHWARTZ_LABELS);
  const moralData    = makeData(MORAL_KEYS, scores, MORAL_LABELS);

  return (
    <section aria-label="Radar charts">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trait Profiles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RadarCard title="Big Five (OCEAN)" data={oceanData} color="#8b5cf6" />
        <RadarCard title="Schwartz Values" data={schwartzData} color="#3b82f6" />
        <RadarCard title="Moral Foundations" data={moralData} color="#10b981" />
      </div>
    </section>
  );
}

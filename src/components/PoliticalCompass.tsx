import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label,
} from 'recharts';
import type { DimensionScore } from '../engine/scoring';
import type { DimensionKey } from '../data/dimensions';

interface Props {
  scores: Record<DimensionKey, DimensionScore>;
}

export function PoliticalCompass({ scores }: Props) {
  const econ   = scores['economicAxis']?.score ?? 0;
  const social = scores['socialAxis']?.score ?? 0;
  const econConf   = scores['economicAxis']?.confidence ?? 0;
  const socialConf = scores['socialAxis']?.confidence ?? 0;
  const lowConf    = econConf < 0.3 || socialConf < 0.3;

  const data = [{ x: econ, y: social, label: 'You' }];

  return (
    <section aria-label="Political Compass" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Political Compass</h2>
      {lowConf && (
        <p className="text-xs text-amber-500 mb-2">
          Low confidence — answer more political questions for an accurate reading.
        </p>
      )}
      <div className="grid grid-cols-2 text-xs text-gray-400 mb-2 px-8">
        <span className="text-left">← Egalitarian / Left</span>
        <span className="text-right">Market / Right →</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" dataKey="x" domain={[-100, 100]} tick={{ fontSize: 10 }}>
            <Label value="Economic Axis" offset={-10} position="insideBottom" style={{ fontSize: 11, fill: '#9ca3af' }} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[-100, 100]} tick={{ fontSize: 10 }}>
            <Label value="Social Axis" angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#9ca3af' }} />
          </YAxis>
          <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1.5} />
          <Scatter data={data} fill="#8b5cf6" r={8} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                  <div>Economic: {d.x > 0 ? '+' : ''}{d.x} ({d.x > 0 ? 'market-leaning' : 'egalitarian-leaning'})</div>
                  <div>Social: {d.y > 0 ? '+' : ''}{d.y} ({d.y > 0 ? 'authoritarian-leaning' : 'libertarian-leaning'})</div>
                </div>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 text-xs text-gray-400 mt-1 px-8">
        <span className="text-center col-span-2">↑ Authoritarian &nbsp;|&nbsp; ↓ Libertarian</span>
      </div>
      {/* Text/table fallback for accessibility */}
      <details className="mt-3">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200">
          Text version
        </summary>
        <table className="text-xs mt-2 w-full">
          <tbody>
            <tr><td className="text-gray-500 pr-4">Economic Axis</td><td className="font-medium">{econ > 0 ? `+${econ} (market-leaning)` : `${econ} (egalitarian-leaning)`}</td></tr>
            <tr><td className="text-gray-500 pr-4">Social Axis</td><td className="font-medium">{social > 0 ? `+${social} (authoritarian-leaning)` : `${social} (libertarian-leaning)`}</td></tr>
          </tbody>
        </table>
      </details>
    </section>
  );
}

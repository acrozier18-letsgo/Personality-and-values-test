import { useMemo, useRef, useState } from 'react';
import { Loader2, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { useStore, versionTakenAt } from '../store/useStore';
import { readAnswersFile } from '../export/profile';
import {
  computeGrowth,
  describeArc,
  movementPhrase,
  MEANINGFUL_DELTA,
  MIN_TREND_CONFIDENCE,
} from '../engine/growth';
import type { DimensionTrend, GrowthResult, Snapshot } from '../engine/growth';
import { generateGrowthReading, SHARED_AI } from '../services/openai';
import type { Answer } from '../engine/scoring';
import { countAnswered } from '../engine/scoring';
import { InfoTooltip } from './InfoTooltip';

// A value-neutral diverging pair: warm for "rose", cool for "fell". Deliberately
// NOT green/red — a rise in Neuroticism is not a failure and a drop in Tradition
// is not a win, and a good/bad palette would say otherwise. Validated for
// contrast and colour-vision separation against this app's parchment surface.
const UP_HUE = '#b68235';
const DOWN_HUE = '#2f6fa8';

const CURRENT_ID = '__current__';

/** Statement-change list: how many to show collapsed, and the hard ceiling. */
const STATEMENT_PREVIEW = 6;
const STATEMENT_CAP = 40;

function toDateInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  // Noon local time, so a timezone shift can never roll the date over a day.
  const ts = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

// ── Movement chart ───────────────────────────────────────────────────────────

interface BarProps {
  trend: DimensionTrend;
  /** Half-width of the plot in score points, so bars share one scale. */
  scale: number;
  hovered: boolean;
  onHover: (key: string | null) => void;
}

/**
 * One diverging bar: the zero line is the centre, the bar grows left when the
 * score fell and right when it rose. Length encodes magnitude only; the value
 * is direct-laboured at the bar end so identity never rests on colour alone.
 */
function MovementBar({ trend, scale, hovered, onHover }: BarProps) {
  const pct = Math.min(100, (Math.abs(trend.delta) / scale) * 100);
  const rose = trend.delta > 0;
  const hue = rose ? UP_HUE : DOWN_HUE;

  return (
    <div
      style={{ position: 'relative', marginBottom: 10 }}
      onMouseEnter={() => onHover(trend.key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(trend.key)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      aria-label={`${trend.label}: ${trend.from} to ${trend.to}, ${signed(trend.delta)}`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: 12.5,
          color: 'var(--ink-3)',
          marginBottom: 4,
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trend.label}
        </span>
        <span className="tnum" style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>
          {trend.from} → {trend.to}{' '}
          <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{signed(trend.delta)}</span>
        </span>
      </div>

      {/* Plot: hairline zero rule at centre, bar growing to one side. */}
      <div style={{ position: 'relative', height: 8, display: 'flex' }}>
        <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end' }}>
          {!rose && (
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: hue,
                borderRadius: '4px 0 0 4px',
                opacity: hovered ? 1 : 0.9,
              }}
            />
          )}
        </div>
        {/* Zero rule — a hairline one shade off the surface, so bars read as
            growing out of an axis rather than floating. */}
        <div
          aria-hidden
          style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: 'var(--ink-faint-3)' }}
        />
        <div style={{ width: '50%' }}>
          {rose && (
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: hue,
                borderRadius: '0 4px 4px 0',
                opacity: hovered ? 1 : 0.9,
              }}
            />
          )}
        </div>
      </div>

      {hovered && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 5,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            padding: '9px 11px',
            background: 'var(--ground)',
            border: '1px solid var(--card-border)',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(32,31,29,.10)',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
          }}
        >
          <strong style={{ color: 'var(--ink)' }}>{trend.label}</strong> {movementPhrase(trend)} by{' '}
          <span className="tnum">{Math.abs(trend.delta)}</span> points.
          <div style={{ color: 'var(--ink-muted)', marginTop: 3 }}>{trend.description}</div>
        </div>
      )}
    </div>
  );
}

// ── Sparkline (small multiples, one series each — no legend needed) ──────────

function Sparkline({ trend }: { trend: DimensionTrend }) {
  const pts = trend.points;
  const W = 132;
  const H = 34;
  // Bipolar scores run −100..100, unipolar 0..100 — plot each on its own domain.
  const lo = trend.type === 'bipolar' ? -100 : 0;
  const span = trend.type === 'bipolar' ? 200 : 100;
  const x = (i: number) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W);
  const y = (score: number) => H - ((score - lo) / span) * H;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--card-border)', borderRadius: 6, background: 'var(--tint-gold)' }}>
      <div
        className="font-display"
        style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 6 }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trend.label}</span>
        <span className="tnum" style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>{signed(trend.delta)}</span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', height: H, overflow: 'visible' }}
        role="img"
        aria-label={`${trend.label} across ${pts.length} snapshots, ending at ${last.score}`}
      >
        <path d={d} fill="none" stroke={trend.delta >= 0 ? UP_HUE : DOWN_HUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Endpoint marker with a surface ring so it reads over the line. */}
        <circle cx={x(pts.length - 1)} cy={y(last.score)} r={3.5} fill={trend.delta >= 0 ? UP_HUE : DOWN_HUE} stroke="var(--tint-gold)" strokeWidth={2} />
      </svg>
    </div>
  );
}

// ── Snapshot row ─────────────────────────────────────────────────────────────

interface RowProps {
  snapshot: Snapshot;
  answeredCount: number;
  onDate: (id: string, ts: number) => void;
  onDelete: (id: string) => void;
}

function SnapshotRow({ snapshot, answeredCount, onDate, onDelete }: RowProps) {
  const isCurrent = snapshot.id === CURRENT_ID;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 12px',
        border: '1px solid var(--card-border)',
        borderRadius: 6,
        background: isCurrent ? 'var(--tint-gold-2)' : 'var(--tint-gold)',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="font-display" style={{ fontSize: 15.5, color: 'var(--ink-3)' }}>
          {snapshot.label}
          {snapshot.source === 'imported' && (
            <span className="ss-chip" style={{ fontSize: 10, marginLeft: 8, padding: '1px 7px' }}>uploaded</span>
          )}
          {isCurrent && (
            <span className="ss-chip" style={{ fontSize: 10, marginLeft: 8, padding: '1px 7px' }}>in progress</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-muted-2)', marginTop: 2 }}>
          {answeredCount} answered
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isCurrent ? (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDate(snapshot.takenAt)}</span>
        ) : (
          <input
            type="date"
            className="ss-input"
            aria-label={`Date these answers were given for ${snapshot.label}`}
            value={toDateInput(snapshot.takenAt)}
            onChange={(e) => {
              const ts = fromDateInput(e.target.value);
              if (ts != null) onDate(snapshot.id, ts);
            }}
            style={{ fontSize: 12, padding: '4px 8px', width: 145 }}
          />
        )}
        {!isCurrent && (
          <button
            className="ss-topbtn"
            aria-label={`Remove ${snapshot.label} from the timeline`}
            title="Remove this snapshot"
            onClick={() => onDelete(snapshot.id)}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  /** The answers currently in progress, offered as the newest point on the arc. */
  answers: Record<string, Answer>;
}

export function GrowthTimeline({ answers }: Props) {
  const versions = useStore((s) => s.versions);
  const addVersionFromImport = useStore((s) => s.addVersionFromImport);
  const setVersionDate = useStore((s) => s.setVersionDate);
  const deleteVersion = useStore((s) => s.deleteVersion);
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAllStatements, setShowAllStatements] = useState(false);

  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const canGenerate = Boolean(apiKey.trim()) || SHARED_AI;

  const currentAnswered = countAnswered(answers);
  // The live snapshot is dated when the answers were last touched — real data,
  // and stable across re-renders in a way that a wall-clock read is not. The
  // mount-time fallback only covers answer sets saved before that was tracked.
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const [mountedAt] = useState(() => Date.now());
  const currentTakenAt = lastSavedAt ?? mountedAt;

  const snapshots: Snapshot[] = useMemo(() => {
    const fromVersions: Snapshot[] = versions.map((v) => ({
      id: v.id,
      label: v.label,
      takenAt: versionTakenAt(v),
      source: v.source === 'imported' ? 'imported' : 'saved',
      answers: v.answers,
    }));
    if (currentAnswered > 0) {
      fromVersions.push({
        id: CURRENT_ID,
        label: 'Today — your current answers',
        takenAt: currentTakenAt,
        source: 'current',
        answers,
      });
    }
    return fromVersions;
  }, [versions, answers, currentAnswered, currentTakenAt]);

  const growth: GrowthResult | null = useMemo(
    () => computeGrowth(snapshots, fromId ?? undefined, toId ?? undefined),
    [snapshots, fromId, toId],
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked twice
    if (!file) return;
    setError(null);
    try {
      const payload = await readAnswersFile(file);
      const name = file.name.replace(/\.json$/i, '').replace(/^selfscape-answers-/, '');
      addVersionFromImport(payload, {
        label: `Uploaded · ${name}`,
        takenAt: payload.exportedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  async function handleReading() {
    if (!growth) return;
    setLoadingReading(true);
    setReadingError(null);
    try {
      setReading(await generateGrowthReading(apiKey, growth));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setReadingError(
        msg.includes('401')
          ? 'Invalid API key — check and try again.'
          : msg.includes('429')
            ? 'Rate limited — wait a moment and try again.'
            : `Error: ${msg}`,
      );
    } finally {
      setLoadingReading(false);
    }
  }

  const arc = growth ? describeArc(growth) : [];
  const shown = growth ? (growth.movements.length ? growth.movements : growth.anchors).slice(0, 14) : [];
  const scale = Math.max(20, ...shown.map((t) => Math.abs(t.delta)));
  const sparkable = growth && growth.snapshots.length >= 3 ? growth.movements.slice(0, 6) : [];
  const statements = growth?.changedStatements ?? [];
  const visibleStatements = showAllStatements
    ? statements.slice(0, STATEMENT_CAP)
    : statements.slice(0, STATEMENT_PREVIEW);

  return (
    <section aria-label="Growth over time" className="ss-card" style={{ padding: '26px 28px' }}>
      <div className="kicker">Over time</div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>Your Arc</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 20px', maxWidth: 640 }}>
        A portrait is a snapshot; a person is a sequence of them. Upload answer files you saved in the
        past — or save a version now and come back in six months — and this panel re-scores every
        snapshot with the same engine to show what moved, what held, and what you changed your mind
        about. Movement is not progress or decline; it is just movement.
      </p>

      {/* Timeline points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {snapshots.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
            No snapshots yet. Save a version from the panel above, or upload an answers file you exported
            earlier.
          </p>
        )}
        {[...snapshots]
          .sort((a, b) => b.takenAt - a.takenAt)
          .map((s) => (
            <SnapshotRow
              key={s.id}
              snapshot={s}
              answeredCount={countAnswered(s.answers)}
              onDate={setVersionDate}
              onDelete={deleteVersion}
            />
          ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <button
          className="ss-cta ss-cta-secondary"
          onClick={() => fileRef.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <Upload size={14} /> Upload a past answers file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: 12, color: 'var(--ink-muted-2)' }}>
          Dated by the file&apos;s export stamp — correct any date above if it&apos;s wrong.
        </span>
      </div>

      {error && <p style={{ fontSize: 13, color: 'var(--no)', marginBottom: 12 }}>{error}</p>}

      {!growth ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          Two snapshots taken at different times are needed to draw an arc. You have{' '}
          {snapshots.length === 1 ? 'one' : String(snapshots.length)}.
        </p>
      ) : (
        <>
          {/* Endpoints */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 190 }}>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 6 }}>From</div>
              <select
                className="ss-sel"
                aria-label="Compare from"
                value={growth.from.id}
                onChange={(e) => setFromId(e.target.value)}
                style={{ width: '100%' }}
              >
                {growth.snapshots.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} · {formatDate(s.takenAt)}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: 18, color: 'var(--ink-faint)', paddingBottom: 8 }}>→</div>
            <div style={{ flex: 1, minWidth: 190 }}>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 6 }}>To</div>
              <select
                className="ss-sel"
                aria-label="Compare to"
                value={growth.to.id}
                onChange={(e) => setToId(e.target.value)}
                style={{ width: '100%' }}
              >
                {growth.snapshots.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} · {formatDate(s.takenAt)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Headline stat — the number IS the chart here. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ textAlign: 'center', minWidth: 130 }}>
              <div className="font-display tnum" style={{ fontSize: 56, lineHeight: 1, color: 'var(--gold-deep)' }}>
                {growth.continuity}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
                stayed the same
                <InfoTooltip
                  align="left"
                  label="About continuity"
                  text={`How close your two snapshots sit across every trait measured well enough in both (at least ${Math.round(MIN_TREND_CONFIDENCE * 100)}% of that trait's questions answered on each side). 100% would be an identical portrait.`}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arc.map((line, i) => (
                <p key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{line}</p>
              ))}
            </div>
          </div>

          {/* Movement chart */}
          {shown.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h3 className="font-display" style={{ fontSize: 18, color: 'var(--ink-3)', margin: 0 }}>
                  {growth.movements.length ? 'What moved' : 'Steadiest traits'}
                </h3>
                {/* Legend — required whenever two colours carry meaning. */}
                <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: UP_HUE }} /> rose
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: DOWN_HUE }} /> fell
                  </span>
                </div>
              </div>
              {shown.map((t) => (
                <MovementBar key={t.key} trend={t} scale={scale} hovered={hovered === t.key} onHover={setHovered} />
              ))}
              <p style={{ fontSize: 11.5, color: 'var(--ink-muted-2)', margin: '10px 0 0', lineHeight: 1.5 }}>
                Traits shift by a few points just from mood and wording, so anything under{' '}
                {MEANINGFUL_DELTA} points is treated as noise. Traits you didn&apos;t answer enough of in
                both snapshots are left out entirely — {growth.comparableCount} of{' '}
                {growth.trends.length} qualified here.
              </p>
            </div>
          )}

          {/* Small multiples — only once there's a real sequence to draw. */}
          {sparkable.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 className="font-display" style={{ fontSize: 18, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                The path, not just the endpoints
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
                Each line runs across all {growth.snapshots.length} snapshots, oldest to newest.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                {sparkable.map((t) => <Sparkline key={t.key} trend={t} />)}
              </div>
            </div>
          )}

          {/* Statement-level changes */}
          {statements.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 className="font-display" style={{ fontSize: 18, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                You changed your mind
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
                {statements.length} statement{statements.length === 1 ? '' : 's'} you answered differently,
                furthest travelled first
                {statements.length > STATEMENT_CAP ? ` — the ${STATEMENT_CAP} biggest shifts are listed` : ''}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleStatements.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--card-border)',
                      borderRadius: 6,
                      background: 'var(--tint-gold)',
                    }}
                  >
                    <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>“{s.text}”</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 5 }}>
                      {s.categoryLabel} · {s.fromLabel} <span aria-hidden>→</span>{' '}
                      <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{s.toLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
              {statements.length > STATEMENT_PREVIEW && (
                <button
                  className="ss-link"
                  onClick={() => setShowAllStatements((v) => !v)}
                  style={{ fontSize: 12.5, marginTop: 10 }}
                >
                  {showAllStatements
                    ? 'Show fewer'
                    : `Show more — ${Math.min(STATEMENT_CAP, statements.length)} in total`}
                </button>
              )}
            </div>
          )}

          {/* AI reading */}
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 18 }}>
            <h3 className="font-display" style={{ fontSize: 18, color: 'var(--ink-3)', margin: '0 0 4px' }}>
              Read my arc
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: '0 0 12px', maxWidth: 560 }}>
              A written reflection on what this movement might mean — for thinking with, not a diagnosis.
            </p>
            {!SHARED_AI && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, maxWidth: 420 }}>
                <input
                  className="ss-input"
                  type={showKey ? 'text' : 'password'}
                  placeholder="OpenAI API key (sk-…)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1, fontSize: 13 }}
                  aria-label="OpenAI API key"
                />
                <button
                  className="ss-topbtn"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
            <button
              className="ss-cta ss-cta-primary"
              onClick={handleReading}
              disabled={!canGenerate || loadingReading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {loadingReading && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {loadingReading ? 'Reading…' : reading ? 'Regenerate reading' : 'Generate reading'}
            </button>
            {readingError && <p style={{ fontSize: 12.5, color: 'var(--no)', marginTop: 10 }}>{readingError}</p>}
            {reading && (
              <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                {reading}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

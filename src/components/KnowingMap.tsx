import { useMemo, useRef, useState } from 'react';
import { Upload, RotateCcw, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { readAnswersFile } from '../export/profile';
import { decodeProfile } from '../engine/shareCode';
import {
  scoreKnowingMap,
  availableItemCount,
  ACCURACY_THRESHOLD,
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  CONFIDENCE_VALUES,
  DEFAULT_ROUND_SIZE,
  MIN_ROUND_SIZE,
  QUADRANTS,
} from '../engine/knowingMap';
import type {
  Confidence,
  KnowingMapResult,
  Quadrant,
  QuadrantMeta,
  ScoredPrediction,
} from '../engine/knowingMap';
import { ALL_QUESTION_MAP } from '../data/allQuestions';
import type { Answer } from '../engine/scoring';
import { InfoTooltip } from './InfoTooltip';

// Same order and hues the quiz uses, so predicting feels like answering.
const OPTIONS: { value: Answer; label: string; color: string }[] = [
  { value: 'strongly_agree', label: 'Strongly Agree', color: '#2f7d54' },
  { value: 'agree', label: 'Agree', color: '#5a9b72' },
  { value: 'no_opinion', label: 'No Opinion', color: '#8a857a' },
  { value: 'disagree', label: 'Disagree', color: '#c26a54' },
  { value: 'strongly_disagree', label: 'Strongly Disagree', color: '#b23b3b' },
];

const ROUND_SIZES = [10, 20, 30];

// The one quadrant worth emphasising; everything else is recessive by design.
const SPOT_HUE = '#b68235';
const DOT_HUE = '#6f6a60';

const QUADRANT_TINT: Record<Quadrant, string> = {
  real_knowledge: 'rgba(47, 111, 168, 0.07)',
  blind_spot: 'rgba(182, 130, 53, 0.14)',
  quiet_intuition: 'rgba(32, 31, 29, 0.035)',
  humble_gap: 'transparent',
};

// ── Plot geometry ────────────────────────────────────────────────────────────

const VB_W = 560;
const VB_H = 404;
const X0 = 104;
const X1 = 546;
const Y0 = 34;
const Y1 = 330;
const PLOT_W = X1 - X0;
const PLOT_H = Y1 - Y0;

/** Agreement runs 1 (exact) at the top to 0 (opposite) at the bottom. */
const AGREEMENT_TICKS: { value: number; label: string }[] = [
  { value: 1, label: 'Exact' },
  { value: 0.75, label: '1 step off' },
  { value: 0.5, label: '2 steps' },
  { value: 0.25, label: '3 steps' },
  { value: 0, label: 'Opposite' },
];

/**
 * Vertical inset between the frame and the outermost row of dots. The extreme
 * rows ("Exact" and "Opposite") would otherwise sit on the frame line and run
 * into the quadrant labels.
 */
const Y_PAD = 40;
const DATA_TOP = Y0 + Y_PAD;
const DATA_H = PLOT_H - Y_PAD * 2;

const px = (confidenceValue: number) => X0 + confidenceValue * PLOT_W;
const py = (agreement: number) => DATA_TOP + (1 - agreement) * DATA_H;

const X_DIVIDER = px(0.5);
// Sits between "1 step off" and "2 steps" — exactly where the threshold is.
const Y_DIVIDER = py((ACCURACY_THRESHOLD + 0.5) / 2);

/**
 * Both axes are discrete (4 confidence levels × 5 answer distances), so items
 * collide on exactly 20 possible points. Lay each cell's items out in a tidy
 * centred grid rather than jittering them randomly.
 */
/**
 * Spacing between dots packed into one cell, and the radius of each dot's
 * invisible hit target. HIT_R must stay below CELL_GAP: a hit circle wider than
 * the spacing swallows its neighbour's centre, and that dot becomes impossible
 * to hover. Five packed rows at this gap still fit inside one cell's height.
 */
const CELL_GAP = 12;
const HIT_R = 10;

function cellOffsets(n: number): { dx: number; dy: number }[] {
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / cols);
  const gap = CELL_GAP;
  return Array.from({ length: n }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    return {
      dx: (col - (inRow - 1) / 2) * gap,
      dy: (row - (rows - 1) / 2) * gap,
    };
  });
}

interface PlacedDot {
  s: ScoredPrediction;
  x: number;
  y: number;
}

function placeDots(scored: ScoredPrediction[]): PlacedDot[] {
  const cells = new Map<string, ScoredPrediction[]>();
  for (const s of scored) {
    const key = `${s.confidence}:${s.agreement}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(s);
    else cells.set(key, [s]);
  }
  const out: PlacedDot[] = [];
  for (const bucket of cells.values()) {
    const offsets = cellOffsets(bucket.length);
    bucket.forEach((s, i) => {
      out.push({
        s,
        x: px(s.confidenceValue) + offsets[i].dx,
        y: py(s.agreement) + offsets[i].dy,
      });
    });
  }
  // Blind spots drawn last so their ring sits over neighbouring dots.
  return out.sort((a, b) => Number(a.s.quadrant === 'blind_spot') - Number(b.s.quadrant === 'blind_spot'));
}

/**
 * Just the quadrant's name — the axes already say what "sure" and "close" mean,
 * and the tally cards under the plot repeat the "sure, and wrong" gloss.
 */
function QuadrantLabel({ x, y, anchor, meta, emphasis }: {
  x: number; y: number; anchor: 'start' | 'end'; meta: QuadrantMeta; emphasis?: boolean;
}) {
  return (
    <text
      x={x} y={y} textAnchor={anchor}
      fill={emphasis ? SPOT_HUE : 'var(--ink-muted)'}
      fontFamily="Cormorant Garamond, serif" fontSize="16" fontWeight="600"
    >
      {meta.label}
    </text>
  );
}

function Plot({ result, subject }: { result: KnowingMapResult; subject: string }) {
  const [hover, setHover] = useState<PlacedDot | null>(null);
  const dots = useMemo(() => placeDots(result.scored), [result]);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={`Knowing Map: ${result.answered} predictions about ${subject}, plotted by how sure you were against how close you got. ${result.quadrants.blind_spot.length} landed in the blind-spot quadrant.`}
      >
        {/* Quadrant grounds */}
        <rect x={X0} y={Y0} width={X_DIVIDER - X0} height={Y_DIVIDER - Y0} fill={QUADRANT_TINT.quiet_intuition} />
        <rect x={X_DIVIDER} y={Y0} width={X1 - X_DIVIDER} height={Y_DIVIDER - Y0} fill={QUADRANT_TINT.real_knowledge} />
        <rect x={X0} y={Y_DIVIDER} width={X_DIVIDER - X0} height={Y1 - Y_DIVIDER} fill={QUADRANT_TINT.humble_gap} />
        <rect x={X_DIVIDER} y={Y_DIVIDER} width={X1 - X_DIVIDER} height={Y1 - Y_DIVIDER} fill={QUADRANT_TINT.blind_spot} />

        {/* Frame, dividers and hairline gridlines at every real tick */}
        <rect x={X0} y={Y0} width={PLOT_W} height={PLOT_H} fill="none" stroke="var(--ring)" strokeWidth="1" />
        {AGREEMENT_TICKS.map((t) => (
          <g key={t.value}>
            <line x1={X0} y1={py(t.value)} x2={X1} y2={py(t.value)} stroke="var(--spoke)" strokeWidth="1" />
            <text
              x={X0 - 12} y={py(t.value) + 4} textAnchor="end"
              fill="var(--ink-muted-2)" fontFamily="Lora, serif" fontSize="11"
            >
              {t.label}
            </text>
          </g>
        ))}
        <line x1={X_DIVIDER} y1={Y0} x2={X_DIVIDER} y2={Y1} stroke="var(--ink-faint-3)" strokeWidth="1" />
        <line x1={X0} y1={Y_DIVIDER} x2={X1} y2={Y_DIVIDER} stroke="var(--ink-faint-3)" strokeWidth="1" />

        {/* Quadrant names, in the padding bands above and below the data */}
        <QuadrantLabel x={X0 + 12} y={Y0 + 24} anchor="start" meta={QUADRANTS.quiet_intuition} />
        <QuadrantLabel x={X1 - 12} y={Y0 + 24} anchor="end" meta={QUADRANTS.real_knowledge} />
        <QuadrantLabel x={X0 + 12} y={Y1 - 14} anchor="start" meta={QUADRANTS.humble_gap} />
        <QuadrantLabel x={X1 - 12} y={Y1 - 14} anchor="end" meta={QUADRANTS.blind_spot} emphasis />

        {/* Confidence ticks */}
        {CONFIDENCE_LEVELS.map((c) => (
          <text
            key={c}
            x={px(CONFIDENCE_VALUES[c])} y={Y1 + 22} textAnchor="middle"
            fill="var(--ink-muted-2)" fontFamily="Lora, serif" fontSize="11"
          >
            {CONFIDENCE_LABELS[c]}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={X0 + PLOT_W / 2} y={Y1 + 52} textAnchor="middle"
          fill="var(--ink-muted)" fontFamily="Cormorant Garamond, serif" fontSize="13" letterSpacing="1.2"
        >
          HOW SURE YOU WERE →
        </text>
        <text
          x={26} y={Y0 + PLOT_H / 2} textAnchor="middle"
          fill="var(--ink-muted)" fontFamily="Cormorant Garamond, serif" fontSize="13" letterSpacing="1.2"
          transform={`rotate(-90 26 ${Y0 + PLOT_H / 2})`}
        >
          HOW CLOSE YOU GOT →
        </text>

        {/* Dots */}
        {dots.map((d) => {
          const spot = d.s.quadrant === 'blind_spot';
          const active = hover?.s.question.id === d.s.question.id;
          return (
            <g
              key={d.s.question.id}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <title>{`${d.s.question.text} — you said ${d.s.predictedLabel}, they said ${d.s.actualLabel}`}</title>
              {/* Oversized transparent target so touch and hover are forgiving. */}
              <circle cx={d.x} cy={d.y} r={HIT_R} fill="transparent" />
              <circle
                cx={d.x}
                cy={d.y}
                r={spot ? 5.5 : 4.5}
                fill={spot ? SPOT_HUE : DOT_HUE}
                stroke="var(--ground)"
                strokeWidth={2}
                opacity={active ? 1 : spot ? 0.95 : 0.75}
              />
              {active && (
                <circle cx={d.x} cy={d.y} r={11} fill="none" stroke={spot ? SPOT_HUE : DOT_HUE} strokeWidth={1} />
              )}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(hover.x / VB_W) * 100}%`,
            top: `${(hover.y / VB_H) * 100}%`,
            transform: hover.x > VB_W / 2 ? 'translate(-104%, -50%)' : 'translate(4%, -50%)',
            width: 'min(260px, 46%)',
            padding: '10px 12px',
            background: 'var(--ground)',
            border: '1px solid var(--card-border)',
            borderRadius: 6,
            boxShadow: '0 6px 20px rgba(32,31,29,.13)',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <div style={{ color: 'var(--ink)', marginBottom: 6 }}>“{hover.s.question.text}”</div>
          <div style={{ color: 'var(--ink-muted)' }}>
            You guessed <strong style={{ color: 'var(--ink-3)' }}>{hover.s.predictedLabel}</strong>,{' '}
            {CONFIDENCE_LABELS[hover.s.confidence].toLowerCase()}.
          </div>
          <div style={{ color: 'var(--ink-muted)' }}>
            {subject} said <strong style={{ color: 'var(--ink-3)' }}>{hover.s.actualLabel}</strong>.
          </div>
        </div>
      )}

      {/* Only one class is colour-coded, so the legend names just that one. */}
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: SPOT_HUE }} /> blind spot
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: DOT_HUE, opacity: 0.75 }} /> everything else
        </span>
      </div>
    </div>
  );
}

// ── Result list rows ─────────────────────────────────────────────────────────

function PredictionRow({ s, subject, emphasis }: { s: ScoredPrediction; subject: string; emphasis?: boolean }) {
  return (
    <div
      style={{
        padding: '11px 13px',
        border: '1px solid var(--card-border)',
        borderLeft: emphasis ? `3px solid ${SPOT_HUE}` : '1px solid var(--card-border)',
        borderRadius: 6,
        background: emphasis ? 'var(--tint-gold-2)' : 'var(--tint-gold)',
      }}
    >
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>“{s.question.text}”</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 5 }}>
        {s.question.categoryLabel} · you said <strong style={{ color: 'var(--ink-3)' }}>{s.predictedLabel}</strong>{' '}
        ({CONFIDENCE_LABELS[s.confidence].toLowerCase()}) · {subject} said{' '}
        <strong style={{ color: 'var(--ink-3)' }}>{s.actualLabel}</strong>
      </div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

type LoadedSubject = { label: string; answers: Record<string, Answer> } | null;

export function KnowingMap() {
  const knowing = useStore((s) => s.knowing);
  const versions = useStore((s) => s.versions);
  const startKnowing = useStore((s) => s.startKnowing);
  const predict = useStore((s) => s.predict);
  const goToPrediction = useStore((s) => s.goToPrediction);
  const revealKnowing = useStore((s) => s.revealKnowing);
  const clearKnowing = useStore((s) => s.clearKnowing);

  const fileRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState<LoadedSubject>(null);
  const [name, setName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [size, setSize] = useState(DEFAULT_ROUND_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [showAllOf, setShowAllOf] = useState<Quadrant | null>(null);

  const available = subject ? availableItemCount(subject.answers) : 0;

  const result = useMemo(
    () => (knowing ? scoreKnowingMap(knowing.itemIds, knowing.predictions, knowing.actual) : null),
    [knowing],
  );

  function loadSubject(label: string, answers: Record<string, Answer>) {
    const count = availableItemCount(answers);
    if (count < MIN_ROUND_SIZE) {
      setError(
        `That profile only has ${count} answered statement${count === 1 ? '' : 's'} — at least ${MIN_ROUND_SIZE} are needed for a round.`,
      );
      return;
    }
    setError(null);
    setSubject({ label, answers });
    if (!name.trim()) setName(label);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const payload = await readAnswersFile(file);
      loadSubject(file.name.replace(/\.json$/i, ''), payload.answers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  function onLink() {
    const raw = linkInput.trim();
    if (!raw) return;
    // Accept a full share URL or just the bare code.
    const code = raw.includes('/shared/') ? raw.split('/shared/')[1].split(/[?#&]/)[0] : raw;
    const answers = decodeProfile(code);
    if (Object.keys(answers).length === 0) {
      setError("That doesn't look like a Selfscape share link.");
      return;
    }
    loadSubject('Their shared profile', answers);
  }

  function onStart() {
    if (!subject) return;
    startKnowing(name.trim() || subject.label, subject.answers, { size });
  }

  function onPlayAgain() {
    if (!knowing) return;
    const label = knowing.subject;
    if (subject) {
      // Their full profile is still loaded — a fresh seed draws new statements.
      startKnowing(label, subject.answers, { size });
      return;
    }
    // Only the last round's statements were kept, so a new round needs the file again.
    clearKnowing();
    setName(label);
    setError('Load their answers again to play another round — Selfscape only kept the statements from the last one.');
  }

  // ── Phase 1: setup ────────────────────────────────────────────────────────
  if (!knowing) {
    return (
      <section aria-label="The Knowing Map" className="ss-card" style={{ padding: '26px 28px' }}>
        <div className="kicker">Two profiles</div>
        <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>The Knowing Map</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 8px', maxWidth: 640 }}>
          Answer a set of statements <em>as you think they would</em>, saying how sure you are each
          time. We score your guesses against their real answers and plot the two against each other.
        </p>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 20px', maxWidth: 640 }}>
          Being wrong isn&apos;t the interesting part. Being <em>sure</em> and wrong is — those are the
          places you&apos;ve been acting on a picture of someone that isn&apos;t them, and nobody can find
          them alone.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div className="kicker" style={{ fontSize: 12 }}>From a file</div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, minHeight: 40, lineHeight: 1.5 }}>
              Their downloaded answers file.
            </p>
            <button className="ss-cta ss-cta-secondary" onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
              <Upload size={14} /> Upload their answers
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div className="kicker" style={{ fontSize: 12 }}>From a link</div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, minHeight: 40, lineHeight: 1.5 }}>
              Paste the share link they sent you.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="ss-input"
                placeholder="Paste share link…"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onLink(); }}
                style={{ flex: 1, fontSize: 13, minWidth: 0 }}
                aria-label="Their share link"
              />
              <button className="ss-topbtn" onClick={onLink} style={{ fontSize: 12 }}>Load</button>
            </div>
          </div>

          {versions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div className="kicker" style={{ fontSize: 12 }}>From a saved profile</div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, minHeight: 40, lineHeight: 1.5 }}>
                One you already have saved.
              </p>
              <select
                className="ss-sel"
                aria-label="Choose a saved profile"
                defaultValue=""
                onChange={(e) => {
                  const v = versions.find((x) => x.id === e.target.value);
                  if (v) loadSubject(v.label, v.answers);
                }}
              >
                <option value="" disabled>Choose a saved profile…</option>
                {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: 'var(--no)', margin: '0 0 14px' }}>{error}</p>}

        {subject && (
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 6 }}>Whose mind are you reading?</div>
              <input
                className="ss-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Their name"
                style={{ width: '100%', fontSize: 14 }}
                aria-label="Their name"
              />
            </div>
            <div>
              <div className="kicker" style={{ fontSize: 11, marginBottom: 6 }}>Statements</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {ROUND_SIZES.map((n) => (
                  <button
                    key={n}
                    className="ss-topbtn"
                    aria-pressed={size === n}
                    onClick={() => setSize(n)}
                    style={{
                      fontSize: 13,
                      minWidth: 46,
                      borderColor: size === n ? 'var(--gold)' : undefined,
                      color: size === n ? 'var(--gold-deep)' : undefined,
                    }}
                    disabled={n > available}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button className="ss-cta ss-cta-primary" onClick={onStart}>
              Start the round →
            </button>
            <p style={{ fontSize: 12, color: 'var(--ink-muted-2)', margin: 0, flexBasis: '100%' }}>
              {available} of their answered statements to draw from. Their answers stay hidden until you
              reveal &mdash; no peeking.
            </p>
          </div>
        )}
      </section>
    );
  }

  // ── Phase 2: predicting ───────────────────────────────────────────────────
  if (!knowing.revealed) {
    // Bound to a const so the handlers below keep the non-null narrowing.
    const session = knowing;
    const last = session.itemIds.length - 1;
    const idx = Math.min(session.cursor, last);
    const id = session.itemIds[idx];
    const question = ALL_QUESTION_MAP[id];
    const current = session.predictions[id];
    const done = Object.keys(session.predictions).length;
    const pct = Math.round((done / session.itemIds.length) * 100);
    const revealAt = Math.min(MIN_ROUND_SIZE, session.itemIds.length);
    const canReveal = done >= revealAt;

    const choose = (answer: Answer) => predict(id, answer, current?.confidence ?? 3);

    const setConfidence = (c: Confidence) => {
      if (!current) return;
      predict(id, current.answer, c);
      // Both halves set — move along, unless this was the last statement.
      if (idx < last) setTimeout(() => goToPrediction(idx + 1), 180);
    };

    return (
      <section aria-label="The Knowing Map" className="ss-card" style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker">Predicting {session.subject}</div>
            <h2 style={{ fontSize: 26, margin: '4px 0 0' }}>
              Statement {idx + 1} <span style={{ color: 'var(--ink-faint)' }}>of {session.itemIds.length}</span>
            </h2>
          </div>
          <button className="ss-topbtn" onClick={clearKnowing} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <X size={12} /> Abandon round
          </button>
        </div>

        <div style={{ height: 5, borderRadius: 3, background: 'var(--track)', overflow: 'hidden', margin: '14px 0 22px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 3, transition: 'width .25s ease' }} />
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 6px' }}>
          How would <strong style={{ color: 'var(--ink-3)' }}>{session.subject}</strong> answer this?
        </p>
        <p className="font-display" style={{ fontSize: 25, lineHeight: 1.32, color: 'var(--ink)', margin: '0 0 22px' }}>
          “{question?.text ?? 'This statement is no longer available.'}”
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="ss-answer"
              data-sel={current?.answer === opt.value ? '1' : '0'}
              aria-pressed={current?.answer === opt.value}
              style={{ ['--ac' as string]: opt.color, padding: '12px 14px' }}
              onClick={(e) => { choose(opt.value); e.currentTarget.blur(); }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div
          style={{
            opacity: current ? 1 : 0.42,
            pointerEvents: current ? 'auto' : 'none',
            borderTop: '1px solid var(--divider)',
            paddingTop: 16,
            marginBottom: 20,
          }}
        >
          <div className="kicker" style={{ fontSize: 11, marginBottom: 9 }}>
            How sure are you?
            <InfoTooltip
              align="left"
              label="Why confidence matters"
              text="Confidence is half the instrument. Getting something wrong while knowing you were unsure is honest; getting it wrong while certain is the finding worth having."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))', gap: 8 }}>
            {CONFIDENCE_LEVELS.map((c) => (
              <button
                key={c}
                className="ss-topbtn"
                aria-pressed={current?.confidence === c}
                onClick={() => setConfidence(c)}
                style={{
                  fontSize: 13,
                  padding: '9px 6px',
                  borderColor: current?.confidence === c ? 'var(--gold)' : undefined,
                  color: current?.confidence === c ? 'var(--gold-deep)' : undefined,
                  background: current?.confidence === c ? 'var(--tint-gold-2)' : undefined,
                }}
              >
                {CONFIDENCE_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ss-topbtn" onClick={() => goToPrediction(idx - 1)} disabled={idx === 0} style={{ fontSize: 13 }}>← Prev</button>
            <button className="ss-topbtn" onClick={() => goToPrediction(idx + 1)} disabled={idx >= session.itemIds.length - 1} style={{ fontSize: 13 }}>Next →</button>
          </div>
          <button className="ss-cta ss-cta-primary" onClick={revealKnowing} disabled={!canReveal}>
            {canReveal ? `Reveal the map (${done} answered)` : `Answer ${revealAt - done} more to reveal`}
          </button>
        </div>
      </section>
    );
  }

  // ── Phase 3: revealed ─────────────────────────────────────────────────────
  const r = result!;
  const spots = r.blindSpots;
  const listFor = showAllOf ? r.quadrants[showAllOf] : [];

  return (
    <section aria-label="The Knowing Map" className="ss-card" style={{ padding: '26px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="kicker">The Knowing Map</div>
          <h2 style={{ fontSize: 30, margin: '6px 0 0' }}>How well you know {knowing.subject}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ss-topbtn" onClick={onPlayAgain} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={12} /> New round
          </button>
          <button className="ss-topbtn" onClick={clearKnowing} style={{ fontSize: 12 }}>Done</button>
        </div>
      </div>

      {/* Headline figures */}
      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center', margin: '20px 0 24px' }}>
        <div style={{ textAlign: 'center', minWidth: 116 }}>
          <div className="font-display tnum" style={{ fontSize: 52, lineHeight: 1, color: 'var(--gold-deep)' }}>{r.accuracyPct}%</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 4 }}>
            accuracy
            <InfoTooltip
              align="left"
              label="About accuracy"
              text={`How close your guesses landed on average across ${r.answered} statements — a guess one step away still counts as most of the way there. ${r.exactPct}% were exactly right.`}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 116 }}>
          <div className="font-display tnum" style={{ fontSize: 52, lineHeight: 1, color: spots.length ? SPOT_HUE : 'var(--ink-faint)' }}>{spots.length}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 4 }}>blind spot{spots.length === 1 ? '' : 's'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="font-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>{r.calibrationLabel}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{r.calibrationBlurb}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-muted-2)', margin: '6px 0 0' }}>
            Average confidence <span className="tnum">{r.confidencePct}%</span> against accuracy{' '}
            <span className="tnum">{r.accuracyPct}%</span>.
          </p>
        </div>
      </div>

      <Plot result={r} subject={knowing.subject} />

      {/* Blind spots — the headline output */}
      <div style={{ marginTop: 26 }}>
        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          {spots.length ? 'Start the conversation here' : 'No blind spots this round'}
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: '0 0 12px', maxWidth: 620 }}>
          {spots.length
            ? QUADRANTS.blind_spot.blurb
            : `You were never confidently wrong about ${knowing.subject} — everything you got wrong, you already suspected you might. Try a longer round or a different set of statements.`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {spots.slice(0, 6).map((s) => (
            <PredictionRow key={s.question.id} s={s} subject={knowing.subject} emphasis />
          ))}
        </div>
      </div>

      {/* Quadrant tallies, each expandable into its own list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 24 }}>
        {(Object.keys(QUADRANTS) as Quadrant[]).map((q) => {
          const meta = QUADRANTS[q];
          const items = r.quadrants[q];
          const open = showAllOf === q;
          return (
            <button
              key={q}
              onClick={() => setShowAllOf(open ? null : q)}
              aria-expanded={open}
              disabled={items.length === 0}
              style={{
                textAlign: 'left',
                padding: '13px 14px',
                border: `1px solid ${open ? 'var(--gold)' : 'var(--card-border)'}`,
                borderRadius: 6,
                background: q === 'blind_spot' ? 'var(--tint-gold-2)' : 'var(--tint-gold)',
                cursor: items.length ? 'pointer' : 'default',
                opacity: items.length ? 1 : 0.5,
                font: 'inherit',
              }}
            >
              <div className="font-display tnum" style={{ fontSize: 28, lineHeight: 1, color: q === 'blind_spot' ? SPOT_HUE : 'var(--ink-3)' }}>
                {items.length}
              </div>
              <div className="font-display" style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 5 }}>{meta.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted-2)', marginTop: 2 }}>{meta.axis}</div>
            </button>
          );
        })}
      </div>

      {showAllOf && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 10px', maxWidth: 620, lineHeight: 1.6 }}>
            <strong>{QUADRANTS[showAllOf].label}.</strong> {QUADRANTS[showAllOf].blurb}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listFor.map((s) => (
              <PredictionRow key={s.question.id} s={s} subject={knowing.subject} emphasis={showAllOf === 'blind_spot'} />
            ))}
          </div>
        </div>
      )}

      {/* Where your knowledge is thick and thin */}
      {r.byCategory.length > 1 && (
        <div style={{ marginTop: 26 }}>
          <h3 className="font-display" style={{ fontSize: 20, color: 'var(--ink-3)', margin: '0 0 12px' }}>
            Where you know them, and where you don&apos;t
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {r.byCategory.map((c) => (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 3 }}>
                  <span>{c.label} <span style={{ color: 'var(--ink-faint)' }}>({c.count})</span></span>
                  <span className="tnum">{c.pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--track-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--ink-muted-2)', margin: '22px 0 0', lineHeight: 1.55, maxWidth: 640 }}>
        A round is a snapshot of {r.answered} statements, not a verdict on the relationship. People
        change their minds, and a statement answered on a bad day isn&apos;t a secret you missed.
      </p>
    </section>
  );
}

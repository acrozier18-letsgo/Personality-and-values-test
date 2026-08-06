import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  CORE_CATEGORIES,
  OPTIONAL_CATEGORY_METAS,
  RELATIONSHIP_CATEGORY_METAS,
  CATEGORY_COUNTS,
  CATEGORY_DEEP_COUNTS,
} from '../data/categories';
import type { CategoryMeta } from '../data/categories';

function Chip({
  cat,
  on,
  onToggle,
  extra,
}: {
  cat: CategoryMeta;
  on: boolean;
  onToggle: () => void;
  extra?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      title={cat.blurb}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${on ? cat.color : 'var(--card-border)'}`,
        background: on ? `${cat.color}14` : 'transparent',
        color: on ? 'var(--ink-3)' : 'var(--ink-muted)',
        fontSize: 13.5, fontWeight: on ? 600 : 400, transition: 'all .15s',
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? cat.color : 'var(--ink-faint)', flex: 'none' }} />
      {cat.label}{' '}
      <span className="tnum" style={{ opacity: 0.6, fontWeight: 400 }}>
        ({CATEGORY_COUNTS[cat.key]}{extra})
      </span>
    </button>
  );
}

function Shelf({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', letterSpacing: '.04em' }}>{title}</span>
        <button className="ss-link" style={{ fontSize: 12 }} onClick={onAction}>{action}</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </>
  );
}

export function CategorySelector() {
  const navigate = useNavigate();
  const { selectedCategories, toggleCategory, setCategories, deepDive, setDeepDive } = useStore();
  const on = (k: string) => selectedCategories.includes(k);

  const optionalKeys = OPTIONAL_CATEGORY_METAS.map(c => c.key);
  const relationshipKeys = RELATIONSHIP_CATEGORY_METAS.map(c => c.key);
  const allOptionalOn = optionalKeys.every(on);
  const allRelationshipOn = relationshipKeys.every(on);
  const anyRelationshipOn = relationshipKeys.some(on);

  function toggleGroup(keys: string[], allOn: boolean) {
    const without = selectedCategories.filter(k => !keys.includes(k));
    setCategories(allOn ? without : [...without, ...keys]);
  }

  const deepTotal = relationshipKeys
    .filter(on)
    .reduce((n, k) => n + (CATEGORY_DEEP_COUNTS[k] ?? 0), 0);

  return (
    <div className="ss-card" style={{ maxWidth: 640, margin: '20px auto 0', padding: '28px 30px' }}>
      <div className="kicker">Choose your questions</div>
      <p style={{ fontSize: 13, color: 'var(--ink-muted-2)', margin: '6px 0 18px', lineHeight: 1.55 }}>
        Pick the kinds of questions you’d like to answer. The core set builds your persona; the optional
        packs add depth. <strong>The more you answer, the fuller and more shareable your portrait becomes.</strong>
      </p>

      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8, letterSpacing: '.04em' }}>Core assessment</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CORE_CATEGORIES.map(cat => (
          <Chip key={cat.key} cat={cat} on={on(cat.key)} onToggle={() => toggleCategory(cat.key)} />
        ))}
      </div>

      <Shelf
        title="Optional packs"
        action={allOptionalOn ? 'Clear all' : 'Add all'}
        onAction={() => toggleGroup(optionalKeys, allOptionalOn)}
      >
        {OPTIONAL_CATEGORY_METAS.map(cat => (
          <Chip key={cat.key} cat={cat} on={on(cat.key)} onToggle={() => toggleCategory(cat.key)} />
        ))}
      </Shelf>

      <Shelf
        title="Relationship packs — for the Together page"
        action={allRelationshipOn ? 'Clear all' : 'Add all'}
        onAction={() => toggleGroup(relationshipKeys, allRelationshipOn)}
      >
        {RELATIONSHIP_CATEGORY_METAS.map(cat => (
          <Chip
            key={cat.key}
            cat={cat}
            on={on(cat.key)}
            onToggle={() => toggleCategory(cat.key)}
            extra={deepDive ? ` + ${CATEGORY_DEEP_COUNTS[cat.key]}` : ''}
          />
        ))}
      </Shelf>

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 12, lineHeight: 1.55 }}>
        These ask how you <em>actually</em> operate — how you argue, how you take bad news, how you handle
        money, kids and family. They’re what the{' '}
        <button className="ss-link" style={{ fontSize: 12 }} onClick={() => navigate('/together')}>Together page</button>{' '}
        compares when you and a partner both answer them.
      </p>

      {anyRelationshipOn && (
        <label
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14,
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${deepDive ? 'var(--gold)' : 'var(--card-border)'}`,
            background: deepDive ? 'var(--tint-gold)' : 'transparent',
          }}
        >
          <input
            type="checkbox"
            checked={deepDive}
            onChange={e => setDeepDive(e.target.checked)}
            style={{ marginTop: 3, flex: 'none' }}
          />
          <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)' }}>
            <strong>Go deeper</strong> — add {deepTotal || 120} further questions across the relationship packs
            you’ve chosen. Slower to complete, but it gives the Together report far more to work with.
          </span>
        </label>
      )}

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 14, lineHeight: 1.5 }}>
        Optional answers are saved to your profile and included in your exportable summary.
      </p>
    </div>
  );
}

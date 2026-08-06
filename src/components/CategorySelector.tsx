import { useStore } from '../store/useStore';
import { CORE_CATEGORIES, OPTIONAL_CATEGORY_METAS, CATEGORY_COUNTS } from '../data/categories';
import type { CategoryMeta } from '../data/categories';

function Chip({ cat, on, onToggle }: { cat: CategoryMeta; on: boolean; onToggle: () => void }) {
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
      {cat.label} <span className="tnum" style={{ opacity: 0.6, fontWeight: 400 }}>({CATEGORY_COUNTS[cat.key]})</span>
    </button>
  );
}

export function CategorySelector() {
  const { selectedCategories, toggleCategory, setCategories } = useStore();
  const on = (k: string) => selectedCategories.includes(k);
  const optionalKeys = OPTIONAL_CATEGORY_METAS.map(c => c.key);
  const allOptionalOn = optionalKeys.every(on);

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

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', letterSpacing: '.04em' }}>Optional packs</span>
        <button
          className="ss-link"
          style={{ fontSize: 12 }}
          onClick={() => {
            const withoutOptional = selectedCategories.filter(k => !optionalKeys.includes(k));
            setCategories(allOptionalOn ? withoutOptional : [...withoutOptional, ...optionalKeys]);
          }}
        >
          {allOptionalOn ? 'Clear all' : 'Add all'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {OPTIONAL_CATEGORY_METAS.map(cat => (
          <Chip key={cat.key} cat={cat} on={on(cat.key)} onToggle={() => toggleCategory(cat.key)} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 14, lineHeight: 1.5 }}>
        Optional answers are saved to your profile and included in your exportable summary — handy for the
        upcoming feature to compare profiles and talk with others.
      </p>
    </div>
  );
}

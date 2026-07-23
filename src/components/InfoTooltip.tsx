import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Info } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
  /** Horizontal anchoring of the popup, to avoid clipping at container edges. */
  align?: 'center' | 'left' | 'right';
}

/** ⓘ trigger that reveals an explanation on hover (desktop) OR tap (touch). */
export function InfoTooltip({ text, label, align = 'center' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const alignStyle: CSSProperties =
    align === 'left' ? { left: 0 }
    : align === 'right' ? { right: 0 }
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label ?? 'More information'}
        aria-expanded={open}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        style={{ color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: 3, margin: -3, lineHeight: 0 }}
      >
        <Info className="w-3.5 h-3.5" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', bottom: '100%', marginBottom: 8, zIndex: 30,
            width: 'min(15rem, 74vw)', borderRadius: 8, background: '#201f1d', color: '#f4f1ea',
            padding: '10px 12px', fontSize: 12, lineHeight: 1.5, textAlign: 'left', fontWeight: 400,
            boxShadow: '0 6px 22px rgba(0,0,0,.24)', ...alignStyle,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

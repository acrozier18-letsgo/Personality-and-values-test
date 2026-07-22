import { Info } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
  /** Horizontal anchoring of the popup, to avoid clipping at container edges. */
  align?: 'center' | 'left' | 'right';
}

const ALIGN: Record<NonNullable<Props['align']>, string> = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'left-0',
  right: 'right-0',
};

/** Small ⓘ trigger that reveals an explanation popup on hover or keyboard focus. */
export function InfoTooltip({ text, label, align = 'center' }: Props) {
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-label={label ?? 'More information'}
        className="rounded-full"
        style={{ color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'help', display: 'inline-flex' }}
      >
        <Info className="w-3.5 h-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 bottom-full mb-2 w-56 max-w-[16rem] rounded-lg bg-gray-900 p-2.5 text-xs leading-snug text-gray-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${ALIGN[align]}`}
      >
        {text}
      </span>
    </span>
  );
}

interface Props {
  variant?: 'hero' | 'persona';
}

/** Concentric gold "oculus" with radiating light rays — the Pantheon sunlight motif. */
export function Oculus({ variant = 'hero' }: Props) {
  if (variant === 'persona') {
    return (
      <svg
        viewBox="0 0 300 160"
        className="ss-glow"
        style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 320, maxWidth: '110%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <g fill="none" stroke="#b68235">
          <circle cx="150" cy="70" r="34" strokeOpacity=".4" />
          <circle cx="150" cy="70" r="58" strokeOpacity=".22" />
          <circle cx="150" cy="70" r="84" strokeOpacity=".1" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 460 460"
      className="ss-glow"
      style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 480, maxWidth: '128%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <g fill="none" stroke="#b68235">
        <circle cx="230" cy="200" r="52" strokeOpacity=".55" />
        <circle cx="230" cy="200" r="84" strokeOpacity=".38" />
        <circle cx="230" cy="200" r="118" strokeOpacity=".26" />
        <circle cx="230" cy="200" r="154" strokeOpacity=".16" />
        <circle cx="230" cy="200" r="192" strokeOpacity=".09" />
      </g>
      <g stroke="#d9b978" strokeOpacity=".5" strokeWidth="1">
        <line x1="230" y1="8" x2="230" y2="52" /><line x1="230" y1="348" x2="230" y2="392" />
        <line x1="38" y1="200" x2="82" y2="200" /><line x1="378" y1="200" x2="422" y2="200" />
        <line x1="94" y1="64" x2="126" y2="96" /><line x1="334" y1="64" x2="366" y2="96" />
        <line x1="94" y1="336" x2="126" y2="304" /><line x1="334" y1="336" x2="366" y2="304" />
      </g>
    </svg>
  );
}

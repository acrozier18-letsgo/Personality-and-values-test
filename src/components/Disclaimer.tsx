export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-faint-2)', margin: 0 }}>
        For self-reflection and enjoyment only — not a clinical assessment.
        Results are tendencies drawn from your answers, not verdicts.
      </p>
    );
  }
  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        border: '1px solid rgba(182,130,53,.4)',
        borderRadius: 4,
        background: 'var(--tint-gold-2)',
        padding: '22px 26px',
        textAlign: 'center',
      }}
    >
      <div className="kicker" style={{ letterSpacing: '.24em', color: 'var(--gold-deep)', marginBottom: 8 }}>
        A note before you begin
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#5a5348', margin: 0 }}>
        This tool is for self-reflection and enjoyment — it is <em>not</em> a validated
        psychometric instrument or clinical assessment. Results describe tendencies drawn from
        your own answers. No position on the political, philosophical, or religious spectrum is
        presented as correct or superior. Your data stays in your browser and is never sent anywhere.
      </p>
    </div>
  );
}

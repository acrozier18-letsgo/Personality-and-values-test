export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-gray-400 text-center mt-2">
        For self-reflection and entertainment only — not a clinical assessment.
        Results are tendencies derived from your answers, not verdicts.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-300 max-w-2xl mx-auto">
      <strong className="block mb-1">A note before you begin</strong>
      This tool is for self-reflection and entertainment — it is <em>not</em> a validated
      psychometric instrument or clinical assessment. Results describe tendencies and
      preferences derived from your own answers. No position on the political, philosophical,
      or religious spectrum is presented as correct or superior. Your data stays in your
      browser and is never sent anywhere.
    </div>
  );
}

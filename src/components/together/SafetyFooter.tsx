/**
 * Present on every state of the Together page. Deliberately quiet — a couple
 * having an ordinary hard week shouldn't be lectured — but unambiguous, because
 * some of the people who open a relationship app are not having an ordinary hard
 * week, and this is the one thing on the page that has to be right for them.
 */
export function SafetyFooter() {
  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.6, maxWidth: 620, margin: '0 auto' }}>
        Selfscape Together is a reflection tool built from two questionnaires. It isn’t therapy, counselling,
        or a diagnosis, and it can’t know anything about your relationship that you didn’t both write down.
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.6, maxWidth: 620, margin: '10px auto 0' }}>
        If you feel afraid of your partner, controlled, or unsafe, nothing on this page applies to that —
        please talk to someone qualified. In the US, the National Domestic Violence Hotline is{' '}
        <strong>1-800-799-7233</strong> or text START to <strong>88788</strong>; in the UK, the National
        Domestic Abuse Helpline is <strong>0808 2000 247</strong>. Elsewhere, a local service or your doctor
        can point you to help.
      </p>
    </div>
  );
}

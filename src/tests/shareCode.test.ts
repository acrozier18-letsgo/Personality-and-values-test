import { describe, it, expect } from 'vitest';
import { encodeProfile, decodeProfile } from '../engine/shareCode';
import type { Answer } from '../engine/scoring';

describe('shareCode round-trip', () => {
  it('encodes and decodes a mixed answer set exactly', () => {
    const answers: Record<string, Answer> = {
      q001: 'strongly_agree',
      q002: 'disagree',
      q003: 'no_opinion',
      q231: 'strongly_disagree',
      par001: 'agree',
      trv025: 'strongly_agree',
    };
    const decoded = decodeProfile(encodeProfile(answers));
    expect(decoded).toEqual(answers);
  });

  it('produces a compact code (~230 chars for a full profile)', () => {
    const full: Record<string, Answer> = {};
    for (let i = 1; i <= 231; i++) full[`q${String(i).padStart(3, '0')}`] = 'agree';
    const code = encodeProfile(full);
    expect(code.length).toBeLessThan(260);
  });

  it('ignores unanswered questions', () => {
    const decoded = decodeProfile(encodeProfile({ q005: 'agree' }));
    expect(decoded).toEqual({ q005: 'agree' });
    expect(Object.keys(decoded)).toHaveLength(1);
  });

  it('returns empty for a malformed code', () => {
    expect(decodeProfile('')).toEqual({});
    expect(decodeProfile('not-a-real-code')).toEqual({});
  });
});

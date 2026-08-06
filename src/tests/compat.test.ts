import { describe, it, expect } from 'vitest';
import { compareProfiles } from '../engine/compat';
import type { Answer } from '../engine/scoring';
import { QUESTIONS } from '../data/questions';
import { RELATIONSHIP_QUESTIONS } from '../data/relationshipQuestions';
import { OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import { buildPartnerFile, parsePartnerFile } from '../partner/link';

const CONFLICT_IDS = RELATIONSHIP_QUESTIONS
  .filter(q => q.category === 'conflict')
  .map(q => q.id);

function answerAll(ids: string[], val: Answer): Record<string, Answer> {
  return Object.fromEntries(ids.map(id => [id, val]));
}

const domain = (r: ReturnType<typeof compareProfiles>, key: string) =>
  r.domains.find(d => d.key === key)!;

describe('compareProfiles — item domains', () => {
  it('identical answers give full alignment and no friction', () => {
    const a = answerAll(CONFLICT_IDS, 'agree');
    const result = compareProfiles(a, { ...a });
    const conflict = domain(result, 'conflict');
    expect(conflict.alignment).toBe(100);
    expect(conflict.band).toBe('aligned');
    expect(conflict.divergences).toHaveLength(0);
  });

  it('opposite answers give zero alignment and flag every statement', () => {
    const a = answerAll(CONFLICT_IDS, 'strongly_agree');
    const b = answerAll(CONFLICT_IDS, 'strongly_disagree');
    const conflict = domain(compareProfiles(a, b), 'conflict');
    expect(conflict.alignment).toBe(0);
    expect(conflict.band).toBe('friction');
    // Capped at 12 per domain for display, but every item qualified.
    expect(conflict.divergences.length).toBe(12);
    expect(conflict.divergences[0].gap).toBe(4);
  });

  it('ignores one-step differences as noise', () => {
    const a = answerAll(CONFLICT_IDS, 'strongly_agree');
    const b = answerAll(CONFLICT_IDS, 'agree');
    const conflict = domain(compareProfiles(a, b), 'conflict');
    expect(conflict.divergences).toHaveLength(0);
    expect(conflict.alignment).toBe(75); // mean gap of 1 on a 4-point span
  });

  it('ranks divergences by gap × how much a gap there matters', () => {
    const heavy = RELATIONSHIP_QUESTIONS.find(q => q.category === 'conflict' && q.gapWeight === 3)!;
    const light = RELATIONSHIP_QUESTIONS.find(q => q.category === 'conflict' && q.gapWeight === 1)!;
    const a: Record<string, Answer> = { [heavy.id]: 'strongly_agree', [light.id]: 'strongly_agree' };
    const b: Record<string, Answer> = { [heavy.id]: 'strongly_disagree', [light.id]: 'strongly_disagree' };
    const conflict = domain(compareProfiles(a, b), 'conflict');
    expect(conflict.divergences[0].id).toBe(heavy.id);
    expect(conflict.divergences[0].severity).toBeGreaterThan(conflict.divergences[1].severity);
  });

  it('labels divergences from the viewer’s side', () => {
    const q = CONFLICT_IDS[0];
    const result = compareProfiles({ [q]: 'strongly_agree' }, { [q]: 'strongly_disagree' });
    const d = domain(result, 'conflict').divergences[0];
    expect(d.you).toBe('strongly_agree');
    expect(d.them).toBe('strongly_disagree');
  });
});

describe('compareProfiles — common ground', () => {
  it('reports only convictions both people hold strongly', () => {
    const strong = CONFLICT_IDS[0];
    const mild = CONFLICT_IDS[1];
    const result = compareProfiles(
      { [strong]: 'strongly_agree', [mild]: 'agree' },
      { [strong]: 'strongly_agree', [mild]: 'agree' },
    );
    const ids = domain(result, 'conflict').agreements.map(a => a.id);
    expect(ids).toContain(strong);
    expect(ids).not.toContain(mild);
  });

  it('does not count opposite answers as agreement', () => {
    const q = CONFLICT_IDS[0];
    const result = compareProfiles({ [q]: 'strongly_agree' }, { [q]: 'strongly_disagree' });
    expect(domain(result, 'conflict').agreements).toHaveLength(0);
  });
});

describe('compareProfiles — unanswered and thin data', () => {
  it('marks a domain unknown when neither side answered it', () => {
    const result = compareProfiles({}, {});
    expect(domain(result, 'money').alignment).toBeNull();
    expect(domain(result, 'money').band).toBe('unknown');
  });

  it('only compares statements BOTH people answered', () => {
    const [first, second] = CONFLICT_IDS;
    const result = compareProfiles(
      { [first]: 'agree', [second]: 'strongly_agree' },
      { [first]: 'agree' },
    );
    expect(domain(result, 'conflict').shared).toBe(1);
  });

  it('flags a thin comparison', () => {
    const q = CONFLICT_IDS[0];
    const result = compareProfiles({ [q]: 'agree' }, { [q]: 'agree' });
    expect(result.thin).toBe(true);
    expect(result.sharedAnswers).toBe(1);
  });
});

describe('compareProfiles — trait domains', () => {
  it('scores identical core answers as near-perfectly aligned', () => {
    const ids = QUESTIONS.filter(q => q.group === 'A').map(q => q.id);
    const a = answerAll(ids, 'agree');
    const temperament = domain(compareProfiles(a, { ...a }), 'temperament');
    expect(temperament.alignment).toBe(100);
  });

  it('scores inverted core answers as badly misaligned', () => {
    const ids = QUESTIONS.filter(q => q.group === 'A').map(q => q.id);
    const result = compareProfiles(
      answerAll(ids, 'strongly_agree'),
      answerAll(ids, 'strongly_disagree'),
    );
    const temperament = domain(result, 'temperament');
    expect(temperament.alignment).toBeLessThan(50);
    expect(temperament.band).toBe('friction');
  });
});

describe('partner share file', () => {
  const answers: Record<string, Answer> = {
    [CONFLICT_IDS[0]]: 'agree',
    [OPTIONAL_QUESTIONS.find(q => q.category === 'intimacy')!.id]: 'strongly_agree',
  };

  it('round-trips a shared profile', () => {
    const file = buildPartnerFile({
      displayName: 'Sam', birthdate: '1990-05-04', answers, refineAnswers: {}, includeIntimacy: true,
    });
    const parsed = parsePartnerFile(JSON.stringify(file));
    expect(parsed.displayName).toBe('Sam');
    expect(parsed.birthdate).toBe('1990-05-04');
    expect(parsed.includesIntimacy).toBe(true);
    expect(parsed.answers[CONFLICT_IDS[0]]).toBe('agree');
  });

  it('strips intimacy answers entirely when not opted in', () => {
    const intimacyId = OPTIONAL_QUESTIONS.find(q => q.category === 'intimacy')!.id;
    const file = buildPartnerFile({
      displayName: 'Sam', birthdate: '', answers, refineAnswers: {}, includeIntimacy: false,
    });
    expect(file.answers[intimacyId]).toBeUndefined();
    expect(JSON.stringify(file)).not.toContain(intimacyId);
    expect(parsePartnerFile(JSON.stringify(file)).includesIntimacy).toBe(false);
  });

  it('falls back to a neutral name when none was given', () => {
    const file = buildPartnerFile({
      displayName: '', birthdate: '', answers, refineAnswers: {}, includeIntimacy: false,
    });
    expect(parsePartnerFile(JSON.stringify(file)).displayName).toBe('Your partner');
  });

  it('rejects a file that is not from Selfscape', () => {
    expect(() => parsePartnerFile('{"kind":"something-else","answers":{}}')).toThrow();
    expect(() => parsePartnerFile('not json')).toThrow();
  });

  it('accepts a plain answers backup as a partner profile', () => {
    const backup = JSON.stringify({
      app: 'selfscape',
      kind: 'selfscape-answers',
      version: 1,
      exportedAt: new Date().toISOString(),
      birthdate: '',
      answers: { [CONFLICT_IDS[0]]: 'agree' },
      refineAnswers: {},
    });
    expect(parsePartnerFile(backup, 'Jo').displayName).toBe('Jo');
  });
});

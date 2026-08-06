// Partner-link providers and the share-file format.
//
// The file provider is what works today. The email provider is a real
// implementation of the same interface that reports itself unavailable, so the
// Together page can show the flow as coming soon rather than pretending it
// doesn't exist — and so switching it on later is a one-line change here plus a
// backend, with no UI edits.

import type { Answer } from '../engine/scoring';
import { ANSWER_VALUES, countAnswered } from '../engine/scoring';
import { QUESTIONS } from '../data/questions';
import { OPTIONAL_QUESTIONS } from '../data/optionalQuestions';
import { RELATIONSHIP_QUESTIONS } from '../data/relationshipQuestions';
import { ANSWERS_FILE_KIND } from '../export/profile';
import type {
  PartnerProfile,
  PartnerProfileFile,
  PartnerLinkProvider,
} from './types';
import { PARTNER_FILE_KIND, PARTNER_FILE_VERSION } from './types';

const VALID_QUESTION_IDS = new Set<string>([
  ...QUESTIONS.map(q => q.id),
  ...OPTIONAL_QUESTIONS.map(q => q.id),
  ...RELATIONSHIP_QUESTIONS.map(q => q.id),
]);

const INTIMACY_IDS = new Set(
  OPTIONAL_QUESTIONS.filter(q => q.category === 'intimacy').map(q => q.id),
);

/**
 * Build the file one partner sends the other. `includeIntimacy` is an explicit
 * opt-in: those answers are stripped entirely when it's false, rather than
 * being included and hidden in the UI.
 */
export function buildPartnerFile(data: {
  displayName: string;
  birthdate: string;
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
  includeIntimacy: boolean;
}): PartnerProfileFile {
  const answers: Record<string, Answer> = {};
  for (const [id, val] of Object.entries(data.answers)) {
    if (!data.includeIntimacy && INTIMACY_IDS.has(id)) continue;
    answers[id] = val;
  }
  return {
    app: 'selfscape',
    kind: PARTNER_FILE_KIND,
    version: PARTNER_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    displayName: data.displayName.trim(),
    birthdate: data.birthdate ?? '',
    includesIntimacy: data.includeIntimacy,
    answeredCount: countAnswered(answers),
    answers,
    refineAnswers: data.refineAnswers ?? {},
  };
}

/**
 * Parse a file a partner shared. Accepts both the dedicated partner-share file
 * and a plain Selfscape answers backup, since plenty of people already have one
 * of those and shouldn't be made to re-export.
 */
export function parsePartnerFile(text: string, fallbackName = ''): PartnerProfile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON. Choose a Selfscape share file.");
  }

  // `kind` is widened to string so both file kinds can be tested against it.
  const obj = raw as Omit<Partial<PartnerProfileFile>, 'kind'> & { kind?: string };
  const isPartnerFile = obj?.kind === PARTNER_FILE_KIND;
  const isAnswersFile = obj?.kind === ANSWERS_FILE_KIND;
  if (!obj || typeof obj !== 'object' || (!isPartnerFile && !isAnswersFile) || !obj.answers) {
    throw new Error("That doesn't look like a Selfscape file. Ask them to use “Share with my partner”.");
  }

  const answers: Record<string, Answer> = {};
  for (const [id, val] of Object.entries(obj.answers)) {
    if (VALID_QUESTION_IDS.has(id) && typeof val === 'string' && val in ANSWER_VALUES) {
      answers[id] = val as Answer;
    }
  }
  if (Object.keys(answers).length === 0) {
    throw new Error('That file contains no recognisable answers.');
  }

  const refineAnswers: Record<string, number> = {};
  if (obj.refineAnswers && typeof obj.refineAnswers === 'object') {
    for (const [id, val] of Object.entries(obj.refineAnswers)) {
      if (typeof val === 'number' && Number.isFinite(val)) refineAnswers[id] = val;
    }
  }

  const birthdate =
    typeof obj.birthdate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.birthdate)
      ? obj.birthdate
      : '';

  // An answers backup carries no consent flag, so infer it from the contents.
  const includesIntimacy = isPartnerFile
    ? Boolean(obj.includesIntimacy)
    : Object.keys(answers).some(id => INTIMACY_IDS.has(id));

  return {
    displayName: (obj.displayName || fallbackName || '').trim() || 'Your partner',
    birthdate,
    answers,
    refineAnswers,
    includesIntimacy,
    source: 'file',
    sharedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    linkedAt: Date.now(),
  };
}

export function readPartnerFile(file: File, fallbackName = ''): Promise<PartnerProfile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      try {
        resolve(parsePartnerFile(String(reader.result ?? ''), fallbackName));
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}

// ── Providers ────────────────────────────────────────────────────────────────

export const fileLinkProvider: PartnerLinkProvider = {
  id: 'file',
  label: 'Share a file',
  isAvailable: () => true,
  unavailableReason: () => '',
};

/**
 * Email-invite linking. Unavailable until a backend exists to hold profiles,
 * deliver the invitation and record the recipient's accept/decline — none of
 * which a static site can do. The methods are declared so the Together page can
 * already be written against them; they throw rather than silently no-op.
 */
export const emailLinkProvider: PartnerLinkProvider = {
  id: 'email',
  label: 'Invite by email',
  isAvailable: () => false,
  unavailableReason: () =>
    'Email invitations need a server to deliver the invite and record your partner’s consent. ' +
    'Selfscape runs entirely in your browser today, so share a file instead — it does the same job.',
  async invite() {
    throw new Error('Email linking is not available yet.');
  },
  async pendingInvites() {
    throw new Error('Email linking is not available yet.');
  },
  async fetchLinked() {
    throw new Error('Email linking is not available yet.');
  },
  async revoke() {
    throw new Error('Email linking is not available yet.');
  },
};

export const LINK_PROVIDERS: PartnerLinkProvider[] = [fileLinkProvider, emailLinkProvider];

/** The provider the UI should use by default — the first one actually usable. */
export function activeLinkProvider(): PartnerLinkProvider {
  return LINK_PROVIDERS.find(p => p.isAvailable()) ?? fileLinkProvider;
}

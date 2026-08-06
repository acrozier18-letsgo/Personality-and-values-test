// Shared types for partner linking. Kept in their own module so the store, the
// providers and the UI can all import them without a cycle.

import type { Answer } from '../engine/scoring';

/** How a partner's profile arrived on this device. */
export type PartnerSource = 'file' | 'email';

/**
 * A partner's assessment, as held on this device. This is the ONLY thing the
 * Together page reasons about — it never has access to anything the partner
 * didn't put in the file they shared.
 */
export interface PartnerProfile {
  /** What to call them in the report. Free text; defaults to "Your partner". */
  displayName: string;
  birthdate: string;
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
  /** Whether they chose to include their Intimacy pack answers when sharing. */
  includesIntimacy: boolean;
  source: PartnerSource;
  /** When they generated the share, if known; otherwise when we imported it. */
  sharedAt: string;
  /** When this device imported it. */
  linkedAt: number;
}

// ── The shared file ──────────────────────────────────────────────────────────

export const PARTNER_FILE_KIND = 'selfscape-partner-profile';
export const PARTNER_FILE_VERSION = 1;

export interface PartnerProfileFile {
  app: 'selfscape';
  kind: typeof PARTNER_FILE_KIND;
  version: number;
  exportedAt: string;
  displayName: string;
  birthdate: string;
  includesIntimacy: boolean;
  answeredCount: number;
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
}

// ── Provider interface ───────────────────────────────────────────────────────

/**
 * How a partner profile gets onto this device.
 *
 * Today only `fileLinkProvider` is usable: one person exports a share file and
 * the other imports it, so nothing ever leaves either device except by the
 * user's own hand. `emailLinkProvider` implements the same interface but reports
 * itself unavailable — the email invite flow needs a server to hold profiles,
 * send the invitation and record the recipient's consent. See
 * docs/partner-linking.md for the backend that would make it available.
 *
 * Swapping providers must not require touching the Together page: everything the
 * UI needs is on this interface.
 */
export interface PartnerLinkProvider {
  id: PartnerSource;
  label: string;
  /** False when this provider can't be used in the current build/deployment. */
  isAvailable(): boolean;
  /** Why it's unavailable, shown to the user. Empty when available. */
  unavailableReason(): string;

  /**
   * Ask `email` to share their Selfscape. Resolves once the invitation is sent —
   * the profile itself arrives later, via `pendingInvites` / `fetchLinked`.
   */
  invite?(email: string): Promise<{ ok: boolean; message: string }>;
  /** Invitations sent from this device that haven't been accepted or declined. */
  pendingInvites?(): Promise<PartnerInvite[]>;
  /** Profiles shared with this device by someone who accepted an invitation. */
  fetchLinked?(): Promise<PartnerProfile[]>;
  /** Withdraw an invitation, or revoke an accepted link. */
  revoke?(inviteId: string): Promise<void>;
}

export interface PartnerInvite {
  id: string;
  email: string;
  sentAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// Client for the optional profiles backend (Cloudflare Worker + D1).
// Inert unless VITE_PROFILE_API_URL is configured (set as the GitHub Actions
// variable PROFILE_API_URL), mirroring the OpenAI proxy pattern — so the app
// stays fully local/serverless until a backend is deployed.

import type { Answer } from '../engine/scoring';

const RAW = (import.meta.env.VITE_PROFILE_API_URL ?? '').trim().replace(/\/+$/, '');
const API = RAW && !/^https?:\/\//i.test(RAW) ? `https://${RAW}` : RAW;

/** True when a profiles backend is configured, enabling cloud save/share/account. */
export const PROFILES_ENABLED = Boolean(API);

const TOKEN_KEY = 'selfscape-account-token';

/** A stable per-browser secret tying together this person's cloud profiles. */
export function accountToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    t = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export interface CloudProfileMeta { id: string; label: string; updated_at: number }
export interface CloudProfile { id: string; label: string; answers: Record<string, Answer>; updatedAt: number }

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || `Error ${r.status}`);
  return data as T;
}

export function createProfile(answers: Record<string, Answer>, label: string, email: string) {
  return req<{ id: string; ownerToken: string; label: string }>('/profiles', {
    method: 'POST',
    body: JSON.stringify({ answers, label, email, ownerToken: accountToken() }),
  });
}

export function updateProfile(id: string, answers: Record<string, Answer>, label: string) {
  return req<{ id: string; label: string }>(`/profiles/${id}`, {
    method: 'PUT',
    headers: { 'X-Owner-Token': accountToken() },
    body: JSON.stringify({ answers, label }),
  });
}

export function getProfile(id: string) {
  return req<CloudProfile>(`/profiles/${encodeURIComponent(id)}`);
}

export function deleteProfile(id: string) {
  return req<{ ok: boolean }>(`/profiles/${id}`, {
    method: 'DELETE',
    headers: { 'X-Owner-Token': accountToken() },
  });
}

export function listProfiles(email: string) {
  return req<{ profiles: CloudProfileMeta[] }>(
    `/account?email=${encodeURIComponent(email)}&token=${encodeURIComponent(accountToken())}`,
  );
}

/** Short share URL for a cloud profile id. */
export function cloudShareUrl(id: string): string {
  return `${location.origin}${location.pathname}#/p/${id}`;
}

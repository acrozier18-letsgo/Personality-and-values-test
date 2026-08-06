import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answer } from '../engine/scoring';
import { isAnswered, countAnswered } from '../engine/scoring';
import { DEFAULT_SELECTED_CATEGORIES } from '../data/categories';
import type { LLMPersonaResult, StoryResult, CoupleReport } from '../services/openai';
import type { PartnerProfile } from '../partner/types';

/** A saved snapshot of a completed (or in-progress) answer set, kept locally. */
export interface SavedVersion {
  id: string;
  label: string;
  email: string;
  createdAt: number;
  answeredCount: number;
  birthdate: string;
  answers: Record<string, Answer>;
  refineAnswers: Record<string, number>;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// API key lives in its own localStorage key so it never ends up in exports
const API_KEY_STORAGE = 'selfscape-openai-key';

export function getStoredApiKey(): string {
  // Prefer a key the user entered in the UI; otherwise fall back to a build-time
  // env var (set VITE_OPENAI_API_KEY in .env.local) so the key can be preconfigured.
  return localStorage.getItem(API_KEY_STORAGE) || (import.meta.env.VITE_OPENAI_API_KEY ?? '');
}
export function saveApiKey(key: string) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key);
  else localStorage.removeItem(API_KEY_STORAGE);
}

interface StoreState {
  answers: Record<string, Answer>;
  cursor: number;
  startedAt: number | null;
  lastSavedAt: number | null;
  refineAnswers: Record<string, number>;

  // New: birthday and LLM result (persisted so it doesn't vanish on refresh)
  birthdate: string;          // ISO date string e.g. "1990-12-25", or ""
  llmPersona: LLMPersonaResult | null;
  story: StoryResult | null;  // generated short story (persisted across refresh)

  // Identity + saved answer-set history (all local to this browser)
  email: string;
  versions: SavedVersion[];

  // OpenAI key, shared reactively across every AI feature. Kept out of the
  // persisted blob (see partialize) — it lives in its own localStorage key.
  apiKey: string;

  // Which question categories the user has chosen to answer (core + optional).
  selectedCategories: string[];
  /** Adds the deep-dive tier of any selected relationship pack to the quiz. */
  deepDive: boolean;

  // ── Together (couples) ────────────────────────────────────────────────────
  /** What this person wants to be called in the couples report. */
  selfName: string;
  /** The partner's imported profile — everything the Together page reasons about. */
  partner: PartnerProfile | null;
  /** Cached couples report, so it survives a refresh and isn't regenerated for free. */
  coupleReport: CoupleReport | null;

  answer: (id: string, val: Answer) => void;
  goTo: (index: number) => void;
  reset: () => void;
  importData: (data: {
    answers?: Record<string, Answer>;
    refineAnswers?: Record<string, number>;
    birthdate?: string;
  }) => void;
  setRefineAnswer: (id: string, val: number) => void;
  setBirthdate: (date: string) => void;
  setLLMPersona: (result: LLMPersonaResult | null) => void;
  setStory: (result: StoryResult | null) => void;

  setEmail: (email: string) => void;
  setApiKey: (key: string) => void;
  toggleCategory: (key: string) => void;
  setCategories: (keys: string[]) => void;
  setDeepDive: (on: boolean) => void;

  setSelfName: (name: string) => void;
  /** Link a partner's shared profile. Clears any report built from a previous one. */
  setPartner: (profile: PartnerProfile | null) => void;
  renamePartner: (name: string) => void;
  setCoupleReport: (report: CoupleReport | null) => void;
  /** Snapshot the current answers as a new saved version; returns its id. */
  saveVersion: (label?: string) => string;
  /** Load a saved version's answers into the active session. */
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, label: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      answers: {},
      cursor: 0,
      startedAt: null,
      lastSavedAt: null,
      refineAnswers: {},
      birthdate: '',
      llmPersona: null,
      story: null,
      email: '',
      versions: [],
      apiKey: getStoredApiKey(),
      selectedCategories: [...DEFAULT_SELECTED_CATEGORIES],
      deepDive: false,
      selfName: '',
      partner: null,
      coupleReport: null,

      answer: (id, val) =>
        set((state) => ({
          answers: { ...state.answers, [id]: val },
          startedAt: state.startedAt ?? Date.now(),
          lastSavedAt: Date.now(),
        })),

      goTo: (index) => set({ cursor: index }),

      reset: () =>
        set({
          answers: {},
          cursor: 0,
          startedAt: null,
          lastSavedAt: null,
          refineAnswers: {},
          llmPersona: null,
          story: null,
          // The report was built from answers that no longer exist. The partner
          // link itself survives — it isn't this person's data to erase.
          coupleReport: null,
          // birthdate intentionally kept — user doesn't need to re-enter it
        }),

      // Restore a snapshot from an uploaded file. Replaces answers wholesale and
      // clears the generated persona/story so they regenerate from the new answers.
      importData: (data) =>
        set((state) => ({
          answers: data.answers ?? {},
          refineAnswers: data.refineAnswers ?? {},
          birthdate: data.birthdate ?? state.birthdate,
          cursor: 0,
          startedAt: Date.now(),
          lastSavedAt: Date.now(),
          llmPersona: null,
          story: null,
          coupleReport: null,
        })),

      setRefineAnswer: (id, val) =>
        set((state) => ({
          refineAnswers: { ...state.refineAnswers, [id]: val },
          lastSavedAt: Date.now(),
        })),

      setBirthdate: (date) => set({ birthdate: date, llmPersona: null, story: null }),
      setLLMPersona: (result) => set({ llmPersona: result }),
      setStory: (result) => set({ story: result }),

      setEmail: (email) => set({ email: email.trim() }),

      // Persist the key to its own localStorage entry AND expose it reactively
      // so every AI feature (portrait, story, chat, examples) shares one key.
      setApiKey: (key) => {
        const trimmed = key.trim();
        saveApiKey(trimmed);
        set({ apiKey: trimmed });
      },

      toggleCategory: (key) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.includes(key)
            ? state.selectedCategories.filter((k) => k !== key)
            : [...state.selectedCategories, key],
        })),

      setCategories: (keys) => set({ selectedCategories: keys }),

      setDeepDive: (on) => set({ deepDive: on }),

      setSelfName: (name) => set({ selfName: name.trim() }),

      // A new partner invalidates any report — it was written about someone else.
      setPartner: (profile) => set({ partner: profile, coupleReport: null }),

      renamePartner: (name) =>
        set((state) =>
          state.partner
            ? { partner: { ...state.partner, displayName: name.trim() || 'Your partner' } }
            : {},
        ),

      setCoupleReport: (report) => set({ coupleReport: report }),

      saveVersion: (label) => {
        const id = newId();
        set((state) => {
          const count = countAnswered(state.answers);
          const version: SavedVersion = {
            id,
            label: label?.trim() || `Version ${state.versions.length + 1}`,
            email: state.email,
            createdAt: Date.now(),
            answeredCount: count,
            birthdate: state.birthdate,
            answers: { ...state.answers },
            refineAnswers: { ...state.refineAnswers },
          };
          return { versions: [version, ...state.versions] };
        });
        return id;
      },

      loadVersion: (id) =>
        set((state) => {
          const v = state.versions.find((x) => x.id === id);
          if (!v) return {};
          return {
            answers: { ...v.answers },
            refineAnswers: { ...v.refineAnswers },
            birthdate: v.birthdate || state.birthdate,
            cursor: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            llmPersona: null,
            story: null,
            coupleReport: null,
          };
        }),

      deleteVersion: (id) =>
        set((state) => ({ versions: state.versions.filter((x) => x.id !== id) })),

      renameVersion: (id, label) =>
        set((state) => ({
          versions: state.versions.map((x) =>
            x.id === id ? { ...x, label: label.trim() || x.label } : x,
          ),
        })),
    }),
    {
      name: 'selfscape-v1',
      version: 3,
      // Keep the API key out of the persisted blob (and thus out of any export);
      // it is stored separately via saveApiKey and re-seeded on load.
      partialize: (state) => {
        const persisted = { ...state };
        delete (persisted as { apiKey?: string }).apiKey;
        return persisted;
      },
      // v2: answers moved from 'yes'|'no'|'skip' to a 5-point agree/disagree scale.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as StoreState;
        if (version < 2 && state?.answers) {
          const map: Record<string, Answer | undefined> = {
            yes: 'agree',
            no: 'disagree',
            skip: undefined, // old skip == unanswered; drop it
          };
          const migrated: Record<string, Answer> = {};
          for (const [id, val] of Object.entries(state.answers)) {
            const next = map[val as unknown as string] ?? (isAnswered(val) ? val : undefined);
            if (next) migrated[id] = next;
          }
          state.answers = migrated;
        }
        // v3 added the Together slice. Older blobs simply lack these keys; the
        // defaults in the initialiser cover them, so nothing to migrate.
        return state;
      },
    },
  ),
);

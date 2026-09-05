import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answer } from '../engine/scoring';
import { isAnswered, countAnswered } from '../engine/scoring';
import { DEFAULT_SELECTED_CATEGORIES } from '../data/categories';
import type { LLMPersonaResult, StoryResult } from '../services/openai';

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
  /**
   * When these answers were actually given, which is not always when the
   * snapshot was created — an uploaded backup from two years ago is dated by
   * its export stamp, and the user can correct it. Optional so versions saved
   * before the growth timeline existed still load; read it via versionTakenAt.
   */
  takenAt?: number;
  /** 'imported' marks a version restored from an uploaded answers file. */
  source?: 'local' | 'imported';
}

/** When a saved version's answers were given, falling back to its save time. */
export function versionTakenAt(v: SavedVersion): number {
  return v.takenAt ?? v.createdAt;
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
  /** Snapshot the current answers as a new saved version; returns its id. */
  saveVersion: (label?: string) => string;
  /** Load a saved version's answers into the active session. */
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, label: string) => void;
  /**
   * File an uploaded answers file as a point on the timeline WITHOUT disturbing
   * the answers in progress. This is how a past profile joins the growth arc.
   * Returns the new version's id.
   */
  addVersionFromImport: (
    data: { answers: Record<string, Answer>; refineAnswers?: Record<string, number>; birthdate?: string },
    opts?: { label?: string; takenAt?: number },
  ) => string;
  /** Correct when a snapshot's answers were actually given. */
  setVersionDate: (id: string, takenAt: number) => void;
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

      saveVersion: (label) => {
        const id = newId();
        set((state) => {
          const count = countAnswered(state.answers);
          const now = Date.now();
          const version: SavedVersion = {
            id,
            label: label?.trim() || `Version ${state.versions.length + 1}`,
            email: state.email,
            createdAt: now,
            answeredCount: count,
            birthdate: state.birthdate,
            answers: { ...state.answers },
            refineAnswers: { ...state.refineAnswers },
            takenAt: now,
            source: 'local',
          };
          return { versions: [version, ...state.versions] };
        });
        return id;
      },

      addVersionFromImport: (data, opts) => {
        const id = newId();
        set((state) => {
          const now = Date.now();
          const version: SavedVersion = {
            id,
            label: opts?.label?.trim() || `Imported ${new Date(opts?.takenAt ?? now).toLocaleDateString()}`,
            email: state.email,
            createdAt: now,
            answeredCount: countAnswered(data.answers),
            birthdate: data.birthdate || state.birthdate,
            answers: { ...data.answers },
            refineAnswers: { ...(data.refineAnswers ?? {}) },
            takenAt: opts?.takenAt ?? now,
            source: 'imported',
          };
          return { versions: [version, ...state.versions] };
        });
        return id;
      },

      setVersionDate: (id, takenAt) =>
        set((state) => ({
          versions: state.versions.map((x) => (x.id === id ? { ...x, takenAt } : x)),
        })),

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
      // v3: saved versions gained takenAt/source for the growth timeline.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as StoreState;
        if (version < 3 && Array.isArray(state?.versions)) {
          state.versions = state.versions.map((v) => ({
            ...v,
            takenAt: v.takenAt ?? v.createdAt,
            source: v.source ?? 'local',
          }));
        }
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
        return state;
      },
    },
  ),
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answer } from '../engine/scoring';
import { isAnswered } from '../engine/scoring';
import type { LLMPersonaResult, StoryResult } from '../services/openai';

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

  answer: (id: string, val: Answer) => void;
  goTo: (index: number) => void;
  reset: () => void;
  setRefineAnswer: (id: string, val: number) => void;
  setBirthdate: (date: string) => void;
  setLLMPersona: (result: LLMPersonaResult | null) => void;
  setStory: (result: StoryResult | null) => void;
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

      setRefineAnswer: (id, val) =>
        set((state) => ({
          refineAnswers: { ...state.refineAnswers, [id]: val },
          lastSavedAt: Date.now(),
        })),

      setBirthdate: (date) => set({ birthdate: date, llmPersona: null, story: null }),
      setLLMPersona: (result) => set({ llmPersona: result }),
      setStory: (result) => set({ story: result }),
    }),
    {
      name: 'selfscape-v1',
      version: 2,
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
        return state;
      },
    },
  ),
);

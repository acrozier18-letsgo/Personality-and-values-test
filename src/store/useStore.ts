import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answer } from '../engine/scoring';
import type { LLMPersonaResult } from '../services/openai';

// API key lives in its own localStorage key so it never ends up in exports
const API_KEY_STORAGE = 'selfscape-openai-key';

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
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

  answer: (id: string, val: Answer) => void;
  goTo: (index: number) => void;
  reset: () => void;
  setRefineAnswer: (id: string, val: number) => void;
  setBirthdate: (date: string) => void;
  setLLMPersona: (result: LLMPersonaResult | null) => void;
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
          // birthdate intentionally kept — user doesn't need to re-enter it
        }),

      setRefineAnswer: (id, val) =>
        set((state) => ({
          refineAnswers: { ...state.refineAnswers, [id]: val },
          lastSavedAt: Date.now(),
        })),

      setBirthdate: (date) => set({ birthdate: date, llmPersona: null }),
      setLLMPersona: (result) => set({ llmPersona: result }),
    }),
    { name: 'selfscape-v1' },
  ),
);

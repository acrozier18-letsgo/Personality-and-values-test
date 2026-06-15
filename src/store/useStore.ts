import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answer } from '../engine/scoring';

interface StoreState {
  answers: Record<string, Answer>;
  cursor: number;
  startedAt: number | null;
  lastSavedAt: number | null;
  refineAnswers: Record<string, number>;

  answer: (id: string, val: Answer) => void;
  goTo: (index: number) => void;
  reset: () => void;
  setRefineAnswer: (id: string, val: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      answers: {},
      cursor: 0,
      startedAt: null,
      lastSavedAt: null,
      refineAnswers: {},

      answer: (id, val) =>
        set((state) => ({
          answers: { ...state.answers, [id]: val },
          cursor: state.cursor,
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
        }),

      setRefineAnswer: (id, val) =>
        set((state) => ({
          refineAnswers: { ...state.refineAnswers, [id]: val },
          lastSavedAt: Date.now(),
        })),
    }),
    { name: 'selfscape-v1' },
  ),
);

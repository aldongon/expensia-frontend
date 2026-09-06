'use client';

import { create } from 'zustand';

export type RecurringFilterMode = 'incluir' | 'excluir' | 'solo';

interface ExpenseFiltersState {
  selectedTags: string[] | null; // null = every tag/chip selected
  recMode: RecurringFilterMode;
  setSelectedTags: (tags: string[] | null) => void;
  toggleTag: (tag: string, allChipNames: string[]) => void;
  setRecMode: (mode: RecurringFilterMode) => void;
}

/** Filters for the Gastos "Selección" view. Kept in a store so they survive switching tabs. */
export const useExpenseFiltersStore = create<ExpenseFiltersState>((set) => ({
  selectedTags: null,
  recMode: 'incluir',
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  toggleTag: (tag, allChipNames) =>
    set((state) => {
      const current = state.selectedTags ?? allChipNames;
      const active = current.includes(tag);

      return {
        selectedTags: active ? current.filter((name) => name !== tag) : current.concat(tag),
      };
    }),
  setRecMode: (mode) => set({ recMode: mode }),
}));

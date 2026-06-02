import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Domain } from "@/data/items";
import type { Algorithm, Feedback } from "@/lib/recommendationEngine";

interface AppState {
  domain: Domain;
  algorithm: Algorithm;
  onboarded: Record<Domain, boolean>;
  feedback: Record<Domain, Record<string, Feedback>>;
  // filters
  selectedTags: string[];
  minRating: number;
  yearRange: [number, number];
  priceRange: [number, number];
  search: string;

  setDomain: (d: Domain) => void;
  setAlgorithm: (a: Algorithm) => void;
  setOnboarded: (d: Domain, v: boolean) => void;
  setFeedback: (d: Domain, id: string, f: Feedback) => void;
  clearFeedbackFor: (d: Domain) => void;
  resetAll: () => void;
  setTags: (tags: string[]) => void;
  setMinRating: (n: number) => void;
  setYearRange: (r: [number, number]) => void;
  setPriceRange: (r: [number, number]) => void;
  setSearch: (s: string) => void;
}

const initial = {
  domain: "movies" as Domain,
  algorithm: "content" as Algorithm,
  onboarded: { movies: false, books: false, products: false },
  feedback: { movies: {}, books: {}, products: {} },
  selectedTags: [] as string[],
  minRating: 0,
  yearRange: [1980, 2025] as [number, number],
  priceRange: [0, 2000] as [number, number],
  search: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setDomain: (domain) =>
        set({
          domain,
          selectedTags: [],
          search: "",
          minRating: 0,
        }),
      setAlgorithm: (algorithm) => set({ algorithm }),
      setOnboarded: (d, v) =>
        set((s) => ({ onboarded: { ...s.onboarded, [d]: v } })),
      setFeedback: (d, id, f) =>
        set((s) => ({
          feedback: { ...s.feedback, [d]: { ...s.feedback[d], [id]: f } },
        })),
      clearFeedbackFor: (d) =>
        set((s) => ({
          feedback: { ...s.feedback, [d]: {} },
          onboarded: { ...s.onboarded, [d]: false },
        })),
      resetAll: () => set({ ...initial }),
      setTags: (selectedTags) => set({ selectedTags }),
      setMinRating: (minRating) => set({ minRating }),
      setYearRange: (yearRange) => set({ yearRange }),
      setPriceRange: (priceRange) => set({ priceRange }),
      setSearch: (search) => set({ search }),
    }),
    { name: "recsys-app", skipHydration: true },
  ),
);

if (typeof window !== "undefined") {
  void useAppStore.persist.rehydrate();
}

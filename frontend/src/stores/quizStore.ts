import { create } from "zustand";

export const quizStore = create<Record<string, unknown>>(() => ({}));

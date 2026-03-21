import { create } from "zustand";

export const playerStore = create<Record<string, unknown>>(() => ({}));

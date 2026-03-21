import { create } from "zustand";

interface PlayerState {
  sidebarOpen: boolean;
  activeCourseId: string | null;
  activeLessonId: string | null;
  elapsedSeconds: number;
  visibilityPaused: boolean;
  toggleSidebar: () => void;
  setActiveLesson: (courseId: string, lessonId: string) => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setVisibilityPaused: (paused: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sidebarOpen: true,
  activeCourseId: null,
  activeLessonId: null,
  elapsedSeconds: 0,
  visibilityPaused: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveLesson: (courseId, lessonId) =>
    set({
      activeCourseId: courseId,
      activeLessonId: lessonId,
      elapsedSeconds: 0,
    }),
  resetTimer: () => set({ elapsedSeconds: 0 }),
  tickTimer: () => {
    if (get().visibilityPaused) {
      return;
    }
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },
  setVisibilityPaused: (paused) => set({ visibilityPaused: paused }),
}));

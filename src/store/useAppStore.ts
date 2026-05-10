import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InterviewSession, TranscriptMessage, InterviewReportData } from '../types';

interface AppState {
  pastSessions: InterviewSession[];
  currentSession: InterviewSession | null;
  setCurrentSession: (session: InterviewSession) => void;
  updateCurrentSession: (updates: Partial<InterviewSession>) => void;
  addTranscriptMessage: (message: TranscriptMessage) => void;
  endInterviewAndSave: (report: InterviewReportData) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pastSessions: [],
      currentSession: null,
      setCurrentSession: (session) => set({ currentSession: session }),
      updateCurrentSession: (updates) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...updates }
            : null,
        })),
      addTranscriptMessage: (message) =>
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              transcript: [...state.currentSession.transcript, message],
            },
          };
        }),
      endInterviewAndSave: (report) =>
        set((state) => {
          if (!state.currentSession) return state;
          const completedSession: InterviewSession = {
            ...state.currentSession,
            status: 'completed',
            report,
          };
          return {
            pastSessions: [completedSession, ...state.pastSessions],
            currentSession: null, // clear current to go back to dashboard
          };
        }),
      clearHistory: () => set({ pastSessions: [] }),
    }),
    {
      name: 'nexus-ai-interviewer-storage',
    }
  )
);

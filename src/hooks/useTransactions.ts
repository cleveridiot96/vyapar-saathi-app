"use client";

import { useAppState } from './useAppState';

// This hook now acts as a simple facade to the unified Zustand store.
// It provides a consistent API for components while the underlying state
// is managed by Zustand. This makes future refactoring easier if needed.
export function useTransactions() {
  const state = useAppState();
  return state;
}

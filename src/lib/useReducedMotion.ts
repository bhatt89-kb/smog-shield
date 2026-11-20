"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

// Server snapshot is false so server and first client render match
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
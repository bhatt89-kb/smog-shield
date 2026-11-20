"use client";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Loaded only in the browser, after first render, so it never blocks the page
const LightRays = dynamic(() => import("@/components/LightRays"), { ssr: false });

const WIDE = "(min-width: 768px)";

function subscribeWide(onChange: () => void) {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

export default function BackgroundRays() {
  const reduced = useReducedMotion();
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);

  // Skip for reduced-motion users and small screens (saves battery and keeps Lighthouse high)
  if (reduced || !wide) return null;

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 -z-10 h-[70vh] opacity-80">
      <LightRays
  raysOrigin="top-center"
  raysColor="#ffffff"
  raysSpeed={0.8}
  lightSpread={0.6}
  rayLength={2.5}
  glow={0.5}
  haze={0.2}
  followMouse
  mouseInfluence={0.1}
  rayDensity={1}
  raySharpness={0.35}
  atmosphere={1}
  intensity={0.6}
  fadeDistance={1}
  noiseAmount={0}
  distortion={0}
  pulsating={false}
  lightMode={false}
/>
    </div>
  );
}
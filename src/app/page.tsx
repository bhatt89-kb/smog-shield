"use client";
import { useRef, useState } from "react";
import RotatingText from "@/components/RotatingText";
import ThoughtLine from "@/components/ThoughtLine";
import GlowCard from "@/components/GlowCard";
import LifestyleForm from "@/components/LifestyleForm";
import StatsLedger from "@/components/StatsLedger";
import ActionCard from "@/components/ActionCard";
import ImpactChart from "@/components/ImpactChart";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { readJson } from "@/lib/http";
import { buildLedger } from "@/lib/stats";
import type { Advice, Aqi, LifestyleInput } from "@/lib/schemas";

const AQI_LABEL = ["", "Good", "Fair", "Moderate", "Poor", "Very poor"];
const AQI_BORDER = [
  "",
  "border-emerald-400",
  "border-lime-300",
  "border-amber-300",
  "border-orange-400",
  "border-red-400",
];

const STEPS = ["Checking live air quality", "Matching your household", "Drafting your action plan"];
const PHRASES = ["Breathe safer.", "Cut emissions.", "Clean your air.", "Protect your family."];

const placeName = (a: Aqi) => [a.city, a.state, a.country].filter(Boolean).join(", ");

type Result = { aqi: Aqi; advice: Advice; fallback?: boolean };

export default function Home() {
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function submit(input: LifestyleInput) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await readJson<Partial<Result> & { error?: string }>(res);
      if (!res.ok || !json || !json.advice || !json.aqi) {
        throw new Error(
          json?.error ??
            (res.ok
              ? "The server sent an empty response. Please try again."
              : `Request failed (${res.status}). Please try again.`),
        );
      }
      setData(json as Result);
      setTimeout(() => resultRef.current?.focus(), 0); // move focus to results for keyboard/screen-reader users
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Real heading for assistive tech; the rotating copy is decorative */}
      <h1 className="sr-only">Smog Shield AI: breathe safer this winter</h1>
      <div
        aria-hidden="true"
        className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-4xl font-bold sm:text-5xl"
      >
        <span>Winter smog?</span>
        {reduced ? (
          <span>{PHRASES[0]}</span>
        ) : (
          <RotatingText
            texts={PHRASES}
            effect="slide"
            direction="up"
            highlight
            highlightColor="#a855f7"
            staggerFrom="last"
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            rotationInterval={2200}
            splitBy="characters"
            blur={0}
            auto
            loop
            pauseOnHover={false}
          />
        )}
      </div>
      <p className="mb-8 max-w-2xl text-neutral-200">
        Get a personalised plan of low-emission routines, indoor air hacks and sustainable swaps,
        based on live air quality in your city.
      </p>

      <LifestyleForm onSubmit={submit} loading={loading} />

      {/* Screen-reader status; the visual progress line is below */}
      <p role="status" className="sr-only">
        {loading ? "Analysing air quality and building your plan" : data ? "Your action plan is ready" : ""}
      </p>

      <div className="mt-4">
        {error && (
          <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
            {error}
          </p>
        )}
      </div>

      {(loading || data) && (
        <div className="mt-6">
          {reduced ? (
            <p className="text-neutral-200">{loading ? "Analysing…" : "Plan ready."}</p>
          ) : (
            <ThoughtLine
              working={loading}
              steps={STEPS}
              label="Analysing…"
              doneLabel="Planned in"
              glyph="sparkle"
              fontSize={16}
              breathPeriod={1.6}
              breathDepth={0.45}
              settleDuration={350}
              settleBlur={2}
              collapsible
              collapseOnSettle
              showTimer
            />
          )}
        </div>
      )}

      {data && (
        <div ref={resultRef} tabIndex={-1} className="mt-8 space-y-6 outline-none">
          <GlowCard>
            <section
              aria-labelledby="aqi-h"
              className={`border-l-4 pl-4 ${
                data.fallback ? "border-neutral-400" : AQI_BORDER[data.aqi.aqiIndex]
              }`}
            >
              {data.fallback ? (
                <>
                  <h2 id="aqi-h" className="text-xl font-semibold">
                    {data.aqi.city}: general guidance
                  </h2>
                  <p className="mt-1">
                    Live air data and AI advice are unavailable right now, so these are general tips.
                  </p>
                </>
              ) : (
                <>
                  <h2 id="aqi-h" className="text-xl font-semibold">
                    {placeName(data.aqi)}: air quality {AQI_LABEL[data.aqi.aqiIndex]}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-300">
                    Not the right place? Add a country code, like &quot;Dehradun, IN&quot;.
                  </p>
                </>
              )}
              <p className="mt-4 font-medium">{data.advice.healthAlert}</p>
              <p className="mt-2 text-neutral-200">{data.advice.summary}</p>
            </section>
          </GlowCard>

          <StatsLedger
            title="Your air and your plan, by the numbers"
            rows={buildLedger(data.aqi, data.advice, data.fallback)}
            note="WHO figures are the 2021 24-hour guidelines; live readings are a current snapshot. Impact figures are estimates."
          />

          <ImpactChart actions={data.advice.actions} />

          <section aria-labelledby="plan-h" className="space-y-4">
            <h2 id="plan-h" className="text-xl font-semibold">
              Your action plan
            </h2>
            {data.advice.actions.map((a) => (
              <ActionCard key={a.id} action={a} />
            ))}
          </section>
        </div>
      )}
    </>
  );
}
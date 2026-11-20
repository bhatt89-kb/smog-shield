"use client";
import { useRef, useState } from "react";
import LifestyleForm from "@/components/LifestyleForm";
import ActionCard from "@/components/ActionCard";
import ImpactChart from "@/components/ImpactChart";
import type { Advice, Aqi, LifestyleInput } from "@/lib/schemas";

const AQI_LABEL = ["", "Good", "Fair", "Moderate", "Poor", "Very poor"];

type Result = { aqi: Aqi; advice: Advice; fallback?: boolean };

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function submit(input: LifestyleInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setData(json);
      setTimeout(() => resultRef.current?.focus(), 0); // move focus to results for keyboard/screen-reader users
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Breathe safer this winter</h1>
      <p className="mb-6 text-slate-200">
        Get a personalised plan of low-emission routines, indoor air hacks and sustainable swaps,
        based on live air quality in your city.
      </p>
      <LifestyleForm onSubmit={submit} loading={loading} />

      <div aria-live="polite" className="mt-4">
        {error && (
          <p role="alert" className="rounded-md bg-red-950 p-3 text-red-200">
            {error}
          </p>
        )}
      </div>

      {data && (
        <div ref={resultRef} tabIndex={-1} className="mt-8 space-y-6 outline-none">
          <section aria-labelledby="aqi-h" className="rounded-xl border-2 border-amber-300 p-5">
            {data.fallback ? (
              <>
                <h2 id="aqi-h" className="text-xl font-semibold">{data.aqi.city}: general guidance</h2>
                <p>Live air data and AI advice are unavailable right now, so these are general tips.</p>
              </>
            ) : (
              <>
                <h2 id="aqi-h" className="text-xl font-semibold">
                  {data.aqi.city}: air quality {AQI_LABEL[data.aqi.aqiIndex]}
                </h2>
                <p>
                  PM2.5 {data.aqi.pm25.toFixed(0)} µg/m³ · PM10 {data.aqi.pm10.toFixed(0)} µg/m³
                </p>
              </>
            )}
            <p className="mt-2 font-medium">{data.advice.healthAlert}</p>
            <p className="mt-2">{data.advice.summary}</p>
          </section>

          <ImpactChart actions={data.advice.actions} />

          <section aria-labelledby="plan-h" className="space-y-4">
            <h2 id="plan-h" className="text-xl font-semibold">Your action plan</h2>
            {data.advice.actions.map((a) => (
              <ActionCard key={a.id} action={a} />
            ))}
          </section>
        </div>
      )}
    </>
  );
}
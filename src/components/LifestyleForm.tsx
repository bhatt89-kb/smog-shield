"use client";
import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import CityInput from "@/components/CityInput";
import { LifestyleInputSchema, type LifestyleInput } from "@/lib/schemas";

type Props = { onSubmit: (v: LifestyleInput) => void; loading: boolean };

const field =
  "w-full rounded-md border border-neutral-600 bg-black p-2 text-white placeholder:text-neutral-400";

const SELECTS = [
  ["commute", "Main commute", [["walk_cycle", "Walk / cycle"], ["public_transport", "Public transport"], ["two_wheeler", "Two-wheeler"], ["car", "Car"]]],
  ["cooking", "Cooking fuel", [["lpg", "LPG"], ["piped_gas", "Piped gas"], ["induction", "Induction / electric"], ["biomass", "Wood / biomass"]]],
  ["heating", "Winter heating", [["none", "None"], ["electric", "Electric heater"], ["gas", "Gas heater"], ["biomass_or_coal", "Wood / coal"]]],
  ["language", "Language", [["en", "English"], ["hi", "हिन्दी"]]],
] as const;

export default function LifestyleForm({ onSubmit, loading }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = LifestyleInputSchema.safeParse({
      city: f.get("city"),
      householdSize: Number(f.get("householdSize")),
      hasChildrenOrElderly: f.get("vulnerable") === "on",
      commute: f.get("commute"),
      cooking: f.get("cooking"),
      heating: f.get("heating"),
      hasPurifier: f.get("purifier") === "on",
      language: f.get("language"),
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[String(i.path[0])] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <GlowCard>
      <form onSubmit={handle} noValidate aria-busy={loading} className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Tell us about your household</legend>

          <CityInput error={errors.city} fieldClass={field} />

          <div>
            <label htmlFor="householdSize" className="mb-1 block font-medium">
              People in household
            </label>
            <input
              id="householdSize"
              name="householdSize"
              type="number"
              min={1}
              max={20}
              defaultValue={4}
              className={field}
            />
          </div>

          {SELECTS.map(([name, label, opts]) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block font-medium">
                {label}
              </label>
              <select id={name} name={name} className={field}>
                {opts.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <label className="flex items-center gap-2">
            <input type="checkbox" name="vulnerable" className="h-5 w-5" /> Children or elderly at home
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="purifier" className="h-5 w-5" /> I already have an air purifier
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-white px-5 py-3 font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-60"
        >
          {loading ? "Analysing air quality…" : "Get my action plan"}
        </button>
      </form>
    </GlowCard>
  );
}
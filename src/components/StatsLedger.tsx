"use client";
import CountUp from "@/components/CountUp";
import GlowCard from "@/components/GlowCard";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { LedgerRow } from "@/lib/stats";

type Props = { title: string; rows: LedgerRow[]; note?: string };

function Value({ row, reduced }: { row: LedgerRow; reduced: boolean }) {
  if (typeof row.value === "number" && row.animate && !reduced) {
    return (
      <>
        {/* The counting animation is hidden from screen readers; the final value is read once */}
        <span aria-hidden="true">
          <CountUp to={row.value} duration={1.5} />
        </span>
        <span className="sr-only">{row.value}</span>
      </>
    );
  }
  return <>{row.value}</>;
}

export default function StatsLedger({ title, rows, note }: Props) {
  const reduced = useReducedMotion();
  if (rows.length === 0) return null;

  return (
    <GlowCard>
      <section aria-labelledby="ledger-h">
        <h2 id="ledger-h" className="text-xl font-semibold">
          {title}
        </h2>
        <dl className="mt-3 divide-y divide-neutral-800">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 py-5"
            >
              <dt className="min-w-0">
                <span className="block text-sm font-semibold uppercase tracking-widest text-violet-300">
                  {row.label}
                </span>
                <span className="mt-1 block text-sm text-neutral-300">{row.caption}</span>
              </dt>
              <dd className="text-right text-5xl font-bold leading-none tabular-nums sm:text-6xl">
                <Value row={row} reduced={reduced} />
                {row.unit && (
                  <span className="ml-1 text-base font-normal text-neutral-300">{row.unit}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {note && <p className="mt-2 text-xs text-neutral-400">{note}</p>}
      </section>
    </GlowCard>
  );
}
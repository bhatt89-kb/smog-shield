import { memo } from "react";
import GlowCard from "@/components/GlowCard";
import type { Action } from "@/lib/schemas";

const LABEL = {
  routine: "Daily routine",
  indoor: "Indoor air hack",
  sustainable: "Sustainable swap",
} as const;

const ICON = { routine: "🚶", indoor: "🏠", sustainable: "🌱" } as const;

function ActionCardBase({ action }: { action: Action }) {
  const hid = `h-${action.id}`;
  return (
    <GlowCard>
      <article aria-labelledby={hid}>
        <p className="text-sm uppercase tracking-wide text-violet-300">
          <span aria-hidden="true">{ICON[action.category]} </span>
          {LABEL[action.category]} · {action.effort} effort
        </p>
        <h3 id={hid} className="mt-1 text-lg font-semibold">
          {action.title}
        </h3>
        <ol className="my-3 list-decimal space-y-1 pl-5">
          {action.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p>
          <strong>Why it works:</strong> {action.whyItWorks}
        </p>
        <p className="mt-3 rounded-md border border-violet-400/30 bg-violet-400/10 p-3">
          <strong>Direct impact:</strong> ≈{Math.round(action.impact.estimatedReductionPercent)}% lower{" "}
          {action.impact.metric}. {action.impact.explanation}
        </p>
      </article>
    </GlowCard>
  );
}

export default memo(ActionCardBase);
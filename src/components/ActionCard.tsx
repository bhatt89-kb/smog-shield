import { memo } from "react";
import type { Action } from "@/lib/schemas";

const LABEL = {
  routine: "Daily routine",
  indoor: "Indoor air hack",
  sustainable: "Sustainable swap",
} as const;

function ActionCardBase({ action }: { action: Action }) {
  const hid = `h-${action.id}`;
  return (
    <article aria-labelledby={hid} className="rounded-xl bg-[var(--card)] p-5">
      <p className="text-sm uppercase tracking-wide text-sky-300">
        {LABEL[action.category]} · {action.effort} effort
      </p>
      <h3 id={hid} className="mt-1 text-lg font-semibold">{action.title}</h3>
      <ol className="my-3 list-decimal space-y-1 pl-5">
        {action.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p><strong>Why it works:</strong> {action.whyItWorks}</p>
      <p className="mt-2 rounded-md bg-slate-800 p-3">
        <strong>Direct impact:</strong> ≈{Math.round(action.impact.estimatedReductionPercent)}% lower{" "}
        {action.impact.metric}. {action.impact.explanation}
      </p>
    </article>
  );
}

export default memo(ActionCardBase);
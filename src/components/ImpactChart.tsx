import type { Action } from "@/lib/schemas";

// Plain HTML/CSS bars: no chart library, and a real table for screen readers.
export default function ImpactChart({ actions }: { actions: Action[] }) {
  const sorted = [...actions].sort(
    (a, b) => b.impact.estimatedReductionPercent - a.impact.estimatedReductionPercent,
  );
  return (
    <section aria-labelledby="impact-h" className="rounded-xl bg-[var(--card)] p-5">
      <h2 id="impact-h" className="mb-3 text-xl font-semibold">Estimated impact of each action</h2>
      <table className="w-full text-left">
        <caption className="sr-only">
          Estimated percentage reduction in exposure or emissions per action
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Action</th>
            <th scope="col">Reduction</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className="align-middle">
              <th scope="row" className="w-1/2 py-2 pr-3 font-normal">{a.title}</th>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 flex-1 rounded bg-slate-700" aria-hidden="true">
                    <div
                      className="h-3 rounded bg-sky-400"
                      style={{ width: `${a.impact.estimatedReductionPercent}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-semibold">
                    {Math.round(a.impact.estimatedReductionPercent)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
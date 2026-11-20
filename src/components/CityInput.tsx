"use client";
import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; value: string };

const POPULAR: Suggestion[] = [
  { label: "Delhi, India", value: "Delhi, IN" },
  { label: "Dehradun, India", value: "Dehradun, IN" },
  { label: "Lucknow, India", value: "Lucknow, IN" },
  { label: "Kanpur, India", value: "Kanpur, IN" },
  { label: "Patna, India", value: "Patna, IN" },
  { label: "Kolkata, India", value: "Kolkata, IN" },
  { label: "Lahore, Pakistan", value: "Lahore, PK" },
  { label: "Dhaka, Bangladesh", value: "Dhaka, BD" },
];

type Props = { error?: string; fieldClass: string };

export default function CityInput({ error, fieldClass }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [active, setActive] = useState(-1);
  const justPicked = useRef(false);

  // Debounced live search; cancelled whenever the text changes again
  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("search_failed");
        const json = await res.json();
        setFetched(Array.isArray(json.suggestions) ? json.suggestions : []);
      } catch {
        if (ctrl.signal.aborted) return;
        setFetched([]);
      }
      if (!ctrl.signal.aborted) {
        setSearched(true);
        setActive(-1);
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  function pick(s: Suggestion) {
    justPicked.current = true;
    setValue(s.value);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && open && active >= 0 && items[active]) {
      e.preventDefault(); // select instead of submitting the form
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isPopular = value.trim().length < 2;
  const items = isPopular ? POPULAR : fetched;
  const showList = open && items.length > 0;
  const showEmpty = open && !isPopular && !loading && searched && items.length === 0;

  return (
    <div>
      <label htmlFor="city" className="mb-1 block font-medium">
        City
      </label>
      <input
        id="city"
        name="city"
        role="combobox"
        aria-expanded={showList}
        aria-controls="city-list"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `city-opt-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? "city-hint city-err" : "city-hint"}
        autoComplete="off"
        required
        placeholder="Tap to pick a city, or type"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setActive(-1);
          if (e.target.value.trim().length < 2) {
            setSearched(false);
            setLoading(false);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={fieldClass}
      />
      <p id="city-hint" className="mt-1 text-sm text-neutral-300">
        Tip: pick a suggestion, or add a country code like &quot;Dehradun, IN&quot;.
      </p>
      {error && (
        <p id="city-err" role="alert" className="mt-1 text-red-300">
          {error}
        </p>
      )}

      <p role="status" className="sr-only">
        {loading ? "Searching cities" : showList ? `${items.length} suggestions available` : ""}
      </p>

      {showList && (
        <>
          <p aria-hidden="true" className="mt-2 text-xs uppercase tracking-wide text-neutral-400">
            {isPopular ? "Popular cities" : loading ? "Searching…" : "Suggestions"}
          </p>
          <ul
            id="city-list"
            role="listbox"
            aria-label={isPopular ? "Popular cities" : "City suggestions"}
            className="mt-1 max-h-56 overflow-auto rounded-md border border-neutral-600 bg-black"
          >
            {items.map((s, i) => (
              <li
                key={s.label}
                id={`city-opt-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown + preventDefault keeps focus in the input so blur doesn't close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3 py-2 ${
                  i === active ? "bg-neutral-800 text-white" : "text-neutral-200"
                }`}
              >
                {s.label}
              </li>
            ))}
          </ul>
        </>
      )}

      {showEmpty && (
        <p className="mt-2 text-sm text-neutral-300">
          No matches. Try adding a country code, like &quot;Dehradun, IN&quot;.
        </p>
      )}
    </div>
  );
}
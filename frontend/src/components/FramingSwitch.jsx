import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight, Check } from "lucide-react";

export default function FramingSwitch({ apiBase }) {
  const [pair, setPair] = useState(null);
  const [voted, setVoted] = useState(null); // "A" | "B" | null
  const [tally, setTally] = useState({ A: 0, B: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      axios.get(`${apiBase}/exp/framing/sample`),
      axios.get(`${apiBase}/exp/framing/tally`),
    ])
      .then(([s, t]) => {
        if (!alive) return;
        setPair(s.data);
        setTally(t.data);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [apiBase]);

  const vote = async (choice) => {
    if (voted) return;
    setVoted(choice);
    try {
      const r = await axios.post(`${apiBase}/exp/framing`, {
        choice,
        pair_id: pair?.pair_id,
      });
      setTally(r.data.tally);
    } catch {
      setVoted(null);
    }
  };

  if (loading || !pair) return null;

  const pctA = tally.total ? Math.round((tally.A / tally.total) * 100) : 0;
  const pctB = tally.total ? Math.round((tally.B / tally.total) * 100) : 0;

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28 border-t border-[#E5D2C7]"
      data-testid="exp-framing-section"
      id="exp-framing"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up">
          <span className="editorial-numeral text-[#D9C4B7] text-3xl">01</span>
          <div>
            <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
              Experiment 01 &middot; The Framing Switch
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] mt-2 tracking-[-0.015em]">
              Same information. <span className="italic">Different feeling.</span>
            </h2>
          </div>
        </div>

        <p className="mt-6 text-lg text-[#3a302b] max-w-2xl leading-relaxed">
          Two notifications. Both true. Tap the one that hits harder.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          <FrameCard
            label="VERSION A"
            sub="Productivity framing"
            text={pair.productivity}
            chosen={voted === "A"}
            disabled={!!voted}
            onPick={() => vote("A")}
            pct={voted ? pctA : null}
            count={voted ? tally.A : null}
            testId="frame-card-A"
          />
          <FrameCard
            label="VERSION B"
            sub="Anxiety-removal framing"
            text={pair.anxiety_removal}
            chosen={voted === "B"}
            disabled={!!voted}
            onPick={() => vote("B")}
            pct={voted ? pctB : null}
            count={voted ? tally.B : null}
            highlight
            testId="frame-card-B"
          />
        </div>

        <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
          <p className="font-display text-2xl sm:text-3xl">
            {voted ? (
              <>
                Your answer is the data.{" "}
                <span className="italic text-[#6B5F58]">
                  ({tally.total} {tally.total === 1 ? "vote" : "votes"} so far.)
                </span>
              </>
            ) : (
              "Which one made you feel something?"
            )}
          </p>
          {voted && (
            <span className="tag-soft" data-testid="framing-voted-badge">
              <Check className="w-3.5 h-3.5 text-[#6E8B5A]" />
              <span>You voted Version {voted}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function FrameCard({
  label,
  sub,
  text,
  chosen,
  disabled,
  onPick,
  pct,
  count,
  highlight,
  testId,
}) {
  const showResults = pct !== null;
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`relative text-left bg-white/80 border rounded-3xl p-7 lg:p-8 transition-all duration-300 ${
        chosen
          ? "border-[#1A1614] shadow-[0_2px_0_0_#1A1614] -translate-y-0.5"
          : "border-[#E5D2C7] hover:border-[#1A1614] hover:-translate-y-0.5"
      } ${disabled && !chosen ? "opacity-70" : ""}`}
      data-testid={testId}
    >
      {showResults && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 rounded-b-3xl"
          style={{
            background: highlight ? "var(--accent-cold)" : "var(--accent-cool)",
            width: `${pct}%`,
            transition: "width 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A89B92]">
          {label}
        </span>
        {chosen && (
          <span className="text-xs italic text-[#6E8B5A]">your pick</span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl lg:text-3xl leading-[1.18] text-[#1A1614]">
        &ldquo;{text}&rdquo;
      </p>
      <p className="mt-3 italic text-sm text-[#6B5F58]">{sub}</p>
      {showResults && (
        <div className="mt-5 flex items-center justify-between text-sm text-[#3a302b]">
          <span className="tabular-nums font-display text-2xl">{pct}%</span>
          <span className="italic text-[#6B5F58]">{count} chose this</span>
        </div>
      )}
    </button>
  );
}

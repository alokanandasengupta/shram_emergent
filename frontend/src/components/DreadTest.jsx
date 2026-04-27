import { useEffect, useState } from "react";
import axios from "axios";
import { Check } from "lucide-react";
import ThinkingTab from "@/components/ThinkingTab";

const BUCKET_TITLES = {
  investor:    "The investor",
  contractor:  "The contractor",
  warm_intro:  "The warm intro",
};

export default function DreadTest({ apiBase }) {
  const [sample, setSample] = useState(null);
  const [voted, setVoted] = useState(null);
  const [tally, setTally] = useState({ investor: 0, contractor: 0, warm_intro: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      axios.get(`${apiBase}/exp/dread/sample`),
      axios.get(`${apiBase}/exp/dread/tally`),
    ])
      .then(([s, t]) => {
        if (!alive) return;
        setSample(s.data);
        setTally(t.data);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [apiBase]);

  const vote = async (bucket) => {
    if (voted) return;
    setVoted(bucket);
    try {
      const r = await axios.post(`${apiBase}/exp/dread`, {
        bucket,
        sample_id: sample?.sample_id,
      });
      setTally(r.data.tally);
    } catch {
      setVoted(null);
    }
  };

  if (loading || !sample) return null;

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28 border-t border-[#E5D2C7] bg-[#EFD9CF]/30"
      data-testid="exp-dread-section"
      id="exp-dread"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up">
          <span className="editorial-numeral text-[#D9C4B7] text-3xl">02</span>
          <div>
            <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
              Experiment 02 &middot; The Dread Naming Test
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] mt-2 tracking-[-0.015em]">
              Which would you most hate <br />
              to have <span className="italic">forgotten</span>?
            </h2>
          </div>
        </div>

        <p className="mt-6 text-lg text-[#3a302b] max-w-2xl leading-relaxed">
          Three threads. All real shapes of dread. Pick the one that makes
          your stomach drop the hardest.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {sample.cards.map((card) => {
            const pct =
              tally.total > 0 ? Math.round(((tally[card.bucket] || 0) / tally.total) * 100) : 0;
            return (
              <DreadCard
                key={card.bucket}
                card={card}
                title={BUCKET_TITLES[card.bucket] || card.bucket}
                chosen={voted === card.bucket}
                disabled={!!voted}
                onPick={() => vote(card.bucket)}
                pct={voted ? pct : null}
                count={voted ? tally[card.bucket] : null}
              />
            );
          })}
        </div>

        {voted && (
          <div
            className="mt-10 flex items-center gap-3 flex-wrap"
            data-testid="dread-voted-summary"
          >
            <span className="tag-soft">
              <Check className="w-3.5 h-3.5 text-[#6E8B5A]" />
              <span>You picked: {BUCKET_TITLES[voted]}</span>
            </span>
            <p className="font-display text-xl text-[#6B5F58] italic">
              That&rsquo;s where Shram surfaces first on day one.
            </p>
          </div>
        )}

        <ThinkingTab testId="dread-thinking-tab">
          The Shram thesis assumes the dread is undifferentiated. This
          experiment tests whether it actually has a hierarchy. A
          founder&rsquo;s inbox contains at least three distinct anxiety
          shapes: the investor who has not heard back, the contractor who is
          blocked waiting on an approval, the warm intro that was never
          converted. Each one carries a different emotional weight and a
          different consequence if dropped. Which one the founder most fears
          losing tells Shram which thread type to surface first at
          activation. The warm intro dread suggests Shram should lead with
          relationship capital. The investor dread suggests revenue anxiety
          is the dominant signal. The contractor dread suggests operational
          guilt is the hook. Each answer points to a different
          first-impression design for the product. Kill condition: if all
          three are chosen with roughly equal frequency the dread is
          undifferentiated and Shram should surface threads in chronological
          order by default.
        </ThinkingTab>
      </div>
    </section>
  );
}

function DreadCard({ card, title, chosen, disabled, onPick, pct, count }) {
  const showResults = pct !== null;
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`relative text-left bg-white/85 border rounded-3xl p-6 lg:p-7 transition-all duration-300 flex flex-col h-full ${
        chosen
          ? "border-[#1A1614] -translate-y-0.5"
          : "border-[#E5D2C7] hover:border-[#1A1614] hover:-translate-y-0.5"
      } ${disabled && !chosen ? "opacity-70" : ""}`}
      data-testid={`dread-card-${card.bucket}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A89B92]">
          {title}
        </span>
        {chosen && (
          <span className="text-xs italic text-[#6E8B5A]">your pick</span>
        )}
      </div>
      <h3 className="mt-4 font-display text-2xl lg:text-3xl leading-tight">
        {card.contact_name}
      </h3>
      <p className="text-sm italic text-[#6B5F58] mt-1">
        {card.contact_company || "—"}
      </p>
      <div className="mt-5 pt-5 border-t border-[#E5D2C7]">
        <div className="text-xs uppercase tracking-[0.16em] text-[#A89B92]">
          Subject
        </div>
        <p className="text-base text-[#1A1614] mt-1 line-clamp-2">
          {card.subject}
        </p>
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.16em] text-[#A89B92]">
          Last message
        </div>
        <p className="text-sm font-display italic text-[#1A1614] mt-1 line-clamp-3">
          &ldquo;{card.last_message_preview}&rdquo;
        </p>
        <p className="text-xs italic text-[#A89B92] mt-1">
          {card.days_since_last_message} days ago
        </p>
      </div>
      <div className="flex-1" />
      {showResults && (
        <div className="mt-5 pt-4 border-t border-[#E5D2C7] flex items-center justify-between">
          <span className="font-display text-2xl tabular-nums">{pct}%</span>
          <span className="text-xs italic text-[#6B5F58]">
            {count} chose this
          </span>
        </div>
      )}
    </button>
  );
}

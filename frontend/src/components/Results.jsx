import { useState } from "react";
import { ChevronDown, RotateCcw, ArrowRight } from "lucide-react";

const RISK_STYLE = {
  HIGH: { bar: "#FF3333", label: "HIGH RISK" },
  MEDIUM: { bar: "#FF9500", label: "MEDIUM RISK" },
  LOW: { bar: "#007AFF", label: "LOW RISK" },
};

function relationshipLabel(rel) {
  if (!rel) return "—";
  return rel.toString().replace(/_/g, " ").toUpperCase();
}

export default function Results({ data, onReset }) {
  const cold = data.cold_threads || [];
  const total = data.total_threads_scanned || 0;
  const count = data.cold_count || 0;

  return (
    <section
      className="px-4 sm:px-8 lg:px-16 pt-16 lg:pt-24 pb-10"
      data-testid="results-section"
    >
      {/* Kicker */}
      <div className="flex items-center justify-between fade-up">
        <div className="mono-label" data-testid="results-kicker">
          <span className="inline-block w-2 h-2 bg-[#FF3333] mr-3 align-middle" />
          STAGE 03 / THE REVEAL
        </div>
        <button
          onClick={onReset}
          className="mono-label flex items-center gap-2 hover:text-[#0A0A0A] text-[#555]"
          data-testid="reset-scan-button"
        >
          <RotateCcw className="w-3 h-3" />
          RESCAN
        </button>
      </div>

      {/* Giant number reveal */}
      <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 relative">
          <div
            className="font-display leading-[0.78] tracking-[-0.06em] text-[40vw] sm:text-[34vw] lg:text-[24vw] hammer-in"
            data-testid="cold-count-number"
          >
            {String(count).padStart(2, "0")}
          </div>
          <div
            className="absolute -top-2 -right-2 sm:right-4 lg:right-12 mono-label text-[#FF3333]"
            data-testid="cold-count-tag"
          >
            COLD CONVERSATIONS
          </div>
        </div>
        <div
          className="lg:col-span-5 flex flex-col justify-end fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <h2
            className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase leading-[0.95] tracking-[-0.03em]"
            data-testid="cold-count-headline"
          >
            went <span className="italic">cold</span> in the last 90 days.
          </h2>
          <p className="mt-5 text-base text-[#555] leading-relaxed max-w-md">
            Out of{" "}
            <span className="text-[#0A0A0A] font-bold">{total}</span> threads
            we analysed, here are the people waiting on you &mdash; and the
            ones you forgot were waiting.
          </p>
          <div
            className="mt-6 flex flex-wrap items-center gap-3 mono-label text-[#555]"
            data-testid="risk-distribution"
          >
            <RiskTally items={cold} tier="HIGH" />
            <RiskTally items={cold} tier="MEDIUM" />
            <RiskTally items={cold} tier="LOW" />
          </div>
        </div>
      </div>

      {/* List of cold conversations */}
      <div className="mt-16">
        <div className="flex items-end justify-between border-b-2 border-[#0A0A0A] pb-4">
          <div className="mono-label">HERE IS WHO &mdash;</div>
          <div className="mono-label">SCORED BY GEMINI 3 / FEW-SHOT RAG</div>
        </div>
        <div className="border-b-2 border-[#0A0A0A]" data-testid="cold-list">
          {cold.length === 0 && (
            <div className="py-16 text-center text-[#555] mono-label">
              NO COLD CONVERSATIONS DETECTED &mdash; YOU&rsquo;RE CLEAR
            </div>
          )}
          {cold.map((t, i) => (
            <ColdRow key={t.thread_id} thread={t} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RiskTally({ items, tier }) {
  const n = items.filter((t) => (t.risk_tier || "").toUpperCase() === tier).length;
  const color =
    tier === "HIGH" ? "#FF3333" : tier === "MEDIUM" ? "#FF9500" : "#007AFF";
  return (
    <div
      className="flex items-center gap-2"
      data-testid={`risk-tally-${tier.toLowerCase()}`}
    >
      <span className="w-2 h-2" style={{ background: color }} />
      <span style={{ color }}>{n}</span>
      <span>{tier}</span>
    </div>
  );
}

function ColdRow({ thread, index }) {
  const [open, setOpen] = useState(false);
  const tier = (thread.risk_tier || "LOW").toUpperCase();
  const style = RISK_STYLE[tier] || RISK_STYLE.LOW;

  return (
    <div
      className="border-t border-[#0A0A0A]/15 first:border-t-0 hover:bg-[#EAEAE6]/60 transition-colors"
      data-testid={`cold-row-${thread.thread_id}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left grid grid-cols-12 gap-3 sm:gap-6 py-5 sm:py-7 px-1 sm:px-2 items-center"
        data-testid={`cold-row-toggle-${thread.thread_id}`}
      >
        {/* Index + risk bar */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="w-1 h-10 sm:h-12" style={{ background: style.bar }} />
          <div className="font-mono text-xs sm:text-sm text-[#888] tabular-nums">
            {String(index).padStart(2, "0")}
          </div>
        </div>

        {/* Contact */}
        <div className="col-span-10 sm:col-span-3 min-w-0">
          <div className="mono-label text-[#888] hidden sm:block">CONTACT</div>
          <div
            className="font-display text-lg sm:text-xl truncate"
            data-testid={`cold-row-name-${thread.thread_id}`}
          >
            {thread.contact_name}
          </div>
          <div className="font-mono text-xs text-[#555] truncate">
            {thread.contact_company} &middot;{" "}
            <span className="uppercase tracking-[0.15em]">
              {relationshipLabel(thread.relationship_type)}
            </span>
          </div>
        </div>

        {/* Subject */}
        <div className="col-span-12 sm:col-span-4 min-w-0">
          <div className="mono-label text-[#888] hidden sm:block">SUBJECT</div>
          <div className="text-sm sm:text-base truncate">{thread.subject}</div>
        </div>

        {/* Days */}
        <div className="col-span-6 sm:col-span-2">
          <div className="mono-label text-[#888]">LAST MSG</div>
          <div
            className="font-display text-2xl sm:text-3xl tabular-nums"
            data-testid={`cold-row-days-${thread.thread_id}`}
          >
            {thread.days_since_last_message}
            <span className="font-mono text-xs text-[#888] ml-2">D</span>
          </div>
        </div>

        {/* Risk pill + chevron */}
        <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-3">
          <span
            className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] border"
            style={{
              color: style.bar,
              borderColor: style.bar,
              background: `${style.bar}10`,
            }}
            data-testid={`cold-row-risk-${thread.thread_id}`}
          >
            {tier}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#555] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div
          className="grid grid-cols-12 gap-3 sm:gap-6 pb-7 px-1 sm:px-2"
          data-testid={`cold-row-detail-${thread.thread_id}`}
        >
          <div className="col-span-12 sm:col-span-1" />
          <div className="col-span-12 sm:col-span-7 space-y-4">
            <div>
              <div className="mono-label text-[#888]">LAST MESSAGE</div>
              <div className="text-sm sm:text-base text-[#0A0A0A] mt-1 italic">
                &ldquo;{thread.last_message_preview}&rdquo;
                <span className="not-italic text-[#888] ml-2 font-mono text-xs">
                  &mdash; {thread.last_sender}
                </span>
              </div>
            </div>
            <div>
              <div className="mono-label text-[#888]">WHY IT&rsquo;S COLD</div>
              <div className="text-sm sm:text-base mt-1 flex items-start gap-3">
                <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>{thread.cold_reason}</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-4">
            <div className="brutal-card p-5 bg-[#0A0A0A] text-[#F4F4F0] border-[#0A0A0A]">
              <div className="mono-label text-[#888]">SHRAM WOULD</div>
              <div className="mt-2 text-base">
                {thread.shram_would_flag
                  ? thread.shram_suggested_action ||
                    "Flag and surface this thread to you for action."
                  : "Surface this thread as a check-in for next week."}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
                <Stat tiny label="SCORE" value={thread.cold_score_0_100} />
                <Stat tiny label="THREAD" value={thread.thread_id.replace("THREAD_", "#")} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tiny }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#888]">
        {label}
      </div>
      <div className={`font-display ${tiny ? "text-2xl" : "text-3xl"} mt-1`}>
        {value}
      </div>
    </div>
  );
}

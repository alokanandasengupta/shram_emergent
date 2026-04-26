import { useState } from "react";
import axios from "axios";
import { ChevronDown, Link2, RotateCcw, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const RISK = {
  HIGH:   { color: "#C84630", label: "High" },
  MEDIUM: { color: "#D89B6A", label: "Medium" },
  LOW:    { color: "#5C7A8A", label: "Low" },
};

function relabel(rel) {
  if (!rel) return "—";
  return rel.toString().replace(/_/g, " ");
}

export default function Results({ data, onReset, apiBase, readOnly = false }) {
  const cold = data.cold_threads || [];
  const total = data.total_threads_scanned || 0;
  const count = data.cold_count || 0;
  const sessionId = data.session_id;
  const shareUrl = `${window.location.origin}/r/${sessionId}`;
  const [copied, setCopied] = useState(false);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 pt-16 lg:pt-24 pb-16"
      data-testid="results-section"
    >
      <div className="max-w-5xl mx-auto">
        {/* Eyebrow row */}
        <div className="flex items-center justify-between fade-up flex-wrap gap-4">
          <div className="flex items-center gap-3" data-testid="results-kicker">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84630]" />
            <span className="eyebrow">
              {readOnly ? "A Shram audit, shared with you" : "Your audit"} &mdash;{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyShare}
              className="tag-soft hover:bg-white transition-colors"
              data-testid="copy-share-link"
              title={shareUrl}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#6E8B5A]" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span className="text-sm">{copied ? "Copied" : "Share this"}</span>
            </button>
            {!readOnly && (
              <button
                onClick={onReset}
                className="tag-soft hover:bg-white transition-colors"
                data-testid="reset-scan-button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-sm">Rescan</span>
              </button>
            )}
          </div>
        </div>

        {/* Editorial reveal */}
        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <h2
              className="font-display leading-[0.95] tracking-[-0.02em] text-5xl sm:text-7xl lg:text-[88px] serene-in"
              data-testid="cold-count-headline"
            >
              <span data-testid="cold-count-number">{count}</span>{" "}
              <span className="italic">conversations</span> went cold
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-[#3a302b] max-w-xl leading-relaxed">
              Out of <strong>{total}</strong> threads we read across the last
              90 days. Here are the people quietly waiting on you.
            </p>
          </div>

          <div className="lg:col-span-5 fade-up" style={{ animationDelay: "300ms" }}>
            <div className="bg-[#FFFFFF]/70 border border-[#E5D2C7] rounded-3xl p-6">
              <div className="eyebrow not-italic uppercase tracking-[0.18em] text-xs">
                Risk distribution
              </div>
              <div className="mt-4 space-y-3" data-testid="risk-distribution">
                <RiskBar items={cold} tier="HIGH" />
                <RiskBar items={cold} tier="MEDIUM" />
                <RiskBar items={cold} tier="LOW" />
              </div>
              <div className="mt-5 pt-5 border-t border-[#E5D2C7] eyebrow text-xs tracking-[0.06em] not-italic flex items-center gap-2">
                <span>scored by Gemini 3 &middot; few-shot in-context</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cold list */}
        <div className="mt-20 lg:mt-28">
          <div className="flex items-end justify-between border-b border-[#1A1614] pb-5">
            <h3 className="font-display text-3xl lg:text-4xl">Here is who.</h3>
            <span className="eyebrow hidden sm:block">
              ranked by who is waiting longest
            </span>
          </div>
          <div data-testid="cold-list">
            {cold.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-display text-3xl italic text-[#6B5F58]">
                  Your inbox is calm. Nothing is waiting on you.
                </p>
              </div>
            ) : (
              cold.map((t, i) => (
                <ColdRow
                  key={t.thread_id}
                  thread={t}
                  index={i + 1}
                  apiBase={apiBase}
                  sessionId={sessionId}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RiskBar({ items, tier }) {
  const n = items.filter((t) => (t.risk_tier || "").toUpperCase() === tier).length;
  const total = items.length || 1;
  const pct = (n / total) * 100;
  const meta = RISK[tier];
  return (
    <div
      className="flex items-center gap-3"
      data-testid={`risk-tally-${tier.toLowerCase()}`}
    >
      <div className="w-16 text-sm text-[#3a302b]">{meta.label}</div>
      <div className="flex-1 h-1 bg-[#EFE0D5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: meta.color }}
        />
      </div>
      <div className="w-6 text-right font-display text-lg tabular-nums">{n}</div>
    </div>
  );
}

function ColdRow({ thread, index, apiBase, sessionId, readOnly }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const tier = (thread.risk_tier || "LOW").toUpperCase();
  const meta = RISK[tier] || RISK.LOW;

  const draftReply = async () => {
    if (drafting) return;
    setDrafting(true);
    try {
      const r = await axios.post(
        `${apiBase}/draft/${sessionId}/${thread.thread_id}`
      );
      setDraft(r.data.draft);
    } catch {
      toast.error("Couldn't draft reply. Try again.");
    } finally {
      setDrafting(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopiedDraft(true);
      toast.success("Draft copied to clipboard");
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className="border-b border-[#E5D2C7] last:border-b-0 transition-colors hover:bg-[#FFFFFF]/40"
      data-testid={`cold-row-${thread.thread_id}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left grid grid-cols-12 gap-4 sm:gap-6 py-7 sm:py-9 items-center"
        data-testid={`cold-row-toggle-${thread.thread_id}`}
      >
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display text-2xl text-[#A89B92] tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
        </div>
        <div className="col-span-10 sm:col-span-3 min-w-0">
          <div
            className="font-display text-2xl truncate"
            data-testid={`cold-row-name-${thread.thread_id}`}
          >
            {thread.contact_name}
          </div>
          <div className="text-sm text-[#6B5F58] truncate italic">
            {thread.contact_company} &middot; {relabel(thread.relationship_type)}
          </div>
        </div>
        <div className="col-span-12 sm:col-span-4 min-w-0">
          <div className="text-base text-[#3a302b] truncate">
            {thread.subject}
          </div>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <div
            className="font-display text-3xl tabular-nums"
            data-testid={`cold-row-days-${thread.thread_id}`}
          >
            {thread.days_since_last_message}
            <span className="text-sm text-[#A89B92] italic ml-1.5">
              days
            </span>
          </div>
        </div>
        <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-3">
          <span
            className="px-3 py-1 rounded-full text-xs italic"
            style={{
              color: meta.color,
              border: `1px solid ${meta.color}40`,
              background: `${meta.color}10`,
            }}
            data-testid={`cold-row-risk-${thread.thread_id}`}
          >
            {meta.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#6B5F58] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div
          className="grid grid-cols-12 gap-4 sm:gap-6 pb-9 fade-up"
          data-testid={`cold-row-detail-${thread.thread_id}`}
        >
          <div className="col-span-12 sm:col-span-1" />
          <div className="col-span-12 sm:col-span-7 space-y-6">
            <div>
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                Last message
              </div>
              <p className="mt-2 font-display italic text-xl text-[#1A1614] leading-relaxed">
                &ldquo;{thread.last_message_preview}&rdquo;
              </p>
              <p className="mt-1 text-sm text-[#A89B92] italic">
                &mdash; {thread.last_sender === "them" ? thread.contact_name.split(" ")[0] : "you"},{" "}
                {thread.days_since_last_message} days ago
              </p>
            </div>
            <div>
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                Why it went cold
              </div>
              <p className="mt-2 text-base text-[#1A1614] leading-relaxed">
                {thread.cold_reason}
              </p>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-4">
            <div className="bg-white/70 border border-[#E5D2C7] rounded-3xl p-5">
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                Shram would
              </div>
              <p className="mt-2 text-base text-[#1A1614]">
                {thread.shram_would_flag
                  ? thread.shram_suggested_action ||
                    "Surface this thread to you for action."
                  : "Surface this as a check-in for next week."}
              </p>

              {!readOnly && (
                <div className="mt-5">
                  {!draft ? (
                    <button
                      onClick={draftReply}
                      disabled={drafting}
                      className="pill-btn w-full text-sm py-3 px-5"
                      data-testid={`draft-reply-button-${thread.thread_id}`}
                    >
                      {drafting ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F4E7E0] pulse-dot" />
                          Drafting&hellip;
                        </>
                      ) : (
                        <>
                          Draft a reply
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div
                      className="space-y-3"
                      data-testid={`draft-reply-output-${thread.thread_id}`}
                    >
                      <div className="bg-[#F9EFE9] border border-[#E5D2C7] rounded-2xl p-4 text-sm whitespace-pre-wrap text-[#1A1614] leading-relaxed font-body">
                        {draft}
                      </div>
                      <button
                        onClick={copyDraft}
                        className="pill-btn-light pill-btn w-full text-sm py-2.5 px-4"
                        data-testid={`copy-draft-button-${thread.thread_id}`}
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy draft
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

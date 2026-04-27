import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Check, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function QuietClose({
  apiBase,
  sessionId,
  preview = false,
  onStartScan,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let alive = true;
    axios
      .post(`${apiBase}/exp/quiet-close`, { session_id: sessionId || null })
      .then((r) => {
        if (alive) {
          setData(r.data);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [apiBase, sessionId]);

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.share_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      await axios.post(`${apiBase}/exp/quiet-close/share`, {
        sentence: data.sentence,
        session_id: sessionId || null,
        channel: "copy",
      });
      setShared(true);
      toast.success("Shareable copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const tweet = async () => {
    if (!data) return;
    const text = encodeURIComponent(data.share_text);
    window.open(`https://x.com/intent/post?text=${text}`, "_blank", "noopener");
    try {
      await axios.post(`${apiBase}/exp/quiet-close/share`, {
        sentence: data.sentence,
        session_id: sessionId || null,
        channel: "twitter",
      });
      setShared(true);
    } catch {
      // ignore
    }
  };

  const sectionTestId = preview
    ? "quiet-close-preview-section"
    : "quiet-close-section";

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 py-24 lg:py-32 border-t border-[#E5D2C7] bg-[#F9EFE9]/60 relative overflow-hidden"
      data-testid={sectionTestId}
      id={preview ? "exp-quiet-preview" : "exp-quiet"}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up">
          <span className="editorial-numeral text-[#D9C4B7] text-3xl">04</span>
          <div>
            <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
              {preview
                ? "Experiment 04 \u00b7 The Quiet Close \u00b7 a sample, not your data"
                : "The Quiet Close \u00b7 Tomorrow morning, before the day begins"}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] mt-2 tracking-[-0.015em]">
              {preview ? (
                <>
                  Tomorrow morning could look <br />
                  like <span className="italic">this</span>.
                </>
              ) : (
                <>
                  You open your laptop. <br />
                  The first thing you see is{" "}
                  <span className="italic">relief</span>.
                </>
              )}
            </h2>
          </div>
        </div>

        <p className="mt-6 text-lg text-[#3a302b] max-w-2xl leading-relaxed italic">
          {preview
            ? "Below is what a founder saw at 7:14 AM today — one sentence, generated from the threads Shram caught overnight. Yours will name your contacts, your wins, your relief."
            : "Not a streak. Not a dashboard. One sentence, generated from your activity, that proves Shram worked while you slept."}
        </p>

        {/* The sentence */}
        <div
          className="mt-14 lg:mt-20 bg-white/80 border border-[#E5D2C7] rounded-[28px] p-10 lg:p-14 text-center fade-up"
          data-testid={preview ? "quiet-close-preview-card" : "quiet-close-card"}
          style={{ animationDelay: "200ms" }}
        >
          {loading || !data ? (
            <div className="font-display italic text-2xl text-[#A89B92]">
              Drafting your morning sentence&hellip;
            </div>
          ) : (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A89B92]">
                {preview ? "07:14 \u00b7 a real founder, today" : "07:14 \u00b7 tomorrow"}
              </div>
              <p
                className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.15] text-[#1A1614]"
                data-testid={
                  preview ? "quiet-close-preview-sentence" : "quiet-close-sentence"
                }
              >
                {data.sentence}
              </p>
              <div className="mt-6 text-xs italic text-[#6B5F58]">
                {preview
                  ? "a sample from the dataset \u2014 not your data, not yet"
                  : data.source === "gemini"
                  ? "drafted from your scan"
                  : "from a real founder's day"}
              </div>
            </>
          )}
        </div>

        {/* Preview CTA — pulls users into the audit */}
        {preview && data && (
          <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                Closing the loop
              </div>
              <h3 className="font-display text-2xl sm:text-3xl mt-2 leading-tight">
                Audit reveals the dread. The morning sentence is the relief.
              </h3>
              <p className="mt-4 text-base text-[#3a302b] max-w-xl leading-relaxed">
                Connect your inbox once and Shram traces it. The number you
                find this afternoon becomes the sentence you read tomorrow.
                Sharing that sentence is how the loop closes.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-3">
              <button
                onClick={onStartScan}
                className="pill-btn group"
                data-testid="quiet-close-preview-cta"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
                <span>See your version &mdash; run the audit</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-xs italic text-[#A89B92]">
                Sixty seconds. Read-only. The sentence is yours after.
              </p>
            </div>
          </div>
        )}

        {/* Post-audit Share UI */}
        {!preview && data && (
          <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                Send this to someone who needs it
              </div>
              <h3 className="font-display text-2xl sm:text-3xl mt-2 leading-tight">
                The relief is private. Make it travel.
              </h3>
              <p className="mt-4 text-base text-[#3a302b] max-w-lg leading-relaxed">
                Pre-written, ready to send. The person who receives it lives
                inside your professional network &mdash; the exact people Shram
                was built for.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div
                className="bg-white/85 border border-[#E5D2C7] rounded-3xl p-5 lg:p-6"
                data-testid="quiet-close-share-card"
              >
                <div className="font-body text-sm text-[#3a302b] whitespace-pre-wrap leading-relaxed">
                  {data.share_text}
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copy}
                    className="pill-btn text-sm py-3 px-5 flex-1"
                    data-testid="quiet-close-copy-button"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={tweet}
                    className="pill-btn-light pill-btn text-sm py-3 px-5 flex-1"
                    data-testid="quiet-close-tweet-button"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post on X
                  </button>
                </div>
                {shared && (
                  <div
                    className="mt-4 text-xs italic text-[#6B5F58]"
                    data-testid="quiet-close-shared-confirmation"
                  >
                    Counted. You just closed the loop.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Check, Send } from "lucide-react";
import { toast } from "sonner";

export default function QuietClose({ apiBase, sessionId }) {
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
      // record share intent
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
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
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

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 py-24 lg:py-32 border-t border-[#E5D2C7] bg-[#F9EFE9]/60 relative overflow-hidden"
      data-testid="quiet-close-section"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up">
          <span className="editorial-numeral text-[#D9C4B7] text-3xl">04</span>
          <div>
            <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
              The Quiet Close &middot; Tomorrow morning, before the day begins
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] mt-2 tracking-[-0.015em]">
              You open your laptop. <br />
              The first thing you see is{" "}
              <span className="italic">relief</span>.
            </h2>
          </div>
        </div>

        <p className="mt-6 text-lg text-[#3a302b] max-w-2xl leading-relaxed italic">
          Not a streak. Not a dashboard. One sentence, generated from your
          activity, that proves Shram worked while you slept.
        </p>

        {/* The sentence */}
        <div
          className="mt-14 lg:mt-20 bg-white/80 border border-[#E5D2C7] rounded-[28px] p-10 lg:p-14 text-center fade-up"
          data-testid="quiet-close-card"
          style={{ animationDelay: "200ms" }}
        >
          {loading || !data ? (
            <div className="font-display italic text-2xl text-[#A89B92]">
              Drafting your morning sentence&hellip;
            </div>
          ) : (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A89B92]">
                07:14 &middot; tomorrow
              </div>
              <p
                className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.15] text-[#1A1614]"
                data-testid="quiet-close-sentence"
              >
                {data.sentence}
              </p>
              <div className="mt-6 text-xs italic text-[#6B5F58]">
                {data.source === "gemini"
                  ? "drafted from your scan"
                  : "from a real founder's day"}
              </div>
            </>
          )}
        </div>

        {/* Share */}
        {data && (
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

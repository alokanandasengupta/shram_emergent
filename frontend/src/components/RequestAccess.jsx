import { useState } from "react";
import axios from "axios";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import ShramLogo from "@/components/ShramLogo";

export default function RequestAccess({ sessionId, coldCount, apiBase }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${apiBase}/access/request`, {
        email: email.trim(),
        session_id: sessionId,
        cold_count: coldCount,
      });
      setSubmitted(true);
      toast.success("Request received. We'll be in touch.");
    } catch {
      toast.error("Could not submit. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="px-6 sm:px-10 lg:px-20 pt-24 lg:pt-32 pb-24 lg:pb-32 border-t border-[#E5D2C7] mt-12"
      data-testid="request-access-section"
      id="about"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up" data-testid="cta-kicker">
          <ShramLogo size={20} className="text-[#1A1614]" />
          <span className="eyebrow">Never let a conversation go cold</span>
        </div>

        <h2
          className="font-display mt-8 leading-[0.98] tracking-[-0.015em] text-5xl sm:text-7xl lg:text-[88px]"
          data-testid="cta-headline"
        >
          Shram would have caught <br />
          <span className="italic">all {coldCount}</span>.
        </h2>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-lg sm:text-xl text-[#3a302b] leading-[1.6] max-w-xl">
              This page just showed you a number. Shram is the quiet system
              that makes sure that number is always zero. It watches every
              thread that matters, remembers every promise you made, and
              drafts the reply before silence becomes damage.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 max-w-xl">
              {[
                ["Reads", "across all your communication apps"],
                ["Remembers", "every promise across months"],
                ["Drafts", "in your voice, with context"],
                ["Finishes", "with one click on your task list"],
              ].map(([t, b]) => (
                <div key={t}>
                  <h4 className="font-display text-2xl">{t}</h4>
                  <p className="mt-1 text-sm text-[#6B5F58] italic">{b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form panel */}
          <div className="lg:col-span-5">
            <div
              className="bg-white/80 border border-[#E5D2C7] rounded-3xl p-7 lg:p-8"
              data-testid="cta-card"
            >
              {!submitted ? (
                <>
                  <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                    Request early access
                  </div>
                  <h3 className="font-display text-3xl mt-2 leading-tight">
                    Stop counting cold conversations.
                  </h3>
                  <form onSubmit={submit} className="mt-6 space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="founder@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pill-input"
                      data-testid="access-email-input"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !email.trim()}
                      className="pill-btn w-full"
                      data-testid="request-access-button"
                    >
                      {submitting ? "Submitting…" : "Request access"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                  <p className="mt-4 text-xs italic text-[#A89B92]">
                    We&rsquo;ll reply within 24 hours. No sales pitch.
                  </p>
                </>
              ) : (
                <div data-testid="access-success">
                  <div className="w-10 h-10 rounded-full bg-[#1A1614] flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#F4E7E0]" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-display text-3xl mt-4 leading-tight">
                    You&rsquo;re on the list.
                  </h3>
                  <p className="mt-3 text-base text-[#3a302b]">
                    We&rsquo;ll reach out at <strong>{email}</strong> within
                    24 hours with your private access link.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calm footer */}
        <div className="mt-24 lg:mt-32 border-t border-[#E5D2C7] pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 flex items-start gap-3">
              <ShramLogo size={28} className="text-[#1A1614]" />
              <span className="font-display text-2xl leading-snug">
                Shram <span className="italic text-[#6B5F58]">finds your follow-ups and does them for you.</span>
              </span>
            </div>
            <div className="lg:col-span-5" data-testid="footer-attribution">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#A89B92]">
                Designed and built by Alokananda Sengupta
              </div>
              <div className="text-sm text-[#3a302b] mt-2">
                Applying for Founder&rsquo;s Office &middot; Shram &middot; April 2026
              </div>
              <a
                href="mailto:dia.sngpta@gmail.com"
                className="text-sm text-[#1A1614] underline-offset-4 hover:underline mt-2 inline-block"
                data-testid="footer-email-link"
              >
                dia.sngpta@gmail.com
              </a>
              <div className="italic text-xs text-[#A89B92] mt-2">
                Could not test the desktop app, my Mac predates M1. Built
                this instead.
              </div>
            </div>
          </div>
          <div
            className="mt-10 pt-6 border-t border-[#E5D2C7] text-center font-mono text-[10px] text-[#A89B92] uppercase tracking-[0.22em]"
            data-testid="footer-dataset-disclosure"
          >
            BUILT ON TOP OF AI GENERATED DUMMY DATASET &middot; NO REAL INBOX
            DATA USED &middot; GEMINI 3 FLASH &middot; FEW-SHOT RAG
          </div>
        </div>
      </div>
    </section>
  );
}

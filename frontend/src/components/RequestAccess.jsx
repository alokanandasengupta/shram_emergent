import { useState } from "react";
import axios from "axios";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

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
    } catch (err) {
      console.error(err);
      toast.error("Could not submit. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="bg-[#0A0A0A] text-[#F4F4F0] mt-16 px-4 sm:px-8 lg:px-16 py-16 lg:py-24 relative grain"
      data-testid="request-access-section"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <div
            className="font-mono text-xs uppercase tracking-[0.22em] text-[#888]"
            data-testid="cta-kicker"
          >
            <span className="inline-block w-2 h-2 bg-[#FF3333] mr-3 align-middle" />
            STAGE 04 / THE OFFER
          </div>
          <h2
            className="font-display uppercase leading-[0.86] tracking-[-0.04em] text-5xl sm:text-7xl lg:text-[7vw] mt-6"
            data-testid="cta-headline"
          >
            Shram <br />
            would have caught <br />
            <span className="text-[#FF3333]">all {coldCount}.</span>
          </h2>
          <p className="mt-8 text-base lg:text-lg text-[#bbb] max-w-xl leading-relaxed">
            This page just showed you a number. Shram is the system that makes
            sure that number is always zero. Quiet, in-context nudges that
            close the loop before silence becomes damage.
          </p>

          {/* Bullet promises */}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {[
              "Continuous read on every thread that matters",
              "Promises tracked, not forgotten",
              "Daily 'who is waiting on me' digest",
              "Investor / contractor / customer aware",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 bg-[#FF3333] mt-2 flex-shrink-0" />
                <span className="text-[#ddd]">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-5">
          <div
            className="bg-[#F4F4F0] text-[#0A0A0A] p-6 lg:p-8 border-2 border-[#F4F4F0]"
            data-testid="cta-card"
          >
            {!submitted ? (
              <>
                <div className="mono-label">REQUEST EARLY ACCESS</div>
                <h3 className="font-display text-2xl sm:text-3xl mt-2 leading-tight">
                  Stop counting cold conversations.
                </h3>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="founder@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="brutal-input"
                    data-testid="access-email-input"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="brutal-btn w-full inline-flex items-center justify-between gap-4 group"
                    data-testid="request-access-button"
                  >
                    <span>{submitting ? "Submitting..." : "Request Access"}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
                <div className="mt-4 mono-label text-[#888]">
                  WE&rsquo;LL REPLY WITHIN 24H. NO SALES PITCH.
                </div>
              </>
            ) : (
              <div className="py-6" data-testid="access-success">
                <div className="w-12 h-12 bg-[#0A0A0A] flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#F4F4F0]" strokeWidth={3} />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl mt-4 leading-tight">
                  You&rsquo;re on the list.
                </h3>
                <p className="mt-3 text-sm text-[#555]">
                  We&rsquo;ll reach out at <strong>{email}</strong> within 24
                  hours with your private access link.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 mono-label text-[#888]">
            <div data-testid="cta-trust-1">SOC2-READY</div>
            <div data-testid="cta-trust-2">GMAIL READ-ONLY</div>
            <div data-testid="cta-trust-3">BUILT FOR FOUNDERS</div>
          </div>
        </div>
      </div>

      {/* Footer marquee */}
      <div className="mt-16 lg:mt-24 border-t border-[#222] pt-6 overflow-hidden">
        <div className="marquee-track flex gap-12 whitespace-nowrap font-display text-3xl sm:text-5xl uppercase tracking-tight text-[#222]">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              Shram &middot; Never let a conversation die
              <span className="text-[#FF3333]">&bull;</span>
              Shram &middot; Read-only, always on
              <span className="text-[#FF3333]">&bull;</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

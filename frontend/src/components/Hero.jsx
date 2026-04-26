import { ArrowRight } from "lucide-react";
import ShramLogo from "@/components/ShramLogo";

export default function Hero({ onConnect, error }) {
  return (
    <section
      className="px-6 sm:px-10 lg:px-20 pt-16 lg:pt-24 pb-20"
      data-testid="hero-section"
    >
      <div className="max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="fade-up flex items-center gap-3" data-testid="hero-kicker">
          <span className="eyebrow">An experiment by Shram &mdash;</span>
          <span className="eyebrow text-[#A89B92]">for founders only</span>
        </div>

        {/* Editorial headline */}
        <h1
          className="font-display mt-8 leading-[0.98] tracking-[-0.015em] text-[44px] sm:text-6xl lg:text-[88px] fade-up"
          style={{ animationDelay: "120ms" }}
          data-testid="hero-headline"
        >
          How many of your <br />
          conversations <span className="italic font-display">went cold</span>{" "}
          <br />
          in the last 90 days?
        </h1>

        {/* Body */}
        <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
          <div
            className="lg:col-span-7 fade-up"
            style={{ animationDelay: "260ms" }}
          >
            <p
              className="text-lg sm:text-xl text-[#3a302b] leading-[1.55] max-w-xl"
              data-testid="hero-subhead"
            >
              Connect your inbox for sixty seconds. Shram&rsquo;s memory
              reads the last 90 days, traces every thread where momentum
              quietly died, and tells you the exact number you&rsquo;ve been
              afraid to count.
            </p>
            <p className="mt-5 text-base text-[#6B5F58] italic max-w-xl">
              No signup. No dashboard to learn. The result is the product.
            </p>
          </div>

          <div
            className="lg:col-span-5 fade-up flex flex-col items-start lg:items-end gap-5"
            style={{ animationDelay: "400ms" }}
          >
            <button
              onClick={onConnect}
              className="pill-btn group"
              data-testid="connect-gmail-button"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
              <span>Connect Gmail &mdash; read-only</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="tag-soft" data-testid="badge-readonly">
                Read-only
              </span>
              <span className="tag-soft" data-testid="badge-60s">
                60 seconds
              </span>
              <span className="tag-soft" data-testid="badge-no-signup">
                No signup
              </span>
            </div>
            {error && (
              <div
                className="text-sm text-[#C84630] italic"
                data-testid="hero-error"
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Soft "what happens next" preview — like shram.ai's Finds/Drafts/Finishes */}
        <div className="mt-24 lg:mt-32 grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          <Step
            n="1"
            title="Reads"
            body="Shram quietly scans subjects, last replies, promises made and forgotten — across the last 90 days."
          />
          <Step
            n="2"
            title="Reasons"
            body="Few-shot in-context examples teach the model what 'cold' looks like for a founder's inbox."
          />
          <Step
            n="3"
            title="Reveals"
            body="One number. The exact people waiting on you — and the ones you forgot were waiting."
          />
        </div>

        {/* Closing line */}
        <div className="mt-24 lg:mt-32 border-t border-[#E5D2C7] pt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:justify-between">
          <div className="flex items-center gap-3">
            <ShramLogo size={20} className="text-[#1A1614] float-gentle" />
            <span className="font-display text-2xl">
              Shram <span className="italic text-[#6B5F58]">finds your follow-ups and does them for you.</span>
            </span>
          </div>
          <span className="eyebrow">Built for founders &middot; v0.1 prototype</span>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }) {
  return (
    <div className="flex gap-6 lg:gap-8">
      <div className="editorial-numeral">{n}</div>
      <div className="pt-2 lg:pt-4 max-w-sm">
        <h3 className="font-display text-3xl lg:text-4xl">{title}</h3>
        <p className="mt-3 text-base text-[#3a302b] leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

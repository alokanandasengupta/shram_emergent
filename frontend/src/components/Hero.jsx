import { ArrowRight, ShieldCheck, Clock, Lock } from "lucide-react";

export default function Hero({ onConnect, error }) {
  return (
    <section
      className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between px-4 sm:px-8 lg:px-16 py-12 lg:py-16 overflow-hidden"
      data-testid="hero-section"
    >
      {/* Top kicker line */}
      <div className="flex items-center justify-between fade-up">
        <div className="mono-label" data-testid="hero-kicker">
          <span className="inline-block w-2 h-2 bg-[#FF3333] mr-3 align-middle" />
          PROTOTYPE / PLG SURFACE / V0.1
        </div>
        <div className="hidden md:block mono-label">
          A Shram experiment for founders
        </div>
      </div>

      {/* Headline */}
      <div className="my-12 lg:my-0">
        <h1
          className="font-display uppercase leading-[0.86] tracking-[-0.05em] text-[14vw] sm:text-[12vw] lg:text-[10vw] fade-up"
          style={{ animationDelay: "120ms" }}
          data-testid="hero-headline"
        >
          How many <br />
          conversations <br />
          went <span className="italic font-display" style={{ fontStyle: "italic" }}>cold</span>
          <span className="text-[#FF3333]">?</span>
        </h1>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <p
            className="lg:col-span-6 text-base sm:text-lg leading-relaxed max-w-xl fade-up"
            style={{ animationDelay: "260ms" }}
            data-testid="hero-subhead"
          >
            Connect your inbox for sixty seconds. Shram&rsquo;s ML brain reads
            the last 90 days, traces the threads where momentum died, and tells
            you the exact number you&rsquo;ve been afraid to count.
            <span className="block mt-3 text-[#555]">
              No signup. No dashboard to learn. The result is the product.
            </span>
          </p>

          <div
            className="lg:col-span-6 flex flex-col justify-end fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <button
              onClick={onConnect}
              className="brutal-btn w-full lg:w-auto self-end inline-flex items-center justify-between gap-6 px-8 py-6 group"
              data-testid="connect-gmail-button"
            >
              <span className="flex items-center gap-3">
                <span className="inline-block w-2 h-2 bg-[#FF3333] rounded-full animate-pulse" />
                Connect Gmail &mdash; Read-only
              </span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-mono">
              <Trust icon={<ShieldCheck className="w-3.5 h-3.5" />} label="READ-ONLY" />
              <Trust icon={<Clock className="w-3.5 h-3.5" />} label="60 SECONDS" />
              <Trust icon={<Lock className="w-3.5 h-3.5" />} label="NO SIGNUP" />
            </div>
            {error && (
              <div className="mt-4 mono-label text-[#FF3333]" data-testid="hero-error">
                ERR: {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div className="border-t-2 border-[#0A0A0A] pt-6 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
        <Stat label="DAYS SCANNED" value="90" />
        <Stat label="THREADS PROCESSED" value="100s" />
        <Stat label="MODEL" value="Gemini 3" />
        <Stat label="OUTPUT" value="ONE NUMBER" />
      </div>
    </section>
  );
}

function Trust({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-[#555]">
      {icon}
      <span className="tracking-[0.18em]">{label}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="mono-label">{label}</div>
      <div className="font-display text-2xl sm:text-3xl mt-1">{value}</div>
    </div>
  );
}

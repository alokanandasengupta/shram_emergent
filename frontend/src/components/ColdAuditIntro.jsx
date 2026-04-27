import { ArrowRight } from "lucide-react";
import ThinkingTab from "@/components/ThinkingTab";

export default function ColdAuditIntro({ onConnect }) {
  return (
    <section
      className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28 border-t border-[#E5D2C7]"
      data-testid="exp-audit-intro-section"
      id="exp-audit"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up">
          <span className="editorial-numeral text-[#D9C4B7] text-3xl">03</span>
          <div>
            <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
              Experiment 03 &middot; The Cold Audit
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] mt-2 tracking-[-0.015em]">
              Now we run it on <span className="italic">your</span> inbox.
            </h2>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
          <p className="lg:col-span-7 text-lg text-[#3a302b] leading-relaxed max-w-2xl">
            Read-only. Sixty seconds. Shram&rsquo;s memory traces the last 90
            days, finds the threads where momentum quietly died, and gives you
            one number. Below that number, the names. Below the names, the
            reply that closes each loop &mdash; in your voice.
          </p>
          <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-3">
            <button
              onClick={onConnect}
              className="pill-btn group"
              data-testid="audit-intro-connect-button"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
              <span>Run the audit on me</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-xs italic text-[#A89B92]">
              Read-only &middot; we never store message contents
            </p>
          </div>
        </div>

        <ThinkingTab testId="audit-thinking-tab">
          This is the top-of-funnel surface Shram does not have today. A
          non-user has no reason to care about Shram before they install
          anything. This experiment gives them one. The user connects Gmail
          read-only for sixty seconds. The tool scans the last ninety days
          and returns one number: the exact count of threads where momentum
          died. Below the number, the names. Below the names, a draft reply
          for each one generated in their voice. No signup wall. The result
          is the product demo. The number the user finds is more persuasive
          than any copy about anxiety removal because it is their own data
          made visible for the first time. Below the results one line: Shram
          would have caught all of them. The experiment quantifies the pain
          before asking anyone to change their behaviour. That is the only
          PLG surface that converts a sceptic.
        </ThinkingTab>
      </div>
    </section>
  );
}

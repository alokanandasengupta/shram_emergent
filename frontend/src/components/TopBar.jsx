import { Terminal } from "lucide-react";

export default function TopBar({ onReset, stage }) {
  return (
    <header
      className="w-full border-b-2 border-[#0A0A0A] bg-[#F4F4F0] sticky top-0 z-40"
      data-testid="top-bar"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-16 h-14">
        <button
          onClick={onReset}
          className="flex items-center gap-3 group"
          data-testid="brand-home-link"
        >
          <div className="w-7 h-7 bg-[#0A0A0A] flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#F4F4F0]" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.22em] font-bold">
            Shram <span className="text-[#888]">/ Cold Audit</span>
          </span>
        </button>
        <div className="hidden sm:flex items-center gap-6 mono-label">
          <span data-testid="badge-readonly">Read-only</span>
          <span className="w-1 h-1 bg-[#0A0A0A]" />
          <span data-testid="badge-no-signup">No signup</span>
          <span className="w-1 h-1 bg-[#0A0A0A]" />
          <span data-testid="badge-stage">
            {stage === "hero" && "Stage 01 / Connect"}
            {stage === "scanning" && "Stage 02 / Scanning"}
            {stage === "results" && "Stage 03 / Reveal"}
          </span>
        </div>
      </div>
    </header>
  );
}

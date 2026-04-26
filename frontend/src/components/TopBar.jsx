import ShramLogo from "@/components/ShramLogo";

export default function TopBar({ onReset, stage }) {
  return (
    <header
      className="w-full bg-[#F4E7E0]/90 backdrop-blur-sm border-b border-[#E5D2C7] sticky top-0 z-40"
      data-testid="top-bar"
    >
      <div className="flex items-center justify-between px-6 sm:px-10 lg:px-20 h-20">
        <button
          onClick={onReset}
          className="flex items-center gap-3"
          data-testid="brand-home-link"
          aria-label="Shram home"
        >
          <ShramLogo size={28} className="text-[#1A1614]" />
        </button>
        <nav className="flex items-center gap-8">
          <a
            href="#about"
            className="font-body text-[#6B5F58] hover:text-[#1A1614] transition-colors text-base"
            data-testid="nav-about"
          >
            About
          </a>
          <span
            className="hidden sm:inline-flex tag-soft"
            data-testid="badge-stage"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
            <span className="italic">
              {stage === "hero" && "Cold-conversation audit"}
              {stage === "scanning" && "Reading your inbox"}
              {stage === "results" && "Your audit"}
            </span>
          </span>
        </nav>
      </div>
    </header>
  );
}

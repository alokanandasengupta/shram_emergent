import { useEffect, useState } from "react";

const STAGES = [
  {
    label: "Reading",
    sub: "Opening a read-only window into your last 90 days. No content stored.",
    duration: 1100,
  },
  {
    label: "Remembering",
    sub: "Building a private memory of who is waiting on whom, and for how long.",
    duration: 1200,
  },
  {
    label: "Reasoning",
    sub: "Calibrating against patterns of conversations that go quietly cold.",
    duration: 1300,
  },
  {
    label: "Revealing",
    sub: "Surfacing the threads that need you, ordered by who is waiting longest.",
    duration: 1100,
  },
];

export default function Scanning() {
  const [stageIdx, setStageIdx] = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let mounted = true;
    let i = 0;
    let elapsed = 0;
    const total = STAGES.reduce((a, s) => a + s.duration, 0);
    const next = () => {
      if (!mounted || i >= STAGES.length) return;
      const s = STAGES[i];
      setStageIdx(i);
      const startElapsed = elapsed;
      const startTime = Date.now();
      const tick = () => {
        if (!mounted) return;
        const t = Date.now() - startTime;
        const cur = Math.min(t, s.duration);
        setPercent(((startElapsed + cur) / total) * 100);
        if (cur < s.duration) requestAnimationFrame(tick);
        else {
          elapsed += s.duration;
          i += 1;
          next();
        }
      };
      tick();
    };
    next();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className="min-h-[calc(100vh-5rem)] px-6 sm:px-10 lg:px-20 py-16 lg:py-24"
      data-testid="scanning-section"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 fade-up" data-testid="scanning-kicker">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
          <span className="eyebrow">Reading your inbox &mdash; read-only</span>
        </div>

        {/* Stage label as editorial headline */}
        <h2
          className="font-display mt-8 leading-[0.98] tracking-[-0.015em] text-5xl sm:text-7xl lg:text-[88px]"
          data-testid="scanning-headline"
        >
          {STAGES[stageIdx]?.label}
          <span className="text-[#C84630] ml-1">.</span>
        </h2>
        <p
          className="mt-6 text-lg sm:text-xl text-[#3a302b] italic max-w-2xl leading-relaxed"
          data-testid="scanning-stage-sub"
        >
          {STAGES[stageIdx]?.sub}
        </p>

        {/* Hairline progress with numeric */}
        <div className="mt-16 lg:mt-24 flex items-center gap-6">
          <div className="flex-1 h-px bg-[#E5D2C7] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#1A1614] transition-[width] duration-150 ease-linear"
              style={{ width: `${percent}%` }}
              data-testid="scanning-progress-bar"
            />
          </div>
          <div
            className="font-display text-2xl tabular-nums text-[#6B5F58] w-16 text-right"
            data-testid="scanning-progress-pct"
          >
            {String(Math.round(percent)).padStart(2, "0")}
          </div>
        </div>

        {/* Stage list — calm, like shram.ai's numbered process */}
        <div className="mt-20 lg:mt-28 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {STAGES.map((s, i) => (
            <div
              key={s.label}
              className={`flex gap-6 transition-opacity duration-500 ${
                i <= stageIdx ? "opacity-100" : "opacity-30"
              }`}
              data-testid={`scanning-stage-${i}`}
            >
              <div className="editorial-numeral text-[#D9C4B7]">
                {String(i + 1).padStart(2, "")}
              </div>
              <div className="pt-2">
                <h3 className="font-display text-2xl lg:text-3xl flex items-center gap-2">
                  {s.label}
                  {i === stageIdx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C84630] pulse-dot" />
                  )}
                  {i < stageIdx && (
                    <span className="text-[#6E8B5A] text-sm not-italic">&#10003;</span>
                  )}
                </h3>
                <p className="mt-2 text-sm text-[#6B5F58] max-w-xs leading-relaxed">
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

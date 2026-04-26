import { useEffect, useState, useRef } from "react";

const STAGES = [
  { label: "AUTHENTICATING", duration: 700 },
  { label: "FETCHING THREADS / 90D", duration: 900 },
  { label: "PARSING METADATA", duration: 800 },
  { label: "EMBEDDING CONTEXT", duration: 900 },
  { label: "RETRIEVING SIMILAR PATTERNS", duration: 900 },
  { label: "RANKING COLDNESS", duration: 700 },
  { label: "DRAFTING REASONS", duration: 600 },
  { label: "FINALISING", duration: 500 },
];

const SAMPLE_LINES = [
  '> auth.gmail.readonly OK',
  '> fetched 412 threads in window=90d',
  '> filter: in:sent OR in:inbox',
  '> tokenizing subjects + last_message_preview',
  '> vectorizing 412 threads (768d)',
  '> retrieving 6 nearest labelled exemplars',
  '> few_shot=6 / model=gemini-3-flash-preview',
  '> scoring thread_id=THREAD_1827 ... score=83 [HIGH]',
  '> scoring thread_id=THREAD_0442 ... score=22 [LOW]',
  '> scoring thread_id=THREAD_2201 ... score=71 [HIGH]',
  '> detecting unfulfilled promises (days_since_promise > 14)',
  '> last_sender=them ∧ no_reply → flag',
  '> last_sender=you ∧ awaiting_them → drop',
  '> applying risk tier mapping [0..39 LOW] [40..69 MED] [70..100 HIGH]',
  '> drafting cold_reason via in-context exemplars',
  '> shram_would_flag=true count=...',
  '> sorting by cold_score desc',
];

export default function Scanning() {
  const [stageIdx, setStageIdx] = useState(0);
  const [percent, setPercent] = useState(0);
  const [lines, setLines] = useState([]);
  const [counter, setCounter] = useState({ scanned: 0, cold: 0 });
  const consoleRef = useRef(null);

  // Cycle through stages
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
        const p = ((startElapsed + cur) / total) * 100;
        setPercent(p);
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

  // Stream terminal lines
  useEffect(() => {
    let mounted = true;
    let idx = 0;
    const id = setInterval(() => {
      if (!mounted) return;
      const line = SAMPLE_LINES[idx % SAMPLE_LINES.length];
      idx += 1;
      setLines((prev) => {
        const nxt = [...prev, line];
        return nxt.length > 14 ? nxt.slice(nxt.length - 14) : nxt;
      });
    }, 280);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Animate counters
  useEffect(() => {
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      setCounter((c) => ({
        scanned: Math.min(412, c.scanned + Math.floor(Math.random() * 23 + 8)),
        cold: Math.min(99, c.cold + (Math.random() > 0.65 ? 1 : 0)),
      }));
    }, 110);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <section
      className="min-h-[calc(100vh-3.5rem)] bg-[#0A0A0A] text-[#F4F4F0] px-4 sm:px-8 lg:px-16 py-10 lg:py-14 relative grain"
      data-testid="scanning-section"
    >
      {/* Top kicker */}
      <div className="flex items-center justify-between">
        <div
          className="font-mono text-xs uppercase tracking-[0.22em] text-[#888]"
          data-testid="scanning-kicker"
        >
          <span className="inline-block w-2 h-2 bg-[#34C759] mr-3 align-middle animate-pulse" />
          BRAIN ACTIVE / RAG IN-CONTEXT
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#888]">
          STAGE 02 / SCANNING
        </div>
      </div>

      {/* Big stage label + progress */}
      <div className="mt-12 lg:mt-20">
        <div
          className="font-mono text-xs uppercase tracking-[0.3em] text-[#888]"
          data-testid="scanning-stage-label"
        >
          {String(stageIdx + 1).padStart(2, "0")} /{" "}
          {String(STAGES.length).padStart(2, "0")} &middot;{" "}
          {STAGES[stageIdx]?.label}
        </div>
        <h2
          className="font-display uppercase leading-[0.9] tracking-[-0.04em] text-5xl sm:text-7xl lg:text-[8vw] mt-4 terminal-cursor"
          data-testid="scanning-headline"
        >
          {STAGES[stageIdx]?.label}
        </h2>

        <div className="mt-10 flex items-center gap-6">
          <div className="flex-1 h-2 border-2 border-[#F4F4F0] relative">
            <div
              className="absolute inset-y-0 left-0 bg-[#F4F4F0] transition-[width] duration-150 ease-linear"
              style={{ width: `${percent}%` }}
              data-testid="scanning-progress-bar"
            />
          </div>
          <div
            className="font-mono text-xl tabular-nums w-20 text-right"
            data-testid="scanning-progress-pct"
          >
            {Math.round(percent)}%
          </div>
        </div>
      </div>

      {/* Two-column terminal + counters */}
      <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          ref={consoleRef}
          className="lg:col-span-8 border-2 border-[#F4F4F0] bg-[#0A0A0A] p-5 h-72 overflow-hidden font-mono text-xs sm:text-sm text-[#34C759] leading-relaxed"
          data-testid="scanning-terminal"
        >
          {lines.map((l, i) => (
            <div key={i} className="opacity-90">
              {l}
            </div>
          ))}
          <div className="opacity-60">
            <span className="text-[#F4F4F0]">{">"}</span>{" "}
            <span className="terminal-cursor">working</span>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
          <CounterCell
            label="THREADS SCANNED"
            value={counter.scanned}
            testId="counter-scanned"
          />
          <CounterCell
            label="POTENTIAL COLD"
            value={counter.cold}
            accent="#FF3333"
            testId="counter-cold"
          />
        </div>
      </div>
    </section>
  );
}

function CounterCell({ label, value, accent, testId }) {
  return (
    <div className="border-2 border-[#F4F4F0] p-5" data-testid={testId}>
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#888]">
        {label}
      </div>
      <div
        className="font-display text-5xl sm:text-6xl mt-2 tabular-nums"
        style={{ color: accent || "#F4F4F0" }}
      >
        {String(value).padStart(2, "0")}
      </div>
    </div>
  );
}

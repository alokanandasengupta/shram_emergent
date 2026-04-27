import { useEffect } from "react";
import Results from "@/components/Results";
import { ArrowRight } from "lucide-react";

export default function SharePage({ data, loading, notFound, apiBase, onStartOwn }) {
  useEffect(() => {
    if (data) {
      const c = data.cold_count;
      document.title = `${c} cold conversation${c === 1 ? "" : "s"} — Shram`;
    } else {
      document.title = "Shram — Cold conversation audit";
    }
  }, [data]);

  if (loading) {
    return (
      <section className="px-6 sm:px-10 lg:px-20 py-24 max-w-5xl mx-auto">
        <div className="eyebrow">Loading shared audit&hellip;</div>
        <div className="mt-6 h-px bg-[#E5D2C7] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[#1A1614] animate-pulse" />
        </div>
      </section>
    );
  }

  if (notFound || !data) {
    return (
      <section
        className="px-6 sm:px-10 lg:px-20 py-24 max-w-5xl mx-auto"
        data-testid="share-not-found"
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C84630]" />
          <span className="eyebrow">This audit can&rsquo;t be found</span>
        </div>
        <h2 className="font-display mt-6 text-5xl sm:text-7xl leading-[0.95]">
          The link <span className="italic">expired</span> or never existed.
        </h2>
        <p className="mt-6 text-lg text-[#3a302b] max-w-xl">
          Run your own audit instead — it takes sixty seconds and tells you
          exactly how many of your conversations went cold in the last 90
          days.
        </p>
        <button
          onClick={onStartOwn}
          className="pill-btn mt-8"
          data-testid="share-start-own-button"
        >
          Run my own audit
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <>
      {/* Shared-with-you banner */}
      <div
        className="px-6 sm:px-10 lg:px-20 pt-10"
        data-testid="share-banner"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/70 border border-[#E5D2C7] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="eyebrow not-italic uppercase tracking-[0.16em] text-xs text-[#A89B92]">
                A founder shared their cold-conversation audit with you
              </div>
              <p className="font-display text-2xl mt-1">
                They have <span className="italic">{data.cold_count}</span>{" "}
                conversations going cold right now.
              </p>
            </div>
            <button
              onClick={onStartOwn}
              className="pill-btn whitespace-nowrap"
              data-testid="share-run-own"
            >
              Run yours
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Results data={data} apiBase={apiBase} readOnly={true} />
    </>
  );
}

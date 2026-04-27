/* Shared editorial footer — appears at the end of every page */
export default function Footer() {
  return (
    <footer
      className="px-6 sm:px-10 lg:px-20 pt-16 lg:pt-20 pb-12 border-t border-[#E5D2C7]"
      data-testid="site-footer"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="font-display text-2xl leading-snug">
              Shram{" "}
              <span className="italic text-[#6B5F58]">
                finds your follow-ups and does them for you.
              </span>
            </p>
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
    </footer>
  );
}

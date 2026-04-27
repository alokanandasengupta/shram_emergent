import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Shared "The thinking behind this experiment" disclosure used at the bottom
 * of each experiment section. Editorial italic prose, no borders, smooth.
 */
export default function ThinkingTab({ children, testId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-12 lg:mt-14" data-testid={testId || "thinking-tab"}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-transparent hover:bg-white/60 transition-colors"
            data-testid={testId ? `${testId}-trigger` : "thinking-tab-trigger"}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A89B92]">
              The thinking behind this experiment
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#A89B92] transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <p
            className="mt-6 font-body italic text-base text-[#3a302b] leading-relaxed max-w-2xl"
            data-testid={testId ? `${testId}-content` : "thinking-tab-content"}
          >
            {children}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

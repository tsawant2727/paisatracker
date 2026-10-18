"use client";

import { useState } from "react";
import { QuickAddSheet } from "./QuickAddSheet";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-base)] shadow-[0_8px_32px_rgba(61,255,168,0.35)] transition-transform active:scale-95"
        aria-label="Quick add transaction"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <QuickAddSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

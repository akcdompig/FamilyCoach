"use client";

import { useEffect } from "react";
import { FlowAvatar } from "@/components/flow/FlowAvatar";
import { FlowPanel } from "@/components/flow/FlowPanel";
import { useFlowRuntime } from "@/lib/flow/FlowRuntime";

/** Mobiel: floating action button rechtsonder die een full-screen sheet opent (release 3 §1). */
export function FlowLauncher() {
  const { open, openPanel, closePanel, suggestion, session } = useFlowRuntime();

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, closePanel]);

  const hasBadge = !session && Boolean(suggestion) && !open;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label="Open Flow"
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-primary py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-primary-dark active:scale-95 md:bottom-6 lg:hidden"
      >
        <span className="relative flex items-center justify-center">
          <FlowAvatar state={hasBadge ? "coaching" : "idle"} size={36} />
          {hasBadge ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative h-3.5 w-3.5 rounded-full border-2 border-primary bg-accent" />
            </span>
          ) : null}
        </span>
        Flow
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center lg:hidden">
          <button
            type="button"
            aria-label="Sluiten"
            onClick={closePanel}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
          />
          <div className="relative z-10 h-[88vh] w-full animate-fade-up overflow-hidden rounded-t-3xl bg-surface shadow-lift">
            <FlowPanel variant="sheet" />
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Desktop: permanent Flow-paneel aan de rechterzijde (release 3 §1, §42: split-screen). */
export function FlowDock() {
  return (
    <aside className="fixed inset-y-6 right-6 z-30 hidden w-[380px] lg:block">
      <FlowPanel variant="dock" />
    </aside>
  );
}

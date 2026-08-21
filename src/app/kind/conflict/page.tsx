"use client";

import { useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { FlowAvatar } from "@/components/flow/FlowAvatar";
import { FlowPanel } from "@/components/flow/FlowPanel";
import { Card } from "@/components/ui/Card";
import { useFlowRuntime } from "@/lib/flow/FlowRuntime";

/**
 * Conflict coach (release 3 §4-§8, §29). Dit is geen los formulier meer: de
 * pagina start het echte, meerstaps Flow-gesprek. Op desktop staat hetzelfde
 * gesprek al live in het Flow-paneel rechts; hier tonen we het dan niet dubbel.
 */
export default function ConflictPage() {
  const { session, startFlow } = useFlowRuntime();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (session?.flowId === "conflict-coach" && session.status === "active") return;
    started.current = true;
    void startFlow("conflict-coach");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell role="child">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Conflict coach</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Er is iets gebeurd.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Flow helpt je het rustig uit elkaar te halen. Jij kiest zelf wat je deelt.
        </p>
      </header>

      <div className="h-[70vh] min-h-[420px] lg:hidden">
        <FlowPanel variant="dock" />
      </div>

      <Card tone="sage" className="hidden items-center gap-4 lg:flex">
        <FlowAvatar state="coaching" size={48} />
        <p className="text-[15px] leading-relaxed text-ink">
          Het gesprek staat al klaar in het Flow-paneel rechts. Praat daar rustig verder.
        </p>
      </Card>
    </AppShell>
  );
}

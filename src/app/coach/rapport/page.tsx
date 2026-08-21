"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import { generateMonthlyReport } from "@/lib/insights";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";

/** Maandrapportage (release 4 §12) — samengevat overzicht voor begeleiding, niet voor live meekijken. */
export default function MonthlyReportPage() {
  const { data } = useFamilyFlow();
  const report = generateMonthlyReport(data);

  return (
    <AppShell role="coach">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">FamilyFlow</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Maandrapport</h1>
          <p className="mt-1 text-sm text-muted">{data.family.name} · periode {report.period}</p>
        </div>
        {data.isDemo ? <Badge tone="accent">Demo</Badge> : null}
      </header>

      <section>
        <SectionTitle>Positieve ontwikkelingen</SectionTitle>
        <Card tone="sage">
          <ul className="space-y-2.5">
            {report.positives.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[15px] leading-relaxed text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Aandachtspunten</SectionTitle>
        <Card tone="sand">
          <ul className="space-y-2.5">
            {report.attentionPoints.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[15px] leading-relaxed text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-dark" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>AI Coach observatie</SectionTitle>
        <Card>
          <p className="text-[15px] italic leading-relaxed text-ink">&ldquo;{report.observation}&rdquo;</p>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Volgende maand</SectionTitle>
        <Card tone="outline">
          <ol className="space-y-2.5">
            {report.nextGoals.map((goal, index) => (
              <li key={goal} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-dark">
                  {index + 1}
                </span>
                {goal}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <p className="mt-10 px-1 text-xs leading-relaxed text-muted">
        Dit rapport is een samenvatting op basis van wat het gezin in FamilyFlow heeft vastgelegd — geen
        medisch of psychologisch verslag.{" "}
        <Link href="/coach" className="underline underline-offset-4 hover:text-ink">
          Terug naar gezinsoverzicht
        </Link>
      </p>
    </AppShell>
  );
}

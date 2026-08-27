"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icons";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import { familyOverview, TRAFFIC_COLOR } from "@/lib/insights";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { children, cx, weekStats } from "@/lib/utils";

/**
 * Professional-weergave (release 4 §11): voor jeugdhulp, gezinsbegeleiding
 * en opvoedondersteuning. Geen controlemiddel — een gezinsoverzicht dat
 * continuïteit geeft tussen begeleidingsmomenten in. Werkt op dezelfde
 * data als het gezin zelf ziet; hier alleen samengevat en geduid.
 */
export default function CoachPage() {
  const { data } = useFamilyFlow();
  const kids = children(data);
  const stats = weekStats(data, kids.map((kid) => kid.id));
  const overview = familyOverview(data);

  return (
    <AppShell role="coach">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Voor professionals</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Gezinsoverzicht</h1>
        <p className="mt-1 text-sm text-muted">
          Ondersteuning tussen begeleidingsmomenten in — geen controle, wel continuïteit.
        </p>
      </header>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-ink">{data.family.name || "Naamloos gezin"}</p>
              {data.isDemo ? <Badge tone="accent">Demo</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              {kids.length} {kids.length === 1 ? "kind" : "kinderen"} ·{" "}
              {data.tasks.filter((task) => task.active).length} actieve afspraken
            </p>
          </div>
          <Badge tone="green">actief</Badge>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-muted">Afspraken</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
              {stats.tasksDone}/{stats.tasksTotal}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Check-ins</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{stats.checkIns}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Beweging</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{stats.movementDays} d</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Samen</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{stats.activities}</dd>
          </div>
        </dl>

        {data.coachProfile ? (
          <p className="mt-5 rounded-2xl bg-sage-light p-4 text-[15px] leading-relaxed text-ink">
            {data.coachProfile.summary}
          </p>
        ) : null}
      </Card>

      <section className="mt-8">
        <SectionTitle
          action={
            <Link href="/coach/rapport" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Maandrapport
              <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
            </Link>
          }
        >
          Deze week op hoofdlijnen
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {overview.map((item) => (
            <Card key={item.key} tone="outline" className="p-4">
              <span className={cx("inline-block h-2.5 w-2.5 rounded-full", TRAFFIC_COLOR[item.level])} aria-hidden />
              <p className="mt-2 text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.note}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 px-1 text-xs leading-relaxed text-muted">
          {data.isDemo
            ? "Voorbeelddata uit het demo-gezin — geen echte cliëntgegevens."
            : "Gebaseerd op wat het gezin zelf in FamilyFlow heeft vastgelegd."}
        </p>
      </section>

      <section className="mt-8">
        <SectionTitle>Wat komt hierna</SectionTitle>
        <Card tone="outline">
          <ul className="space-y-2 text-[15px] leading-relaxed text-muted">
            <li>Meerdere gezinnen koppelen aan één begeleider.</li>
            <li>Gedeelde notities en doelen per gezin, met toestemming van de ouder.</li>
            <li>Inzage per periode in plaats van live meekijken.</li>
          </ul>
        </Card>
        <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
          Een professional krijgt alleen toegang na expliciete toestemming van de ouder. Inzage is beperkt
          tot wat nodig is voor de begeleiding — nooit volledige gespreksinhoud met Flow, tenzij dit
          veiligheidsrelevant is.
        </p>
      </section>
    </AppShell>
  );
}

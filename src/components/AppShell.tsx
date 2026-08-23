"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNavigation, NAV_ITEMS, SideNavigation } from "@/components/Navigation";
import { FlowDock, FlowLauncher } from "@/components/flow/FlowLauncher";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { pointsFor } from "@/lib/utils";

interface Props {
  children: ReactNode;
  /** Rol waarvoor deze pagina bedoeld is; bepaalt de navigatie. */
  role?: "parent" | "child" | "coach";
}

/**
 * Eén shell voor alle rollen. De rolwissel is bewust zichtbaar: in een pilot
 * wil je op één toestel kunnen laten zien wat ouder én kind te zien krijgen.
 */
export function AppShell({ children, role }: Props) {
  const { data, activePerson, setActivePerson } = useFamilyFlow();
  const router = useRouter();
  const effectiveRole = role ?? activePerson.role;
  const items = NAV_ITEMS[effectiveRole];

  const switchTo = (personId: string) => {
    if (personId === "coach") {
      router.push("/coach");
      return;
    }
    const person = data.people.find((p) => p.id === personId);
    setActivePerson(personId);
    router.push(person?.role === "child" ? "/kind" : "/ouder");
  };

  return (
    <div className="min-h-screen bg-atmosphere">
      <SideNavigation items={items} familyName={data.family.name || "Jouw gezin"} isDemo={data.isDemo} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-2.5 md:hidden">
              <span className="font-display text-[16px] font-semibold tracking-tight text-ink">FamilyFlow</span>
            </div>

            <div className="flex items-center gap-3">
              {activePerson.role === "child" ? (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-dark">
                  <span className="font-mono tabular-nums">{pointsFor(data, activePerson.id)}</span> punten
                </span>
              ) : null}
              <label className="sr-only" htmlFor="person-switch">
                Wissel van gebruiker
              </label>
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2">
                <Avatar name={activePerson.name} color={activePerson.color} size="sm" />
                <select
                  id="person-switch"
                  value={effectiveRole === "coach" ? "coach" : activePerson.id}
                  onChange={(event) => switchTo(event.target.value)}
                  className="max-w-[7.5rem] bg-transparent text-sm font-medium text-ink outline-none"
                >
                  {data.people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                  <option value="coach">Coach</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 pb-28 pt-5 md:max-w-none md:pb-16 lg:mr-[420px] lg:pr-4">{children}</main>
      </div>

      <BottomNavigation items={items} />
      <FlowLauncher />
      <FlowDock />
    </div>
  );
}

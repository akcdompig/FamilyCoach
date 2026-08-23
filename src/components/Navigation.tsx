"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icons";
import type { Role } from "@/lib/types";
import { cx } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  parent: [
    { href: "/ouder", label: "Home", icon: "home" },
    { href: "/ouder/gezin", label: "Gezin", icon: "users" },
    { href: "/ouder/afspraken", label: "Afspraken", icon: "list" },
    { href: "/ouder/inzichten", label: "Inzichten", icon: "spark" },
    { href: "/ouder/profiel", label: "Profiel", icon: "user" },
  ],
  child: [
    { href: "/kind", label: "Home", icon: "home" },
    { href: "/kind/plan", label: "Plan", icon: "sun" },
    { href: "/kind/samen", label: "Samen", icon: "heart" },
    { href: "/kind/doelen", label: "Groei", icon: "target" },
    { href: "/kind/wallet", label: "Wallet", icon: "spark" },
    { href: "/kind/profiel", label: "Profiel", icon: "user" },
  ],
  coach: [
    { href: "/coach", label: "Gezinsoverzicht", icon: "users" },
    { href: "/coach/rapport", label: "Maandrapport", icon: "list" },
  ],
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/ouder" || href === "/kind" || href === "/coach") return pathname === href;
  return pathname.startsWith(href);
}

export function BottomNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                  active ? "text-primary" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-12 items-center justify-center rounded-full transition",
                    active && "bg-sage",
                  )}
                >
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNavigation({
  items,
  familyName,
  isDemo,
}: {
  items: NavItem[];
  familyName: string;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
      <div className="px-3">
        <p className="font-display text-lg font-semibold tracking-tight text-ink">FamilyFlow</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-sm text-muted">{familyName}</p>
          {isDemo ? (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
              Demo
            </span>
          ) : null}
        </div>
      </div>
      <ul className="mt-8 space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition",
                  active ? "bg-sage text-primary-dark" : "text-muted hover:bg-sage-light hover:text-ink",
                )}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1 px-3 text-xs text-muted">
        <Link href="/pilot" className="block hover:text-ink hover:underline">
          Pilot & feedback
        </Link>
        <p className="pt-2 leading-relaxed">Ondersteunende gezinscoach, geen medisch platform.</p>
      </div>
    </aside>
  );
}

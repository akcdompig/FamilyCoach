import type { AppData, Person } from "@/lib/types";
import { allowanceFor } from "./gamification";

export function walletFor(data: AppData, person: Person) {
  const allowance = allowanceFor(data, person);
  const entries = (data.walletEntries ?? []).filter((entry) => entry.personId === person.id);
  return { ...allowance, entries };
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}

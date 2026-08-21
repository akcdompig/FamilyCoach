"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Person } from "@/lib/types";

/**
 * "Ouders bijspringen als ze zelf even te druk zijn" (release 3 §14, §40):
 * een ouder zet in een paar seconden een herinnering klaar, Flow seint het
 * kind op het juiste moment. Lichte, client-only versie — geen pushmelding
 * als de app dicht is, wel een proactieve Flow-suggestie zodra hij weer
 * opengaat na de gekozen tijd (zie lib/ai/agent.ts findDueReminder).
 */
export function ReminderPanel({ person }: { person: Person }) {
  const { data, addReminder, removeReminder } = useFamilyFlow();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("16:00");

  const reminders = (data.reminders ?? [])
    .filter((r) => r.personId === person.id && r.status === "pending")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const [hours, minutes] = time.split(":").map((n) => Number(n));
    const due = new Date();
    due.setHours(Number.isFinite(hours) ? hours : 16, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    addReminder({ personId: person.id, title: trimmed, dueAt: due.toISOString() });
    setTitle("");
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon name="bell" className="h-3.5 w-3.5" />
        Herinneringen
      </p>

      {reminders.length > 0 ? (
        <ul className="mb-3 space-y-1.5">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="flex items-center justify-between gap-2 rounded-xl bg-sand-light px-3 py-2 text-sm">
              <span className="text-ink">
                <span className="font-medium tabular-nums">
                  {new Date(reminder.dueAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </span>{" "}
                — {reminder.title}
              </span>
              <button
                type="button"
                onClick={() => removeReminder(reminder.id)}
                className="shrink-0 text-xs text-muted hover:text-[#9B3B2F]"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`Bijv. "huiswerk maken"`}
          className="field min-w-[10rem] flex-1"
          aria-label="Herinneringstekst"
        />
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="field w-28 shrink-0"
          aria-label="Tijdstip"
        />
        <Button size="sm" onClick={submit} disabled={!title.trim()}>
          Toevoegen
        </Button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Flow seint {person.name} hierover zodra de app open is op of na dit tijdstip.
      </p>
    </div>
  );
}

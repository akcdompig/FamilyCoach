"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildCoachContext } from "@/lib/ai/context";
import { fallbackCoachMessage, type CoachReply } from "@/lib/ai/fallback";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { CoachMessage, MessageKind, Person } from "@/lib/types";
import { decideCoachMoment } from "./rules";

async function requestCoach(kind: MessageKind, context: unknown): Promise<CoachReply | null> {
  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, context }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CoachReply;
  } catch {
    return null;
  }
}

/**
 * Haalt (maximaal) één coachmoment op voor de actieve persoon en bewaart het.
 * De rules engine bepaalt óf er iets gestuurd wordt; de AI-laag bepaalt wát.
 */
export function useCoachMoment(person: Person) {
  const { data, pushMessage } = useFamilyFlow();
  const [loading, setLoading] = useState(false);
  const requested = useRef<string>("");

  const generate = useCallback(
    async (forcedKind?: MessageKind) => {
      const decision = forcedKind
        ? { allowed: true, kind: forcedKind, reason: "handmatig" }
        : decideCoachMoment(data, person);
      if (!decision.allowed) return;

      setLoading(true);
      const context = buildCoachContext(data, person);
      const aiReply = data.settings.aiEnabled ? await requestCoach(decision.kind, context) : null;
      const reply = aiReply ?? fallbackCoachMessage(decision.kind, context);
      pushMessage({
        personId: person.id,
        kind: reply.kind,
        body: reply.body,
        suggestions: reply.suggestions ?? [],
        source: reply.source ?? "rules",
      });
      setLoading(false);
    },
    [data, person, pushMessage],
  );

  // Eén automatische poging per persoon per paginabezoek.
  useEffect(() => {
    const key = `${person.id}:${new Date().toDateString()}`;
    if (requested.current === key) return;
    requested.current = key;
    // Een compliment hoeft niet beantwoord te worden en blokkeert dus niets.
    const open = data.messages.some(
      (m) => m.personId === person.id && m.kind !== "praise" && !m.answeredAt && !m.dismissedAt,
    );
    if (open) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.id]);

  return { loading, generate };
}

export function activeMessage(messages: CoachMessage[], personId: string): CoachMessage | undefined {
  return messages
    .filter((m) => m.personId === personId && !m.dismissedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

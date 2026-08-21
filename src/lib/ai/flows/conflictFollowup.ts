import type { FlowDefinition, StepContext } from "@/lib/ai/conversation";
import { mkChoice } from "@/lib/ai/conversation";
import { awardFamilySkill } from "@/lib/gamification";
import type { FollowUpResult } from "@/lib/types";

/**
 * Follow-through na een conflict (release 3 §30). Wordt proactief gestart
 * door FlowRuntime zodra conflict.followUpAt verstreken is. Dit is het stuk
 * dat een gewone chatbot niet doet: Flow analyseert niet alleen, Flow komt
 * ook terug om te checken of het advies heeft geholpen.
 */

function conflictId(ctx: StepContext): string {
  return ctx.session.meta.conflictId ?? "";
}

export const conflictFollowupFlow: FlowDefinition = {
  id: "conflict-followup",
  title: "Hoe ging het?",
  entryStepId: "askResult",
  steps: {
    askResult: {
      id: "askResult",
      render: (ctx) => ({
        text: `Hey ${ctx.person.name} 👋 Je wilde het met ${ctx.session.meta.withWhom ?? "diegene"} uitpraten. Hoe ging het?`,
        choices: [
          mkChoice("good", "Goed"),
          mkChoice("better", "Een beetje beter"),
          mkChoice("not_resolved", "Niet gelukt"),
          mkChoice("still_conflict", "We hebben nog steeds ruzie"),
        ],
        inputType: "choice",
        avatarState: "coaching",
      }),
      onSubmit: (ctx, input) => {
        const result = input as FollowUpResult;
        ctx.mutate((d) => {
          const conflict = d.conflicts?.find((c) => c.id === conflictId(ctx));
          if (!conflict) return;
          conflict.followUpResult = result;
          conflict.followUpAnsweredAt = new Date().toISOString();
          conflict.status = result === "good" || result === "better" ? "resolved" : "unresolved";
        });
        if (input === "good" || input === "better") {
          const points = input === "good" ? 15 : 10;
          awardFamilySkill(ctx.data, ctx.person.id, "conflict_resolved", points, conflictId(ctx));
          ctx.setMeta("skillPoints", String(points));
        }
      },
      next: (_ctx, input) => (input === "good" || input === "better" ? "positiveClose" : "retryOffer"),
    },

    positiveClose: {
      id: "positiveClose",
      render: (ctx) => ({
        text: `Fijn om te horen! Dit soort dingen uitpraten is niet makkelijk — knap gedaan. 🌱 +${ctx.session.meta.skillPoints ?? "10"} Family Skills`,
        choices: [mkChoice("ok", "Bedankt Flow")],
        inputType: "choice",
        avatarState: "celebrating",
      }),
      next: () => null,
    },

    retryOffer: {
      id: "retryOffer",
      render: () => ({
        text: "Dat kan gebeuren. Niet elk gesprek lukt in één keer. Wil je het nog een keer proberen?",
        choices: [mkChoice("retry", "Ja, opnieuw proberen"), mkChoice("rest", "Ik laat het nu even rusten")],
        inputType: "choice",
        avatarState: "concerned",
      }),
      onSubmit: (ctx, input) => {
        if (input === "retry") ctx.setMeta("restartConflictCoach", "true");
      },
      next: (_ctx, input) => (input === "retry" ? "retryClose" : "restClose"),
    },

    retryClose: {
      id: "retryClose",
      render: () => ({
        text: "Oké, laten we het nog een keer proberen 💪",
        choices: [mkChoice("ok", "Verder")],
        inputType: "choice",
        avatarState: "coaching",
      }),
      next: () => null,
    },

    restClose: {
      id: "restClose",
      render: () => ({
        text: "Prima. Het hoeft niet in één keer op te lossen. Ik ben er als je verder wilt.",
        choices: [mkChoice("ok", "Oké")],
        inputType: "choice",
        avatarState: "happy",
      }),
      next: () => null,
    },
  },
};

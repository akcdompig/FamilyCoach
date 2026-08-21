import type { FlowDefinition } from "@/lib/ai/conversation";
import { mkChoice } from "@/lib/ai/conversation";
import { memoryFactTexts } from "@/lib/ai/memory";
import { checkInputSafety, ESCALATION_MESSAGE } from "@/lib/ai/safety";

/**
 * "Praat gewoon" — vrij gesprek (release 3 §2-3, §10-12). Elke beurt gaat
 * door de safety-classifier vóór de server iets te zien krijgt; de server
 * beslist zelf of research nodig is (needsExternalInformation) en synthetiseert
 * een kort, leeftijdspassend antwoord met keuzeknoppen voor het vervolg.
 */
export const freeChatFlow: FlowDefinition = {
  id: "free-chat",
  title: "Praat met Flow",
  entryStepId: "chat",
  steps: {
    chat: {
      id: "chat",
      render: async (ctx) => {
        const lastMessage = ctx.session.answers.lastMessage;
        if (!lastMessage) {
          return {
            text: "Waar denk je aan? Je kunt me van alles vragen of vertellen.",
            inputType: "text",
            placeholder: "Typ hier...",
            avatarState: "idle",
          };
        }
        const result = await ctx.callServer<{
          body: string;
          choices: string[];
          suggestConflictCoach?: boolean;
          source?: "ai" | "rules";
        }>("free-chat", {
          message: lastMessage,
          age: ctx.person.age,
          personId: ctx.person.id,
          memoryFacts: memoryFactTexts(ctx.data, ctx.person.id, 4),
          recentTurns: ctx.session.turns.slice(-4).map((t) => `${t.speaker}: ${t.text}`),
        });
        const choices = (result.choices ?? []).slice(0, 4).map((label, i) => mkChoice(`opt_${i}`, label));
        // Labels tijdelijk bewaren zodat onSubmit een klik kan terugvertalen naar tekst.
        choices.forEach((choice) => ctx.setMeta(`choice_${choice.id}`, choice.label));
        // FlowRuntime kijkt hiernaar om eventueel over te schakelen naar de conflict coach.
        ctx.setMeta("offerConflictCoach", String(Boolean(result.suggestConflictCoach)));
        return {
          text: result.body,
          choices,
          inputType: choices.length ? "choice" : "text",
          placeholder: "Typ hier...",
          avatarState: "happy",
          source: result.source,
        };
      },
      onSubmit: (ctx, input) => {
        const resolved = ctx.session.meta[`choice_${input}`] ?? input;
        if (checkInputSafety(resolved).safe) {
          ctx.setAnswer("lastMessage", resolved);
          ctx.setMeta("escalate", "false");
        } else {
          ctx.setMeta("escalate", "true");
        }
      },
      next: (ctx) => (ctx.session.meta.escalate === "true" ? "chatEscalation" : "chat"),
    },

    chatEscalation: {
      id: "chatEscalation",
      render: () => ({
        text: ESCALATION_MESSAGE,
        choices: [mkChoice("ok", "Begrepen")],
        inputType: "choice",
        avatarState: "concerned",
      }),
      onSubmit: (ctx) => ctx.setMeta("escalate", "false"),
      next: () => "chat",
    },
  },
};

import type { FlowDefinition } from "@/lib/ai/conversation";
import { mkChoice } from "@/lib/ai/conversation";

/**
 * Herinnering-check (release 3 §14, §40): "ouders bijspringen als ze zelf
 * even te druk zijn". Een ouder zet een reminder klaar (ouder/gezin), Flow
 * seint op het juiste moment — dit flow-tje handelt de reactie af.
 */

function reminderId(ctx: { session: { meta: Record<string, string> } }): string {
  return ctx.session.meta.reminderId ?? "";
}

export const reminderCheckFlow: FlowDefinition = {
  id: "reminder-check",
  title: "Herinnering",
  entryStepId: "ask",
  steps: {
    ask: {
      id: "ask",
      render: (ctx) => ({
        text: `⏰ ${ctx.session.meta.title ?? "Even een herinnering"}`,
        choices: [mkChoice("done", "Gedaan!", "✅"), mkChoice("snooze", "Nog even (15 min)", "⏳"), mkChoice("skip", "Niet nu", "✖️")],
        inputType: "choice",
        avatarState: "coaching",
      }),
      onSubmit: (ctx, input) => {
        ctx.mutate((d) => {
          const reminder = d.reminders?.find((r) => r.id === reminderId(ctx));
          if (!reminder) return;
          reminder.respondedAt = new Date().toISOString();
          if (input === "done") reminder.status = "done";
          else if (input === "skip") reminder.status = "dismissed";
          else {
            reminder.status = "pending";
            reminder.dueAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }
        });
        ctx.setAnswer("choice", input);
      },
      next: () => "closing",
    },

    closing: {
      id: "closing",
      render: (ctx) => {
        const choice = ctx.session.answers.choice;
        const text =
          choice === "done"
            ? "Mooi, goed gedaan! 🌟"
            : choice === "snooze"
              ? "Oké, ik herinner je over 15 minuten nog een keer."
              : "Prima, ik laat het rusten.";
        return { text, choices: [mkChoice("ok", "Oké")], inputType: "choice", avatarState: "happy" };
      },
      next: () => null,
    },
  },
};

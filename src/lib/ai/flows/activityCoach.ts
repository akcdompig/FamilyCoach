import type { FlowDefinition } from "@/lib/ai/conversation";
import { mkChoice } from "@/lib/ai/conversation";
import { appendCoachEvent } from "@/lib/coach/events";
import type { Completion, PendingActivity, Task, WellnessLog } from "@/lib/types";
import { dateKey, pointsFor, streakDays } from "@/lib/utils";

/**
 * Activity Coach — acceptancetest §44 stap 1-12. Sluit Flow niet af met een
 * suggestie: de challenge duwt het kind letterlijk de app uit ("Ga ervoor")
 * en checkt bij terugkomst wat er is gebeurd (release 3 §40-41).
 */

const ACTIVITY_LABEL: Record<string, string> = {
  fitness: "fitness",
  walk: "wandelen",
  football: "voetballen",
  run: "hardlopen",
  other: "bewegen",
};

export const activityCoachFlow: FlowDefinition = {
  id: "activity-coach",
  title: "Activiteit kiezen",
  entryStepId: "askType",
  steps: {
    askType: {
      id: "askType",
      render: (ctx) => {
        const interests = ctx.person.interests.map((i) => i.toLowerCase());
        const choices = [mkChoice("fitness", "Fitness", "🏋️"), mkChoice("walk", "Wandelen", "🚶")];
        if (interests.some((i) => i.includes("voetbal"))) choices.push(mkChoice("football", "Voetballen", "⚽"));
        if (interests.some((i) => i.includes("hardlopen") || i.includes("rennen"))) choices.push(mkChoice("run", "Hardlopen", "🏃"));
        choices.push(mkChoice("other", "Iets anders", "➕"));
        return {
          text: "Je hebt vandaag nog niet bewogen. Wat zou je willen doen?",
          choices: choices.slice(0, 4),
          inputType: "choice",
          avatarState: "coaching",
        };
      },
      onSubmit: (ctx, input) => {
        ctx.setAnswer("activityId", input);
        ctx.setMeta("activityLabel", ACTIVITY_LABEL[input] ?? "bewegen");
      },
      next: () => "askDuration",
    },

    askDuration: {
      id: "askDuration",
      render: (ctx) => ({
        text: `Hoe lang wil je ${ctx.session.meta.activityLabel ?? "bewegen"} vandaag?`,
        choices: [mkChoice("10", "10 minuten"), mkChoice("15", "15 minuten"), mkChoice("20", "20 minuten"), mkChoice("30", "30 minuten")],
        inputType: "choice",
        avatarState: "coaching",
      }),
      onSubmit: (ctx, input) => ctx.setMeta("minutes", input),
      next: () => "challengeLaunch",
    },

    challengeLaunch: {
      id: "challengeLaunch",
      render: (ctx) => ({
        text: `Kleine challenge: ${ctx.session.meta.minutes ?? "20"} minuten ${ctx.session.meta.activityLabel ?? "bewegen"} 💪`,
        choices: [mkChoice("start", "Ik ga ervoor"), mkChoice("cancel", "Toch niet nu")],
        inputType: "challenge",
        avatarState: "celebrating",
      }),
      onSubmit: (ctx, input) => {
        ctx.setAnswer("launchChoice", input);
        if (input !== "start") return;
        const minutes = Number(ctx.session.meta.minutes ?? "20");
        const pending: PendingActivity = {
          id: `pact_${Math.random().toString(36).slice(2, 10)}`,
          personId: ctx.person.id,
          label: ctx.session.meta.activityLabel ?? "bewegen",
          minutes,
          startedAt: new Date().toISOString(),
        };
        ctx.mutate((d) => {
          d.pendingActivities = [...(d.pendingActivities ?? []).filter((p) => p.personId !== ctx.person.id), pending];
        });
      },
      next: () => "launched",
    },

    launched: {
      id: "launched",
      render: (ctx) => ({
        text:
          ctx.session.answers.launchChoice === "start"
            ? "Veel plezier! 💪 Kom terug naar Flow als je klaar bent — ik hou je streak warm. 👋"
            : "Oké, geen probleem. Kies wanneer het jou uitkomt.",
        choices: [mkChoice("ok", "Doe ik!")],
        inputType: "choice",
        avatarState: "happy",
      }),
      next: () => null,
    },

    welcomeBack: {
      id: "welcomeBack",
      render: (ctx) => ({
        text: `Welkom terug 👋 Hoe ging ${ctx.session.meta.activityLabel ?? "het"} (${ctx.session.meta.minutes ?? "?"} min)?`,
        choices: [mkChoice("done", "Ik heb het gedaan"), mkChoice("partial", "Een deel gelukt"), mkChoice("no", "Het lukte niet")],
        inputType: "choice",
        avatarState: "happy",
      }),
      onSubmit: (ctx, input) => {
        ctx.mutate((d) => {
          d.pendingActivities = (d.pendingActivities ?? []).filter((p) => p.id !== ctx.session.meta.pendingActivityId);
        });
        if (input === "no") return;
        const minutes = Number(ctx.session.meta.minutes ?? "20");
        const points = input === "done" ? 10 : 5;
        const today = new Date();
        const task: Task = {
          id: `task_${Math.random().toString(36).slice(2, 10)}`,
          familyId: ctx.data.family.id,
          personId: ctx.person.id,
          title: `${ctx.session.meta.activityLabel ?? "Bewegen"} (${minutes} min, via Flow)`,
          category: "beweging",
          days: [today.getDay()],
          points,
          shared: false,
          // Actief (niet gepauzeerd): dayProgress/streakDays tellen alleen actieve
          // taken mee, dus dit moet "aan" staan om vandaag echt mee te tellen.
          active: true,
          createdAt: new Date().toISOString(),
        };
        const completion: Completion = {
          id: `cmp_${Math.random().toString(36).slice(2, 10)}`,
          taskId: task.id,
          personId: ctx.person.id,
          date: dateKey(),
          completedAt: new Date().toISOString(),
        };
        const log: WellnessLog = {
          id: `well_${Math.random().toString(36).slice(2, 10)}`,
          familyId: ctx.data.family.id,
          personId: ctx.person.id,
          kind: "movement",
          value: minutes,
          unit: "min",
          date: dateKey(),
          verification: "SELF_REPORTED",
          createdAt: new Date().toISOString(),
        };
        ctx.mutate((d) => {
          d.tasks.push(task);
          d.completions.push(completion);
          d.wellnessLogs = [...(d.wellnessLogs ?? []), log];
          appendCoachEvent(d, { personId: ctx.person.id, type: "SPORT_COMPLETED" });
        });
        ctx.setAnswer("resultPoints", String(points));
      },
      next: (_ctx, input) => (input === "no" ? "tryAgainLater" : "celebrate"),
    },

    celebrate: {
      id: "celebrate",
      render: (ctx) => {
        const points = pointsFor(ctx.data, ctx.person.id);
        const streak = streakDays(ctx.data, ctx.person.id);
        return {
          text: `Nice! +${ctx.session.answers.resultPoints ?? "10"} punten. Je hebt nu ${points} punten in totaal en een streak van 🔥 ${streak} ${streak === 1 ? "dag" : "dagen"}.`,
          choices: [mkChoice("ok", "Top!")],
          inputType: "choice",
          avatarState: "celebrating",
        };
      },
      next: () => null,
    },

    tryAgainLater: {
      id: "tryAgainLater",
      render: () => ({
        text: "Geen probleem. Niet elke dag lukt het. Wil je nu iets kleiners kiezen?",
        choices: [mkChoice("smaller", "Iets kleiners kiezen"), mkChoice("later", "Later")],
        inputType: "choice",
        avatarState: "concerned",
      }),
      next: (_ctx, input) => (input === "smaller" ? "askType" : null),
    },
  },
};

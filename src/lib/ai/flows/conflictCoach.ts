import type { FlowDefinition, StepContext } from "@/lib/ai/conversation";
import { mkChoice } from "@/lib/ai/conversation";
import { appendCoachEvent } from "@/lib/coach/events";
import { awardFamilySkill } from "@/lib/gamification";
import { noteConflictPattern } from "@/lib/ai/memory";
import { checkInputSafety, ESCALATION_MESSAGE } from "@/lib/ai/safety";
import type { ConflictReport } from "@/lib/types";

/**
 * Conflict Coach (release 3 §4-§8, §29). Deterministische stapgraaf; de
 * "solution" en "roleplayReply" stappen roepen de server (api/flow) aan voor
 * AI-synthese op strong-tier, met een sjabloon-fallback zonder AI-key.
 *
 * Volgorde: intro -> [withWhom -> topic -> feeling -> whatHappened ->
 * otherFeeling -> goal] -> resolutionPath -> (coolingOff | solution ->
 * practiceOffer -> [roleplay-lus] -> reconnection -> followUpOffer -> closing)
 */

function getConflict(ctx: StepContext): ConflictReport | undefined {
  return ctx.data.conflicts?.find((c) => c.id === ctx.session.meta.conflictId);
}

function upsertConflict(ctx: StepContext, patch: Partial<ConflictReport>): void {
  ctx.mutate((d) => {
    const existing = d.conflicts?.find((c) => c.id === ctx.session.meta.conflictId);
    if (existing) {
      Object.assign(existing, patch);
      return;
    }
    const conflict: ConflictReport = {
      id: `conf_${Math.random().toString(36).slice(2, 10)}`,
      familyId: d.family.id,
      personId: ctx.person.id,
      withWhom: ctx.session.answers.withWhom ?? "iemand",
      topic: ctx.session.answers.topic ?? "iets",
      feeling: ctx.session.answers.feeling ?? "",
      description: "",
      privacy: "PRIVATE",
      status: "open",
      createdAt: new Date().toISOString(),
      ...patch,
    };
    d.conflicts = [...(d.conflicts ?? []), conflict];
    ctx.session.meta.conflictId = conflict.id;
    appendCoachEvent(d, { personId: ctx.person.id, type: "CONFLICT_REPORTED" });
    noteConflictPattern(d, conflict);
  });
}

function resolvePersonLabel(ctx: StepContext, input: string): string {
  if (input.startsWith("person:")) {
    const id = input.slice("person:".length);
    return ctx.data.people.find((p) => p.id === id)?.name ?? "iemand";
  }
  if (input === "friend") return "een vriend(in)";
  if (input === "teacher") return "een leraar";
  if (input === "other") return "iemand anders";
  return input;
}

const TOPIC_LABEL: Record<string, string> = {
  screen: "telefoon/scherm",
  homework: "huiswerk",
  tidy: "opruimen",
  money: "geld",
  school: "school",
  sport: "sport",
  said: "iets wat iemand zei",
  other: "iets anders",
};

const FEELING_LABEL: Record<string, string> = {
  angry: "boos",
  sad: "verdrietig",
  frustrated: "gefrustreerd",
  confused: "verward",
  unsure: "eigenlijk weet ik het niet",
};

export const conflictCoachFlow: FlowDefinition = {
  id: "conflict-coach",
  title: "Conflict coach",
  entryStepId: "intro",
  steps: {
    intro: {
      id: "intro",
      render: (ctx) => ({
        text: ctx.session.meta.withWhom
          ? `Dat klinkt niet fijn, dat met ${ctx.session.meta.withWhom}. Wil je dat ik je help om het weer goed te krijgen?`
          : "Dat klinkt niet fijn. Wil je dat ik je help om het weer goed te krijgen?",
        choices: [mkChoice("yes", "Ja, help me"), mkChoice("vent", "Ik wil het alleen even vertellen"), mkChoice("later", "Later")],
        inputType: "choice",
        avatarState: "concerned",
      }),
      next: (ctx, input) => {
        if (input === "vent") return "ventText";
        if (input === "later") return "laterClosing";
        return ctx.session.meta.withWhom ? "topic" : "withWhom";
      },
    },

    laterClosing: {
      id: "laterClosing",
      render: () => ({
        text: "Oké, ik ben er als je zover bent. Je vindt me terug via de Flow-knop.",
        choices: [mkChoice("ok", "Oké")],
        inputType: "choice",
        avatarState: "idle",
      }),
      next: () => null,
    },

    ventText: {
      id: "ventText",
      render: () => ({
        text: "Ik luister. Vertel maar wat er gebeurd is.",
        inputType: "text",
        placeholder: "Schrijf het in je eigen woorden...",
        avatarState: "listening",
      }),
      onSubmit: (ctx, input) => {
        const safety = checkInputSafety(input);
        upsertConflict(ctx, {
          description: input,
          privacy: safety.safe ? "PRIVATE" : "SAFETY_RELEVANT",
        });
      },
      next: (_ctx, input) => (checkInputSafety(input).safe ? "ventAck" : "escalation"),
    },

    ventAck: {
      id: "ventAck",
      render: () => ({
        text: "Je gevoel mag er zijn. Fijn dat je het deelt.",
        choices: [mkChoice("proceed", "Ik wil er nu iets aan doen"), mkChoice("rest", "Ik laat het even rusten")],
        inputType: "choice",
        avatarState: "happy",
      }),
      next: (ctx, input) => {
        if (input === "rest") return "laterClosing";
        return ctx.session.meta.withWhom ? "topic" : "withWhom";
      },
    },

    withWhom: {
      id: "withWhom",
      render: (ctx) => {
        const others = ctx.data.people.filter((p) => p.id !== ctx.person.id);
        const choices = [
          ...others.map((p) => mkChoice(`person:${p.id}`, p.name)),
          mkChoice("friend", "Vriend(in)"),
          mkChoice("teacher", "Leraar"),
          mkChoice("other", "Iemand anders"),
        ];
        return { text: "Met wie heb je ruzie?", choices, inputType: "choice", avatarState: "listening" };
      },
      onSubmit: (ctx, input) => {
        const label = resolvePersonLabel(ctx, input);
        ctx.setAnswer("withWhom", label);
        ctx.setMeta("withWhom", label);
      },
      next: () => "topic",
    },

    topic: {
      id: "topic",
      render: () => ({
        text: "Waar ging het ongeveer over?",
        choices: Object.entries(TOPIC_LABEL).map(([id, label]) => mkChoice(id, label)),
        inputType: "choice",
        avatarState: "listening",
      }),
      onSubmit: (ctx, input) => ctx.setAnswer("topic", TOPIC_LABEL[input] ?? input),
      next: () => "feeling",
    },

    feeling: {
      id: "feeling",
      render: () => ({
        text: "Hoe voel je je?",
        choices: [
          mkChoice("angry", "boos", "😡"),
          mkChoice("sad", "verdrietig", "😔"),
          mkChoice("frustrated", "gefrustreerd", "😤"),
          mkChoice("confused", "verward", "😕"),
          mkChoice("unsure", "eigenlijk weet ik het niet", "😐"),
        ],
        inputType: "choice",
        avatarState: "listening",
      }),
      onSubmit: (ctx, input) => ctx.setAnswer("feeling", FEELING_LABEL[input] ?? input),
      next: () => "whatHappened",
    },

    whatHappened: {
      id: "whatHappened",
      render: () => ({
        text: "Wat gebeurde er? Vertel het in je eigen woorden.",
        inputType: "text",
        placeholder: "Typ hier wat er gebeurde...",
        avatarState: "listening",
      }),
      onSubmit: (ctx, input) => {
        const safety = checkInputSafety(input);
        ctx.setAnswer("whatHappened", input);
        upsertConflict(ctx, {
          withWhom: ctx.session.answers.withWhom,
          topic: ctx.session.answers.topic,
          feeling: ctx.session.answers.feeling,
          description: input,
          privacy: safety.safe ? "PRIVATE" : "SAFETY_RELEVANT",
        });
      },
      next: (_ctx, input) => (checkInputSafety(input).safe ? "otherFeeling" : "escalation"),
    },

    escalation: {
      id: "escalation",
      render: () => ({
        text: ESCALATION_MESSAGE,
        choices: [mkChoice("ok", "Begrepen")],
        inputType: "choice",
        avatarState: "concerned",
      }),
      next: () => null,
    },

    otherFeeling: {
      id: "otherFeeling",
      render: (ctx) => ({
        text: `Wat denk je dat ${ctx.session.answers.withWhom ?? "de ander"} voelde?`,
        choices: [
          mkChoice("angry", "boos", "😡"),
          mkChoice("sad", "verdrietig", "😔"),
          mkChoice("frustrated", "gefrustreerd", "😤"),
          mkChoice("unsure", "ik weet het niet", "😕"),
        ],
        inputType: "choice",
        avatarState: "thinking",
      }),
      onSubmit: (ctx, input) => ctx.setAnswer("otherFeeling", FEELING_LABEL[input] ?? input),
      next: () => "goal",
    },

    goal: {
      id: "goal",
      render: () => ({
        text: "Wat wil je eigenlijk bereiken?",
        choices: [
          mkChoice("understand", "Dat ze begrijpt waarom ik boos ben"),
          mkChoice("apologize", "Sorry zeggen"),
          mkChoice("stop", "Dat het stopt"),
          mkChoice("agreement", "Een afspraak maken"),
        ],
        inputType: "choice",
        avatarState: "thinking",
      }),
      onSubmit: (ctx, input) => {
        const labels: Record<string, string> = {
          understand: "dat ze begrijpt waarom ik boos ben",
          apologize: "sorry zeggen",
          stop: "dat het stopt",
          agreement: "een afspraak maken",
        };
        const label = labels[input] ?? input;
        ctx.setAnswer("goal", label);
        upsertConflict(ctx, { goal: label, otherFeeling: ctx.session.answers.otherFeeling });
      },
      next: () => "resolutionPath",
    },

    resolutionPath: {
      id: "resolutionPath",
      render: (ctx) => ({
        text: `Volgens mij was je vooral ${ctx.session.answers.feeling ?? "overstuur"} omdat er iets gebeurde rond ${ctx.session.answers.topic ?? "dit"}. Je kunt twee dingen doen.`,
        choices: [mkChoice("talk", "Ik wil het uitpraten", "🗣️"), mkChoice("cool", "Ik wil eerst even afkoelen", "⏳")],
        inputType: "choice",
        avatarState: "coaching",
      }),
      next: (_ctx, input) => (input === "cool" ? "coolingOff" : "solution"),
    },

    coolingOff: {
      id: "coolingOff",
      render: () => ({
        text: "Dat is prima. Even afkoelen is ook een manier om rustig te blijven. Als je zover bent, kun je dit gesprek hier weer oppakken.",
        choices: [mkChoice("ok", "Oké")],
        inputType: "choice",
        avatarState: "happy",
      }),
      onSubmit: (ctx) => {
        upsertConflict(ctx, { status: "cooling_off" });
        awardFamilySkill(ctx.data, ctx.person.id, "calm_communication", 5, ctx.session.meta.conflictId);
      },
      next: () => null,
    },

    solution: {
      id: "solution",
      render: async (ctx) => {
        const tone = (ctx.session.meta.solutionTone as "default" | "casual" | "alternative") ?? "default";
        const result = await ctx.callServer<{ summary: string; message: string; source?: "ai" | "rules" }>("conflict-analysis", {
          age: ctx.person.age,
          withWhom: ctx.session.answers.withWhom,
          topic: ctx.session.answers.topic,
          feeling: ctx.session.answers.feeling,
          otherFeeling: ctx.session.answers.otherFeeling,
          goal: ctx.session.answers.goal,
          description: ctx.session.answers.whatHappened,
          tone,
        });
        ctx.setAnswer("suggestedMessage", result.message);
        upsertConflict(ctx, { suggestedMessage: result.message });
        return {
          text: `${result.summary}\n\nProbeer dit:\n"${result.message}"`,
          choices: [
            mkChoice("accept", "Dit ga ik zeggen", "👍"),
            mkChoice("casual", "Maak het meer zoals ik praat", "✏️"),
            mkChoice("alt", "Geef me een andere manier", "🔄"),
          ],
          inputType: "choice",
          avatarState: "coaching",
          source: result.source,
        };
      },
      next: (ctx, input) => {
        if (input === "casual") {
          ctx.setMeta("solutionTone", "casual");
          return "solution";
        }
        if (input === "alt") {
          ctx.setMeta("solutionTone", "alternative");
          return "solution";
        }
        return "practiceOffer";
      },
    },

    practiceOffer: {
      id: "practiceOffer",
      render: () => ({
        text: "Wil je oefenen wat je gaat zeggen, of ga je het gelijk zelf zeggen?",
        choices: [mkChoice("practice", "Oefenen met Flow"), mkChoice("self", "Ik ga het zelf zeggen")],
        inputType: "choice",
        avatarState: "coaching",
      }),
      onSubmit: (ctx, input) => upsertConflict(ctx, { practiced: input === "practice" }),
      next: (_ctx, input) => (input === "practice" ? "roleplayTurn" : "reconnection"),
    },

    roleplayTurn: {
      id: "roleplayTurn",
      render: (ctx) => ({
        text: ctx.session.meta.roleplayRound
          ? "Probeer het nog eens. Wat zeg je?"
          : `Oké, ik ben ${ctx.session.answers.withWhom ?? "de ander"}. Wat wil je zeggen?`,
        inputType: "text",
        placeholder: "Typ hier wat je zou zeggen...",
        avatarState: "listening",
      }),
      onSubmit: (ctx, input) => ctx.setAnswer("lastLine", input),
      next: () => "roleplayReply",
    },

    roleplayReply: {
      id: "roleplayReply",
      render: async (ctx) => {
        const reply = await ctx.callServer<{ reply: string; source?: "ai" | "rules" }>("roleplay-reply", {
          withWhom: ctx.session.answers.withWhom,
          topic: ctx.session.answers.topic,
          childSaid: ctx.session.answers.lastLine,
        });
        return {
          text: `"${reply.reply}"\n\nWil je het nog een keer proberen?`,
          choices: [mkChoice("again", "Nog een keer"), mkChoice("done", "Ik ben klaar")],
          inputType: "choice",
          avatarState: "coaching",
          source: reply.source,
        };
      },
      next: (ctx, input) => {
        if (input === "again") {
          ctx.setMeta("roleplayRound", String(Number(ctx.session.meta.roleplayRound ?? "0") + 1));
          return "roleplayTurn";
        }
        return "reconnection";
      },
    },

    reconnection: {
      id: "reconnection",
      render: () => ({
        text: "Je hebt het uitgepraat ❤️ Wil je nu iets doen om het weer goed te maken?",
        choices: [
          mkChoice("sorry", "Sorry zeggen", "🗣️"),
          mkChoice("agreement", "Afspraak maken", "🤝"),
          mkChoice("hug", "Even knuffelen", "❤️"),
          mkChoice("together", "Samen iets doen", "🎮"),
          mkChoice("rest", "Eerst even rust nemen", "⏳"),
        ],
        inputType: "choice",
        avatarState: "happy",
      }),
      onSubmit: (ctx, input) => {
        const map: Record<string, { type: Parameters<typeof awardFamilySkill>[2]; points: number }> = {
          sorry: { type: "apology", points: 10 },
          agreement: { type: "agreement_made", points: 10 },
          hug: { type: "conflict_resolved", points: 10 },
          together: { type: "conflict_resolved", points: 10 },
          rest: { type: "calm_communication", points: 5 },
        };
        const choice = map[input] ?? map.rest;
        awardFamilySkill(ctx.data, ctx.person.id, choice.type, choice.points, ctx.session.meta.conflictId);
        ctx.setMeta("skillPoints", String(choice.points));
        upsertConflict(ctx, { status: "attempting" });
      },
      next: () => "followUpOffer",
    },

    followUpOffer: {
      id: "followUpOffer",
      render: (ctx) => ({
        text: `Mooi. Je hebt niet alleen het probleem besproken, je hebt ook geprobeerd het op te lossen. +${ctx.session.meta.skillPoints ?? "10"} Family Skills 🌱\n\nWil je over 30 minuten laten weten hoe het ging?`,
        choices: [mkChoice("yes", "Ja"), mkChoice("no", "Nee")],
        inputType: "choice",
        avatarState: "celebrating",
      }),
      onSubmit: (ctx, input) => {
        if (input === "yes") {
          const followUpAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          upsertConflict(ctx, { followUpAt });
        } else {
          upsertConflict(ctx, { status: "resolved" });
        }
        ctx.setAnswer("followUp", input);
      },
      next: () => "closing",
    },

    closing: {
      id: "closing",
      render: (ctx) => ({
        text:
          ctx.session.answers.followUp === "yes"
            ? "Toppie. Ik vraag het je straks even. Tot zo! 👋"
            : "Oké, geen probleem. Ik ben er als je me nodig hebt.",
        choices: [mkChoice("ok", "Oké 👍")],
        inputType: "choice",
        avatarState: "happy",
      }),
      next: () => null,
    },
  },
};

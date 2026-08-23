"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckIn } from "@/components/CheckIn";
import { CoachMessageCard } from "@/components/CoachMessageCard";
import { DayRhythm } from "@/components/DayRhythm";
import { ConfettiBurst, useConfetti } from "@/components/effects/ConfettiBurst";
import { FlowAvatar } from "@/components/flow/FlowAvatar";
import { FlowInsightCard } from "@/components/flow/FlowInsightCard";
import { Icon } from "@/components/Icons";
import { TaskCard } from "@/components/TaskCard";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Progress, Ring } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { activeMessage, useCoachMoment } from "@/lib/coach/useCoach";
import { useFlowRuntime } from "@/lib/flow/FlowRuntime";
import { allowanceFor, badgeLabel, pointsSummary } from "@/lib/gamification";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Mood } from "@/lib/types";
import {
  addDays,
  checkInFor,
  children,
  dateKey,
  GOAL_DOMAIN_ICON,
  goalDomain,
  goalProgressFor,
  goalsLinkedToTask,
  greeting,
  isDone,
  minutesFromString,
  minutesNow,
  movedInTasks,
  pointsFor,
  tasksForPerson,
  taskPriorityFor,
  WEEKDAY_LONG,
} from "@/lib/utils";

const MOOD_FROM_LABEL: Record<string, Mood> = {
  Goed: "good",
  "Gaat wel": "ok",
  "Niet zo goed": "low",
};

const PRAISE = [
  "Mooi. Dat heb je zelf gedaan.",
  "Goed bezig.",
  "Kleine stap, groot verschil.",
  "Netjes afgevinkt.",
];

export default function ChildHome() {
  const {
    data,
    activePerson,
    setActivePerson,
    addCheckIn,
    toggleTask,
    answerMessage,
    dismissMessage,
    postponeTask,
    skipTask,
    setTaskPriority,
    toggleActivity,
  } = useFamilyFlow();
  const toast = useToast();
  const { suggestion, insight, dismissInsight, openPanel } = useFlowRuntime();

  const kids = children(data);
  const child = activePerson.role === "child" ? activePerson : kids[0];

  useEffect(() => {
    if (child && child.id !== activePerson.id) setActivePerson(child.id);
  }, [child, activePerson.id, setActivePerson]);

  const target = child ?? activePerson;
  const { loading, generate } = useCoachMoment(target);

  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));

  const scheduled = child ? tasksForPerson(data, child.id, today) : [];
  const incoming = child ? movedInTasks(data, child.id, today) : [];
  const incomingIds = new Set(incoming.map((t) => t.id));
  const combined = [...scheduled, ...incoming].sort(
    (a, b) => minutesFromString(a.time ?? "23:59") - minutesFromString(b.time ?? "23:59"),
  );
  const nowMinutes = minutesNow();
  const withStatus = combined.map((task) => {
    const done = isDone(data, task.id, today);
    return {
      task,
      done,
      priority: child ? taskPriorityFor(data, task.id, child.id, today) : ("normal" as const),
      moved: incomingIds.has(task.id),
      overdue: !done && Boolean(task.time) && minutesFromString(task.time as string) < nowMinutes,
    };
  });
  const open = withStatus.filter((item) => !item.done);
  const doneList = withStatus.filter((item) => item.done);
  const nextUp = open.find((item) => item.priority === "high") ?? open[0];
  const rest = open.filter((item) => item !== nextUp);

  // Vanaf 13 wordt de viering rustiger — dezelfde erkenning, minder kinderlijk effectbetoon.
  const isTeen = (child?.age ?? 0) >= 13;
  const { trigger, fire } = useConfetti();
  const celebratedRef = useRef(false);
  useEffect(() => {
    const allDone = withStatus.length > 0 && open.length === 0;
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      if (!isTeen) fire();
    }
    if (!allDone) celebratedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.length, withStatus.length, isTeen]);

  if (!child) {
    return (
      <AppShell role="child">
        <EmptyState
          title="Nog geen kind in dit gezin"
          description="Voeg iemand toe via het ouderdashboard, dan verschijnt hier een eigen dashboard."
          icon="👋"
        />
      </AppShell>
    );
  }

  const message = activeMessage(data.messages, child.id);
  const myCheckIn = checkInFor(data, child.id);
  const points = pointsFor(data, child.id);
  const summary = pointsSummary(data, target.id);
  const wallet = allowanceFor(data, child);
  const activity = data.activities.find((item) => item.date === todayKey);
  const joinedActivity = Boolean(activity?.completedBy.includes(child.id));
  const openGoals = data.goals
    .filter((goal) => (!goal.personId || goal.personId === child.id) && goalProgressFor(data, goal) < goal.target)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const nearestGoal = openGoals[0];
  const nearestGoalProgress = nearestGoal ? goalProgressFor(data, nearestGoal) : 0;

  function replanHandlers(taskId: string, priority: "high" | "normal") {
    return {
      onPostpone: () => {
        postponeTask(taskId, child.id, todayKey, tomorrowKey);
        toast("Verplaatst naar morgen", "Geen probleem — morgen weer een kans.");
      },
      onSkip: () => {
        skipTask(taskId, child.id, todayKey);
        toast("Overgeslagen voor vandaag");
      },
      onTogglePriority: () => setTaskPriority(taskId, child.id, todayKey, priority !== "high"),
    };
  }

  function completeTask(taskId: string, points: number, praise: string) {
    const nowDone = toggleTask(taskId, child.id);
    if (!nowDone) return;
    const linkedGoal = goalsLinkedToTask(data, taskId)[0];
    if (linkedGoal) {
      const progress = goalProgressFor(data, linkedGoal) + 1;
      toast(`+${points} punten`, `Ook een stap dichter bij "${linkedGoal.title}" (${Math.min(progress, linkedGoal.target)}/${linkedGoal.target})`);
    } else {
      toast(`+${points} punten`, praise);
    }
  }

  return (
    <AppShell role="child">
      <ConfettiBurst trigger={trigger} />

      <header className="mb-6">
        <p className="text-sm capitalize text-muted">
          {WEEKDAY_LONG[today.getDay()]} · {withStatus.length > 0 ? `${doneList.length}/${withStatus.length} klaar` : "vrije dag"}
        </p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="font-display text-[30px] font-semibold leading-tight text-ink sm:text-[34px]">
            {greeting()}, {child.name}
          </h1>
          {withStatus.length > 0 ? (
            <div className="shrink-0 pt-1">
              <Ring value={doneList.length} max={withStatus.length} tone="progress" size={52} />
            </div>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          {withStatus.length === 0
            ? "Vandaag staat er niets gepland. Fijne dag."
            : open.length === 0
              ? "Alles van vandaag staat af. Mooi."
              : `Nog ${open.length} ${open.length === 1 ? "ding" : "dingen"} vandaag. Je hoeft niet alles tegelijk.`}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-light px-3 py-1.5 text-sm">
            <Icon name="flame" className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono font-semibold text-ink">{summary.streak}</span>
            <span className="text-muted">{badgeLabel(data, child.id)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-light px-3 py-1.5 text-sm">
            <span className="font-mono font-semibold text-ink">+{summary.today}</span>
            <span className="text-muted">vandaag</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
            <span className="font-mono font-semibold text-ink">{points}</span>
            <span className="text-muted">punten totaal</span>
          </span>
        </div>
      </header>

      {suggestion ? (
        <button
          type="button"
          onClick={openPanel}
          className="mb-6 flex w-full items-center gap-4 rounded-3xl bg-gradient-to-br from-sage-light via-surface to-sand-light p-5 text-left shadow-soft ring-1 ring-sage-dark/40 transition hover:-translate-y-0.5"
        >
          <FlowAvatar state="coaching" size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primary/70">Flow zegt</p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink">{suggestion.message}</p>
          </div>
          <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white">
            Praat met Flow
          </span>
        </button>
      ) : insight ? (
        <FlowInsightCard insight={insight} onDismiss={dismissInsight} />
      ) : null}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          {nextUp ? (
            <section>
              <SectionTitle>Wat nu?</SectionTitle>
              <TaskCard
                task={nextUp.task}
                done={false}
                highlight
                priority={nextUp.priority}
                moved={nextUp.moved}
                overdue={nextUp.overdue}
                onToggle={() => completeTask(nextUp.task.id, nextUp.task.points, PRAISE[0])}
                {...replanHandlers(nextUp.task.id, nextUp.priority)}
              />
            </section>
          ) : withStatus.length > 0 ? (
            <Card tone="sage" className="animate-pop">
              <p className="text-[16px] font-medium leading-relaxed text-ink">
                Alles van vandaag staat af. Dat heb je zelf gedaan.
              </p>
              <Link href="/kind/samen" className="mt-3 inline-block text-sm text-primary hover:underline">
                Doe iets leuks bij Samen
              </Link>
            </Card>
          ) : null}

          {withStatus.length > 0 ? (
            <section className="mt-6">
              <DayRhythm tasks={withStatus} />
            </section>
          ) : null}

          <section className="mt-8">
            <SectionTitle
              action={
                <Link href="/kind/plan" className="text-sm text-primary hover:underline">
                  Alles zien
                </Link>
              }
            >
              Mijn verantwoordelijkheden
            </SectionTitle>

            {withStatus.length === 0 ? (
              <EmptyState
                title="Vandaag staat er niets"
                description="Geniet ervan. Morgen pakken we het weer op."
                icon="🌤️"
              />
            ) : (
              <div className="space-y-2.5">
                {rest.map(({ task, priority, moved, overdue }) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={false}
                    priority={priority}
                    moved={moved}
                    overdue={overdue}
                    onToggle={() => completeTask(task.id, task.points, PRAISE[task.id.length % PRAISE.length])}
                    {...replanHandlers(task.id, priority)}
                  />
                ))}
                {doneList.map(({ task }) => (
                  <TaskCard key={task.id} task={task} done onToggle={() => toggleTask(task.id, child.id)} />
                ))}
              </div>
            )}
          </section>

          {suggestion && (message?.kind === "nudge" || message?.kind === "suggestion") ? null : (
            <section className="mt-8">
              <CoachMessageCard
                message={message}
                loading={loading}
                onRefresh={() => void generate(open.length > 0 ? "suggestion" : "praise")}
                onDismiss={message ? () => dismissMessage(message.id) : undefined}
                onSuggestion={(label) => {
                  const mood = MOOD_FROM_LABEL[label];
                  if (mood) addCheckIn(child.id, mood);
                  else if (message) answerMessage(message.id);
                }}
              />
            </section>
          )}

          {!myCheckIn ? (
            <section className="mt-6">
              <SectionTitle>Check-in</SectionTitle>
              <CheckIn onSelect={(mood, note) => addCheckIn(child.id, mood, note)} />
            </section>
          ) : null}
        </div>

        <aside className="mt-8 space-y-6 lg:mt-0">
          {nearestGoal ? (
            <Card tone="progress">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-progress-dark">
                <Icon name={GOAL_DOMAIN_ICON[goalDomain(nearestGoal)]} className="h-3.5 w-3.5" />
                Waar ik naartoe werk
              </p>
              <p className="mt-2 font-medium text-ink">{nearestGoal.title}</p>
              <div className="mt-3 flex items-baseline justify-between text-sm text-muted">
                <span className="font-mono tabular-nums">
                  {nearestGoalProgress}/{nearestGoal.target} {nearestGoal.unit ?? ""}
                </span>
                <span>+{nearestGoal.points} punten</span>
              </div>
              <Progress value={nearestGoalProgress} max={nearestGoal.target} tone="progress" className="mt-2" />
              <Link href="/kind/doelen" className="mt-3 inline-block text-sm text-primary hover:underline">
                Al mijn doelen
              </Link>
            </Card>
          ) : null}

          {activity ? (
            <Card tone="sage">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primary/70">Samen vandaag</p>
              <p className="mt-2 font-medium text-ink">{activity.title}</p>
              <p className="mt-1 text-sm text-muted">{activity.description}</p>
              <button
                type="button"
                onClick={() => toggleActivity(activity.id, child.id)}
                className="mt-3 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                {joinedActivity ? "Je doet mee" : "Ik doe mee"}
              </button>
            </Card>
          ) : null}

          <Link href="/kind/wallet" className="block">
            <Card tone="sand" className="transition hover:-translate-y-0.5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent-dark">Mijn zakgeld</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                <span className="font-mono">€{wallet.earned.toFixed(2)}</span>{" "}
                <span className="text-sm font-normal text-muted">/ €{wallet.maximum.toFixed(2)}</span>
              </p>
              <p className="mt-2 text-sm text-muted">Deze week verdiend, bekijk het overzicht.</p>
            </Card>
          </Link>

          <Link href="/kind/conflict" className="block">
            <Card tone="outline" className="transition hover:-translate-y-0.5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Samen praten</p>
              <p className="mt-2 text-lg font-semibold text-ink">Er is iets gebeurd</p>
              <p className="mt-1 text-sm text-muted">
                Flow helpt je rustig uitzoeken wat een volgende stap kan zijn.
              </p>
            </Card>
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

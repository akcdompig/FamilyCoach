"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckIn } from "@/components/CheckIn";
import { CoachMessageCard } from "@/components/CoachMessageCard";
import { DayRhythm } from "@/components/DayRhythm";
import { ConfettiBurst, useConfetti } from "@/components/effects/ConfettiBurst";
import { FlowAvatar } from "@/components/flow/FlowAvatar";
import { TaskCard } from "@/components/TaskCard";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { activeMessage, useCoachMoment } from "@/lib/coach/useCoach";
import { useFlowRuntime } from "@/lib/flow/FlowRuntime";
import { badgeLabel, familySkillsFor, pointsSummary } from "@/lib/gamification";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Mood } from "@/lib/types";
import {
  checkInFor,
  children,
  dateKey,
  greeting,
  isDone,
  pointsFor,
  tasksForPerson,
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

const STAT_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const STAT_CARD = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 22 } },
};

export default function ChildHome() {
  const { data, activePerson, setActivePerson, addCheckIn, toggleTask, answerMessage, dismissMessage } =
    useFamilyFlow();
  const toast = useToast();
  const { suggestion, openPanel } = useFlowRuntime();

  const kids = children(data);
  const child = activePerson.role === "child" ? activePerson : kids[0];

  useEffect(() => {
    if (child && child.id !== activePerson.id) setActivePerson(child.id);
  }, [child, activePerson.id, setActivePerson]);

  const target = child ?? activePerson;
  const { loading, generate } = useCoachMoment(target);

  const tasks = child ? tasksForPerson(data, child.id) : [];
  const withStatus = tasks.map((task) => ({ task, done: isDone(data, task.id) }));
  const open = withStatus.filter((item) => !item.done);
  const done = withStatus.length - open.length;

  const { trigger, fire } = useConfetti();
  const celebratedRef = useRef(false);
  useEffect(() => {
    const allDone = withStatus.length > 0 && open.length === 0;
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      fire();
    }
    if (!allDone) celebratedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.length, withStatus.length]);

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
  const todayLogs = (data.wellnessLogs ?? []).filter((log) => log.personId === target.id && log.date === dateKey());
  const water = todayLogs.filter((log) => log.kind === "water").reduce((total, log) => total + log.value, 0);
  const fruit = todayLogs.filter((log) => log.kind === "fruit").reduce((total, log) => total + log.value, 0);
  const reading = (data.readingEntries ?? [])
    .filter((entry) => entry.personId === target.id && entry.date === dateKey())
    .reduce((total, entry) => total + entry.minutes, 0);
  const nextReward = [...data.rewards].sort((a, b) => a.cost - b.cost).find((reward) => reward.cost > points);
  const activity = data.activities.find((item) => item.date === dateKey());

  return (
    <AppShell role="child">
      <ConfettiBurst trigger={trigger} />
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">
          {greeting()}, {child.name} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          {open.length === 0
            ? "Alles van vandaag staat af."
            : `Nog ${open.length} ${open.length === 1 ? "ding" : "dingen"} vandaag. Je hoeft niet alles tegelijk.`}
        </p>
        <motion.div
          variants={STAT_CONTAINER}
          initial="hidden"
          animate="show"
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"
        >
          <motion.div variants={STAT_CARD}>
            <Card tone="sand" className="p-3">
              <p className="text-xl font-semibold text-ink">
                <motion.span
                  className="inline-block"
                  animate={{ scale: [1, 1.15, 0.95, 1.08, 1], rotate: [0, -4, 3, -2, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  🔥
                </motion.span>{" "}
                {summary.streak}
              </p>
              <p className="mt-1 text-xs text-muted">{badgeLabel(data, target.id)}</p>
            </Card>
          </motion.div>
          <motion.div variants={STAT_CARD}>
            <Card tone="sand" className="p-3">
              <p className="text-xl font-semibold text-ink">{points}</p>
              <p className="mt-1 text-xs text-muted">punten totaal</p>
            </Card>
          </motion.div>
          <motion.div variants={STAT_CARD}>
            <Card className="p-3">
              <p className="text-xl font-semibold text-ink">+{summary.today}</p>
              <p className="mt-1 text-xs text-muted">vandaag verdiend</p>
            </Card>
          </motion.div>
          <motion.div variants={STAT_CARD}>
            <Card className="p-3">
              <p className="text-xl font-semibold text-ink">{data.familyPoints ?? 0}</p>
              <p className="mt-1 text-xs text-muted">Family Points</p>
            </Card>
          </motion.div>
          <motion.div variants={STAT_CARD}>
            <Card tone="sage" className="p-3">
              <p className="text-xl font-semibold text-ink">🌱 {familySkillsFor(data, target.id)}</p>
              <p className="mt-1 text-xs text-muted">Family Skills</p>
            </Card>
          </motion.div>
        </motion.div>
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
          <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white">Praat met Flow</span>
        </button>
      ) : null}

      {suggestion && (message?.kind === "nudge" || message?.kind === "suggestion") ? null : (
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
      )}

      {!myCheckIn ? (
        <section className="mt-6">
          <SectionTitle>Check-in</SectionTitle>
          <CheckIn onSelect={(mood, note) => addCheckIn(child.id, mood, note)} />
        </section>
      ) : null}

      <section className="mt-8">

              <section className="mt-8">
                <SectionTitle
                  action={
                    <Link href="/kind/doelen?tab=wellness" className="text-sm text-primary hover:underline">
                      Bijhouden
                    </Link>
                  }
                >
                  Kleine wins voor vandaag
                </SectionTitle>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card tone="outline" className="p-4">
                    <p className="text-2xl">💧</p>
                    <p className="mt-2 font-medium text-ink">Water</p>
                    <p className="mt-1 text-sm text-muted">{Math.round(water / 250)} / 6 glazen</p>
                    <Progress value={water} max={1500} tone="accent" className="mt-3" />
                  </Card>
                  <Card tone="sand" className="p-4">
                    <p className="text-2xl">🍎</p>
                    <p className="mt-2 font-medium text-ink">Fruit</p>
                    <p className="mt-1 text-sm text-muted">{fruit} / 2 porties</p>
                    <Progress value={fruit} max={2} tone="accent" className="mt-3" />
                  </Card>
                  <Card tone="sage" className="p-4">
                    <p className="text-2xl">📖</p>
                    <p className="mt-2 font-medium text-ink">Lezen</p>
                    <p className="mt-1 text-sm text-muted">{reading} / 15 minuten</p>
                    <Progress value={reading} max={15} className="mt-3" />
                  </Card>
                </div>
                <p className="mt-3 px-1 text-xs text-muted">Richtwaarden, geen verplichtingen. Kies wat vandaag bij je past.</p>
              </section>
        <SectionTitle
          action={
            <Link href="/kind/vandaag" className="text-sm text-primary hover:underline">
              Alles zien
            </Link>
          }
        >
          Mijn dag
        </SectionTitle>

        <DayRhythm tasks={withStatus} />

        <div className="mt-4 space-y-2.5">
          {withStatus.length === 0 ? (
            <EmptyState
              title="Vandaag staat er niets"
              description="Geniet ervan. Morgen pakken we het weer op."
              icon="🌤️"
            />
          ) : (
            (open.length > 0 ? open.slice(0, 3) : withStatus.slice(0, 3)).map(({ task, done: isTaskDone }, index) => (
              <TaskCard
                key={task.id}
                task={task}
                done={isTaskDone}
                highlight={index === 0}
                onToggle={() => {
                  const nowDone = toggleTask(task.id, child.id);
                  if (nowDone) toast(`+${task.points} punten`, PRAISE[index % PRAISE.length]);
                }}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>Mijn punten</SectionTitle>
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-semibold tracking-tight text-ink">{points}</p>
            <p className="text-sm text-muted">
              {done}/{withStatus.length} afspraken vandaag
            </p>
          </div>
          {nextReward ? (
            <>
              <Progress value={points} max={nextReward.cost} tone="accent" className="mt-4" />
              <p className="mt-2 text-sm text-muted">
                Nog {nextReward.cost - points} punten voor: {nextReward.title}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Je kunt alles kiezen wat er nu staat.</p>
          )}
          <Link href="/kind/doelen" className="mt-4 inline-block text-sm text-primary hover:underline">
            Mijn doelen en beloningen
          </Link>
        </Card>
      </section>

      {activity ? (
        <section className="mt-8">
          <SectionTitle>Samen</SectionTitle>
          <Card tone="sage">
            <p className="font-medium text-ink">{activity.title}</p>
            <p className="mt-1 text-sm text-muted">{activity.description}</p>
            <Link href="/kind/samen" className="mt-3 inline-block text-sm text-primary hover:underline">
              Meedoen
            </Link>
          </Card>
        </section>
      ) : null}

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/kind/wallet" className="block">
            <Card tone="sand" className="h-full transition hover:-translate-y-0.5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-dark">Mijn zakgeld</p>
              <p className="mt-2 text-3xl font-semibold text-ink">€8,50 <span className="text-sm font-normal text-muted">/ €10</span></p>
              <p className="mt-2 text-sm text-muted">Nog 1 dag alles afronden voor je weekdoel.</p>
            </Card>
          </Link>
          <Link href="/kind/conflict" className="block">
            <Card tone="outline" className="h-full transition hover:-translate-y-0.5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Samen praten</p>
              <p className="mt-2 text-lg font-semibold text-ink">Er is iets gebeurd</p>
              <p className="mt-1 text-sm text-muted">Flow helpt je rustig uitzoeken wat een volgende stap kan zijn.</p>
            </Card>
          </Link>
        </section>
    </AppShell>
  );
}

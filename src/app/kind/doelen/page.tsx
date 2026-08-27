"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GoalJourney } from "@/components/GoalJourney";
import { Icon, type IconName } from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { DualRing } from "@/components/ui/Progress";
import { StarRating } from "@/components/ui/StarRating";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { AppData, Goal, GoalDomain } from "@/lib/types";
import {
  combinedAchievementFor,
  cx,
  dateKey,
  addDays,
  GOAL_DOMAIN_ICON,
  GOAL_DOMAIN_LABEL,
  goalAchieved,
  goalDomain,
  goalProgressFor,
  milestonesFor,
  pointsFor,
} from "@/lib/utils";

const TABS = [
  { id: "doelen", label: "Doelen" },
  { id: "wellness", label: "Wellness" },
];

const DOMAINS: GoalDomain[] = ["school", "responsibility", "health", "skills", "relationships", "personal"];
const POINT_OPTIONS = [15, 25, 50, 75, 100];

interface DraftGoal {
  title: string;
  domain: GoalDomain;
  target: string;
  unit: string;
  points: number;
  dueDate: string;
  shared: boolean;
  linkedTaskIds: string[];
}

function emptyDraft(): DraftGoal {
  return {
    title: "",
    domain: "personal",
    target: "3",
    unit: "",
    points: 25,
    dueDate: dateKey(addDays(new Date(), 14)),
    shared: false,
    linkedTaskIds: [],
  };
}

function draftFromGoal(goal: Goal): DraftGoal {
  return {
    title: goal.title,
    domain: goalDomain(goal),
    target: String(goal.target),
    unit: goal.unit ?? "",
    points: goal.points,
    dueDate: goal.dueDate,
    shared: !goal.personId,
    linkedTaskIds: goal.linkedTaskIds ?? [],
  };
}

function GoalCard({
  goal,
  data,
  onLogProgress,
  onReflect,
  onEdit,
}: {
  goal: Goal;
  data: AppData;
  onLogProgress: (amount: number) => void;
  onReflect: (text: string) => void;
  onEdit: () => void;
}) {
  const progress = goalProgressFor(data, goal);
  const achieved = goalAchieved(data, goal);
  const milestones = milestonesFor(goal);
  const reflections = goal.reflections ?? [];
  const [showReflect, setShowReflect] = useState(false);
  const [reflectText, setReflectText] = useState("");

  return (
    <Card tone={achieved ? "sage" : "surface"} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            <Icon name={GOAL_DOMAIN_ICON[goalDomain(goal)]} className="h-3.5 w-3.5" />
            {GOAL_DOMAIN_LABEL[goalDomain(goal)]}
            {!goal.personId ? " · Gezinsdoel" : null}
          </span>
          <p className="mt-1 font-medium text-ink">{goal.title}</p>
        </div>
        <button type="button" onClick={onEdit} className="shrink-0 text-sm text-primary hover:underline">
          Bewerken
        </button>
      </div>

      <GoalJourney goal={goal} progress={progress} milestones={milestones} achieved={achieved} />

      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-mono tabular-nums">
          {progress}/{goal.target} {goal.unit}
        </span>
        <span>
          +{goal.points} punten{achieved ? " · behaald" : ""}
        </span>
      </div>

      {goal.linkedTaskIds?.length ? (
        <p className="rounded-2xl bg-progress-soft px-3 py-2 text-xs text-progress-dark">
          Wordt automatisch bijgehouden zodra je de gekoppelde afspraak afrondt.
        </p>
      ) : !achieved ? (
        <Button size="sm" variant="secondary" onClick={() => onLogProgress(1)}>
          +1 {goal.unit || "stap"}
        </Button>
      ) : null}

      <div className="border-t border-line/70 pt-3">
        <button
          type="button"
          onClick={() => setShowReflect((v) => !v)}
          className="text-sm text-primary hover:underline"
        >
          {reflections.length > 0 ? `${reflections.length} reflectie${reflections.length > 1 ? "s" : ""}` : "Reflecteren"}
        </button>
        {showReflect ? (
          <div className="mt-3 space-y-2 animate-fade-up">
            {reflections.map((r) => (
              <p key={r.id} className="rounded-2xl bg-paper px-3 py-2 text-sm leading-relaxed text-ink">
                {r.text}
              </p>
            ))}
            <textarea
              value={reflectText}
              onChange={(e) => setReflectText(e.target.value)}
              rows={2}
              className="field resize-none"
              placeholder="Hoe gaat dit eigenlijk?"
            />
            <Button
              size="sm"
              disabled={!reflectText.trim()}
              onClick={() => {
                onReflect(reflectText);
                setReflectText("");
              }}
            >
              Opslaan
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function GoalForm({ draft, setDraft, tasks }: { draft: DraftGoal; setDraft: (d: DraftGoal) => void; tasks: AppData["tasks"] }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="goal-title">
          Waar werk je naartoe?
        </label>
        <input
          id="goal-title"
          className="field"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Bijvoorbeeld: vier dagen op tijd beginnen"
        />
      </div>

      <div>
        <span className="label">Levensgebied</span>
        <div className="grid grid-cols-3 gap-2">
          {DOMAINS.map((domain) => {
            const active = draft.domain === domain;
            const icon: IconName = GOAL_DOMAIN_ICON[domain];
            return (
              <button
                key={domain}
                type="button"
                aria-pressed={active}
                onClick={() => setDraft({ ...draft, domain })}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs transition",
                  active ? "border-primary bg-sage text-primary-dark" : "border-line bg-surface text-muted hover:bg-sage-light",
                )}
              >
                <Icon name={icon} className="h-4 w-4" />
                {GOAL_DOMAIN_LABEL[domain]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="goal-target">
            Aantal
          </label>
          <input
            id="goal-target"
            className="field"
            inputMode="numeric"
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value.replace(/\D/g, "") })}
          />
        </div>
        <div>
          <label className="label" htmlFor="goal-unit">
            Eenheid
          </label>
          <input
            id="goal-unit"
            className="field"
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            placeholder="dagen, keer, boeken…"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="goal-due">
            Streefdatum
          </label>
          <input
            id="goal-due"
            type="date"
            className="field"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="goal-points">
            Punten bij behalen
          </label>
          <select
            id="goal-points"
            className="field"
            value={draft.points}
            onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
          >
            {POINT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                +{value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-paper p-4">
        <input
          type="checkbox"
          checked={draft.shared}
          onChange={(e) => setDraft({ ...draft, shared: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span className="text-sm text-muted">
          <span className="font-medium text-ink">Gezinsdoel.</span> Telt mee voor het hele gezin in plaats van
          alleen voor jou.
        </span>
      </label>

      {tasks.length > 0 ? (
        <div>
          <span className="label">Koppel aan afspraken (optioneel)</span>
          <p className="mb-2 text-xs text-muted">
            Elke dag dat je een gekoppelde afspraak afrondt, telt automatisch mee voor dit doel.
          </p>
          <div className="space-y-1.5">
            {tasks.map((task) => {
              const checked = draft.linkedTaskIds.includes(task.id);
              return (
                <label
                  key={task.id}
                  className={cx(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition",
                    checked ? "border-primary bg-sage-light" : "border-line bg-surface",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        linkedTaskIds: checked
                          ? draft.linkedTaskIds.filter((id) => id !== task.id)
                          : [...draft.linkedTaskIds, task.id],
                      })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  {task.title}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoalsPageInner() {
  const { data, activePerson, addGoal, updateGoal, logGoalProgress, addGoalReflection, logWellness, addReading } =
    useFamilyFlow();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "wellness" ? "wellness" : "doelen");
  const child = activePerson.role === "child" ? activePerson : data.people.find((p) => p.role === "child");
  const person = child ?? activePerson;
  const points = pointsFor(data, person.id);

  const [domainFilter, setDomainFilter] = useState<GoalDomain | "alle">("alle");
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [draft, setDraft] = useState<DraftGoal>(emptyDraft());

  const [book, setBook] = useState("");
  const [minutes, setMinutes] = useState("15");
  const logs = (data.wellnessLogs ?? []).filter((log) => log.personId === person.id && log.date === dateKey());
  const water = logs.filter((log) => log.kind === "water").reduce((total, log) => total + log.value, 0);
  const fruit = logs.filter((log) => log.kind === "fruit").reduce((total, log) => total + log.value, 0);

  function log(kind: "water" | "fruit", value: number, unit: string) {
    logWellness(person.id, kind, value, unit);
    toast("Opgeslagen", kind === "water" ? `+${value} ml water` : "+1 fruitportie");
  }

  const myGoals = data.goals.filter((goal) => !goal.personId || goal.personId === person.id);
  const filtered = domainFilter === "alle" ? myGoals : myGoals.filter((g) => goalDomain(g) === domainFilter);
  const active = filtered.filter((g) => !goalAchieved(data, g));
  const achieved = filtered.filter((g) => goalAchieved(data, g));
  const myTasks = data.tasks.filter((t) => t.personId === person.id);

  const achievement = combinedAchievementFor(data, person.id);
  const personalGoals = myGoals.filter((g) => g.personId === person.id);
  const sharedGoals = myGoals.filter((g) => !g.personId);
  const avgPct = (goals: Goal[]) =>
    goals.length
      ? Math.round((goals.reduce((sum, g) => sum + Math.min(1, goalProgressFor(data, g) / Math.max(1, g.target)), 0) / goals.length) * 100)
      : 0;
  const personalPct = avgPct(personalGoals);
  const sharedPct = avgPct(sharedGoals);

  function openCreate() {
    setEditingGoal(null);
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setDraft(draftFromGoal(goal));
    setOpen(true);
  }

  function save() {
    const target = Math.max(1, Number(draft.target) || 1);
    const payload = {
      personId: draft.shared ? undefined : person.id,
      title: draft.title.trim(),
      domain: draft.domain,
      target,
      unit: draft.unit.trim() || undefined,
      points: draft.points,
      dueDate: draft.dueDate,
      linkedTaskIds: draft.linkedTaskIds.length > 0 ? draft.linkedTaskIds : undefined,
    };
    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
      toast("Doel bijgewerkt");
    } else {
      addGoal(payload);
      toast("Doel toegevoegd", "Je reis is begonnen.");
    }
    setOpen(false);
  }

  return (
    <AppShell role="child">
      <header className="mb-6">
        <Card tone="hero" className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] font-semibold leading-tight text-white sm:text-[30px]">Groei</h1>
              <p className="mt-1 text-sm text-white/70">
                {tab === "doelen" ? `${points} punten verzameld` : "Kleine keuzes, goed gevoel."}
              </p>
              <div className="mt-3">
                <StarRating percentage={achievement} />
              </div>
            </div>
            {tab === "doelen" ? (
              <Button size="sm" onClick={openCreate} className="shrink-0">
                Nieuw doel
              </Button>
            ) : null}
          </div>

          {myGoals.length > 0 ? (
            <div className="mt-5 flex items-center gap-5">
              <DualRing individual={personalPct} family={sharedPct} max={100} size={104} />
              <div className="min-w-0 space-y-2 text-sm">
                <p className="flex items-center gap-1.5 text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#33C7C0]" />
                  Eigen doelen
                </p>
                <p className="flex items-center gap-1.5 text-white/60">
                  <span className="h-2 w-2 rounded-full bg-white/55" />
                  Gezinsdoelen
                </p>
              </div>
            </div>
          ) : null}
        </Card>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "doelen" ? (
        <section>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDomainFilter("alle")}
              className={cx("chip", domainFilter === "alle" && "chip-active")}
            >
              Alles
            </button>
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setDomainFilter(domain)}
                className={cx("chip inline-flex items-center gap-1.5", domainFilter === domain && "chip-active")}
              >
                <Icon name={GOAL_DOMAIN_ICON[domain]} className="h-3.5 w-3.5" />
                {GOAL_DOMAIN_LABEL[domain]}
              </button>
            ))}
          </div>

          {myGoals.length === 0 ? (
            <EmptyState
              title="Nog geen doelen"
              description="Begin klein en concreet — dat werkt het best."
              icon="target"
              action={
                <Button size="sm" onClick={openCreate}>
                  Eerste doel maken
                </Button>
              }
            />
          ) : (
            <>
              <SectionTitle>Onderweg</SectionTitle>
              {active.length === 0 ? (
                <p className="mb-6 text-sm text-muted">Niets onderweg in dit gebied.</p>
              ) : (
                <div className="mb-8 space-y-4">
                  {active.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      data={data}
                      onEdit={() => openEdit(goal)}
                      onLogProgress={(amount) => logGoalProgress(goal.id, amount)}
                      onReflect={(text) => addGoalReflection(goal.id, text)}
                    />
                  ))}
                </div>
              )}

              {achieved.length > 0 ? (
                <>
                  <SectionTitle>Behaald</SectionTitle>
                  <div className="space-y-4">
                    {achieved.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        data={data}
                        onEdit={() => openEdit(goal)}
                        onLogProgress={(amount) => logGoalProgress(goal.id, amount)}
                        onReflect={(text) => addGoalReflection(goal.id, text)}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <>
          <section>
            <SectionTitle>Drinken</SectionTitle>
            <Card tone="outline">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold text-ink">
                    {water} <span className="text-sm font-normal text-muted">ml</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">Richtwaarde vandaag: 1.500 ml</p>
                </div>
                <Icon name="droplet" className="h-8 w-8 text-primary/60" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[250, 500, 750, 1000].map((amount) => (
                  <Button key={amount} size="sm" variant="secondary" onClick={() => log("water", amount, "ml")}>
                    +{amount}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Een algemene richtwaarde. Behoeften verschillen door beweging, warmte en gezondheid.
              </p>
            </Card>
          </section>

          <section className="mt-8">
            <SectionTitle>Voeding</SectionTitle>
            <Card tone="sand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">Fruit</p>
                  <p className="mt-1 text-sm text-muted">{fruit} / 2 porties als fijne richtlijn</p>
                </div>
                <Icon name="basket" className="h-8 w-8 text-accent-dark/60" />
              </div>
              <Button className="mt-4" size="sm" onClick={() => log("fruit", 1, "portie")}>
                Fruit gegeten
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Fruit bevat vezels en verschillende vitamines. Kies wat bij jou past.
              </p>
            </Card>
          </section>

          <section className="mt-8">
            <SectionTitle>Lezen</SectionTitle>
            <Card tone="sage" className="space-y-3">
              <div>
                <label className="label" htmlFor="book">
                  Boek of tekst
                </label>
                <input
                  id="book"
                  className="field"
                  value={book}
                  onChange={(event) => setBook(event.target.value)}
                  placeholder="Bijvoorbeeld: ..."
                />
              </div>
              <div>
                <label className="label" htmlFor="minutes">
                  Minuten
                </label>
                <input
                  id="minutes"
                  className="field"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                disabled={!book.trim()}
                onClick={() => {
                  addReading({ personId: person.id, title: book.trim(), minutes: Number(minutes) || 15 });
                  setBook("");
                  toast("Leesmoment opgeslagen", "Nog een kleine stap voor je streak.");
                }}
              >
                Leesmoment opslaan
              </Button>
            </Card>
          </section>

          <p className="mt-8 px-1 text-xs leading-relaxed text-muted">
            Alles hier is zelf gerapporteerd. FamilyFlow doet niet alsof het kan controleren wat je echt hebt gedaan.
          </p>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingGoal ? "Doel bewerken" : "Nieuw doel"}
        description="Klein en concreet werkt beter dan groots."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button disabled={!draft.title.trim() || !draft.target} onClick={save}>
              Opslaan
            </Button>
          </>
        }
      >
        <GoalForm draft={draft} setDraft={setDraft} tasks={myTasks} />
      </Modal>
    </AppShell>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsPageInner />
    </Suspense>
  );
}

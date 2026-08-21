"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Category } from "@/lib/types";
import { CATEGORY_ICON, CATEGORY_LABEL, WEEKDAYS, children, cx } from "@/lib/utils";

const CATEGORIES: Category[] = ["ochtend", "school", "beweging", "scherm", "avond", "huishouden", "samen"];
const NEGATIVE = /^(niet|geen|stop|nooit)\b/i;

export default function AgreementsPage() {
  const { data, addTask, updateTask, removeTask } = useFamilyFlow();
  const toast = useToast();
  const kids = children(data);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState(kids[0]?.id ?? "");
  const [category, setCategory] = useState<Category>("ochtend");
  const [time, setTime] = useState("07:30");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [points, setPoints] = useState(5);
  const [shared, setShared] = useState(false);

  const negative = NEGATIVE.test(title.trim());

  return (
    <AppShell role="parent">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">Afspraken</h1>
          <p className="mt-1 text-sm text-muted">Klein en concreet werkt beter dan streng.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={kids.length === 0}>
          Nieuw
        </Button>
      </header>

      {kids.length === 0 ? (
        <EmptyState
          title="Nog geen kinderen in het gezin"
          description="Voeg eerst iemand toe bij Gezin. Daarna kun je afspraken maken."
          icon="👋"
        />
      ) : null}

      <div className="space-y-8">
        {kids.map((kid) => {
          const tasks = data.tasks.filter((task) => task.personId === kid.id);
          return (
            <section key={kid.id}>
              <SectionTitle>{kid.name}</SectionTitle>
              {tasks.length === 0 ? (
                <EmptyState
                  title="Nog geen afspraken"
                  description={`Begin met één afspraak voor ${kid.name}. Eén afspraak die lukt is meer waard dan vijf die blijven staan.`}
                  action={<Button size="sm" onClick={() => setOpen(true)}>Afspraak maken</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Card key={task.id} className={cx(!task.active && "opacity-60")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{task.title}</p>
                          <p className="mt-1 text-sm text-muted">
                            {CATEGORY_ICON[task.category]} {CATEGORY_LABEL[task.category]}
                            {task.time ? ` · ${task.time}` : ""} ·{" "}
                            {task.days.length === 7
                              ? "elke dag"
                              : WEEKDAYS.filter((day) => task.days.includes(day.index))
                                  .map((day) => day.short)
                                  .join(" ")}
                          </p>
                        </div>
                        <Badge tone="muted">+{task.points}</Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateTask(task.id, { active: !task.active })}
                        >
                          {task.active ? "Pauzeren" : "Weer actief"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            removeTask(task.id);
                            toast("Afspraak verwijderd");
                          }}
                        >
                          Verwijderen
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nieuwe afspraak"
        description="Formuleer positief: wat er wél gebeurt."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button
              disabled={!title.trim() || !personId || days.length === 0}
              onClick={() => {
                addTask({
                  title: title.trim(),
                  personId,
                  category,
                  time,
                  days,
                  points,
                  shared,
                  active: true,
                });
                toast("Afspraak toegevoegd", `+${points} punten per keer`);
                setTitle("");
                setOpen(false);
              }}
            >
              Opslaan
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="task-title">
              Wat spreken jullie af?
            </label>
            <input
              id="task-title"
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Telefoon om 21:30 op de oplader"
            />
            {negative ? (
              <p className="mt-2 rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent-dark">
                Tip: schrijf op wat er wél gebeurt. &ldquo;Telefoon om 21:30 opladen&rdquo; werkt beter dan
                &ldquo;niet te laat op je telefoon&rdquo;.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="task-person">
                Voor wie
              </label>
              <select
                id="task-person"
                className="field"
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
              >
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-category">
                Categorie
              </label>
              <select
                id="task-category"
                className="field"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABEL[item]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-time">
                Tijd
              </label>
              <input
                id="task-time"
                type="time"
                className="field"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="task-points">
                Punten
              </label>
              <select
                id="task-points"
                className="field"
                value={points}
                onChange={(event) => setPoints(Number(event.target.value))}
              >
                {[5, 10, 15, 25].map((value) => (
                  <option key={value} value={value}>
                    +{value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="label">Op welke dagen?</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = days.includes(day.index);
                return (
                  <button
                    key={day.index}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setDays((current) =>
                        active ? current.filter((item) => item !== day.index) : [...current, day.index],
                      )
                    }
                    className={cx("chip w-12 text-center", active && "chip-active")}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl bg-paper p-4">
            <input
              type="checkbox"
              checked={shared}
              onChange={(event) => setShared(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span className="text-sm text-muted">
              <span className="font-medium text-ink">Gezamenlijk doel.</span> Telt mee voor het hele gezin
              in plaats van alleen voor dit kind.
            </span>
          </label>
        </div>
      </Modal>
    </AppShell>
  );
}

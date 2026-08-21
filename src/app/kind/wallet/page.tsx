"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RewardCard } from "@/components/RewardCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { children, pointsFor } from "@/lib/utils";
import { formatEuro, walletFor } from "@/lib/wallet";

const TABS = [
  { id: "zakgeld", label: "Zakgeld" },
  { id: "beloningen", label: "Beloningen" },
];

export default function WalletPage() {
  const { data, activePerson, redeemReward } = useFamilyFlow();
  const toast = useToast();
  const [tab, setTab] = useState("zakgeld");
  const person = activePerson.role === "child" ? activePerson : children(data)[0] ?? activePerson;
  const wallet = walletFor(data, person);
  const points = pointsFor(data, person.id);

  return (
    <AppShell role="child">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-dark">Mijn zakgeld</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Verdienen voelt goed.</h1>
        <p className="mt-2 text-sm text-muted">
          {tab === "zakgeld"
            ? "Je ziet precies wat verdiend, verwacht en uitgekeerd is."
            : "Punten inwisselen voor tijd, activiteiten en zelf mogen kiezen."}
        </p>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "zakgeld" ? (
        <>
          <Card tone="sand">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted">Deze week verdiend</p>
                <p className="mt-1 text-4xl font-semibold text-ink">{formatEuro(wallet.earned)}</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
            <Progress value={wallet.earned} max={wallet.maximum} tone="accent" className="mt-5" />
            <div className="mt-3 flex justify-between text-sm text-muted">
              <span>Verwacht: {formatEuro(wallet.expected)}</span>
              <span>Max: {formatEuro(wallet.maximum)}</span>
            </div>
          </Card>
          <section className="mt-8">
            <SectionTitle>Deze week</SectionTitle>
            <div className="space-y-3">
              {wallet.entries.length ? (
                wallet.entries.map((entry) => (
                  <Card key={entry.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{entry.label}</p>
                      <p className="mt-1 text-sm text-muted">
                        {entry.status === "earned" ? "Verdiend" : entry.status === "paid" ? "Uitgekeerd" : "Verwacht"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink">+{formatEuro(entry.amount)}</p>
                      <Badge tone={entry.status === "earned" ? "green" : "muted"}>{entry.status}</Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <Card tone="outline">
                  <p className="text-sm text-muted">Elke kleine stap kan hier zichtbaar worden.</p>
                </Card>
              )}
            </div>
          </section>
          <section className="mt-8">
            <SectionTitle>Zo werkt het</SectionTitle>
            <Card tone="sage">
              <ul className="space-y-2 text-sm leading-relaxed text-ink">
                <li>Basisbedrag: {formatEuro(data.allowance?.weeklyBase ?? 5)} per week</li>
                <li>Extra voor streaks, afspraken en samen bewegen</li>
                <li>Een ouder keurt het uiteindelijke zakgeld goed</li>
              </ul>
            </Card>
          </section>
        </>
      ) : (
        <section>
          <SectionTitle>{points} punten verzameld</SectionTitle>
          <div className="space-y-3">
            {data.rewards.map((reward) => {
              const redeemed = data.redemptions.some(
                (redemption) => redemption.rewardId === reward.id && redemption.personId === person.id,
              );
              return (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  points={points}
                  redeemed={redeemed}
                  onRedeem={() => {
                    redeemReward(reward.id, person.id);
                    toast("Aangevraagd", "Je ouder ziet dit terug in het gezinsoverzicht.");
                  }}
                />
              );
            })}
          </div>
          <p className="mt-4 px-1 text-sm leading-relaxed text-muted">
            Beloningen gaan hier vooral over tijd samen, activiteiten en zelf mogen kiezen.
          </p>
        </section>
      )}
    </AppShell>
  );
}

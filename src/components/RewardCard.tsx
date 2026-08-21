"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import type { Reward } from "@/lib/types";

interface Props {
  reward: Reward;
  points: number;
  onRedeem?: () => void;
  redeemed?: boolean;
}

export function RewardCard({ reward, points, onRedeem, redeemed }: Props) {
  const affordable = points >= reward.cost;
  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{reward.title}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-muted">{reward.type}</p>
        </div>
        <Badge tone={affordable ? "accent" : "muted"}>{reward.cost} punten</Badge>
      </div>
      <Progress value={Math.min(points, reward.cost)} max={reward.cost} tone="accent" className="mt-3" />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-muted">
          {redeemed
            ? "Aangevraagd"
            : affordable
              ? "Je kunt deze kiezen"
              : `Nog ${reward.cost - points} punten`}
        </p>
        {onRedeem ? (
          <Button size="sm" variant={affordable ? "primary" : "secondary"} disabled={!affordable || redeemed} onClick={onRedeem}>
            {redeemed ? "Aangevraagd" : "Kiezen"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

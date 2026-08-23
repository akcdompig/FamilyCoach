"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import type { Reward } from "@/lib/types";

interface Props {
  reward: Reward;
  points: number;
  onRedeem?: () => void;
  status?: "aangevraagd" | "goedgekeurd";
}

export function RewardCard({ reward, points, onRedeem, status }: Props) {
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

      {/* Een balk heeft alleen betekenis als er nog iets te overbruggen valt. */}
      {!affordable && !status ? (
        <Progress value={points} max={reward.cost} tone="accent" className="mt-3" />
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-muted">
          {status === "goedgekeurd"
            ? "Goedgekeurd door je ouder"
            : status === "aangevraagd"
              ? "In afwachting van je ouder"
              : affordable
                ? "Je kunt deze kiezen"
                : `Nog ${reward.cost - points} punten`}
        </p>
        {onRedeem ? (
          <Button
            size="sm"
            variant={status === "goedgekeurd" ? "soft" : affordable ? "primary" : "secondary"}
            disabled={!affordable || Boolean(status)}
            onClick={onRedeem}
          >
            {status === "goedgekeurd" ? "Ontvangen" : status === "aangevraagd" ? "Aangevraagd" : "Kiezen"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

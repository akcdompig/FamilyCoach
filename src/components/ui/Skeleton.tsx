import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icons";
import { cx } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,#EFE9DC_0%,#FBF9F4_50%,#EFE9DC_100%)] bg-[length:800px_100%]",
        className,
      )}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = "spark",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage">
        <Icon name={icon} className="h-5 w-5 text-primary-dark" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

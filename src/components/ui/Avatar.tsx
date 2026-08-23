import { AvatarIllustration, isAvatarVariant } from "@/components/AvatarIllustrations";
import { cx } from "@/lib/utils";

interface Props {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** "child-m" | "child-f" | "teen-m" | "teen-f" | "adult-m" | "adult-f" — ontbreekt/onbekend -> initialen-avatar. */
  avatarVariant?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ name, color = "#0E7C86", size = "md", className, avatarVariant }: Props) {
  if (isAvatarVariant(avatarVariant)) {
    return (
      <AvatarIllustration
        variant={avatarVariant}
        className={cx("inline-flex shrink-0 rounded-full", SIZES[size], className)}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

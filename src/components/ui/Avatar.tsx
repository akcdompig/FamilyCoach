import { AvatarIllustration, isAvatarVariant } from "@/components/AvatarIllustrations";
import { cx } from "@/lib/utils";

interface Props {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** "child-m" | "child-f" | "teen-m" | "teen-f" | "adult-m" | "adult-f" — ontbreekt/onbekend -> initialen-avatar. */
  avatarVariant?: string;
  /**
   * 0-100: dunne voortgangsring rond de avatar in de eigen kleur van de
   * persoon — de avatar draagt zo zelf identiteit én status, in plaats van
   * een los statistiekje ernaast. Alleen bedoeld voor identiteitsmomenten
   * (Home-header, familieoverzicht), niet voor kleine lijst-avatars.
   */
  ring?: number;
  /** Ondergrondkleur waar de ring "doorheen snijdt" — moet de plek matchen waar de avatar op staat (standaard: paper). */
  ringBg?: string;
  /** Zachte gekleurde gloed achter de avatar, voor identiteitsmomenten zoals de Home-header. */
  glow?: boolean;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
};

const RING_TRACK = "#E8E1D3";

export function Avatar({ name, color = "#0E7C86", size = "md", className, avatarVariant, ring, glow, ringBg = "#F8F6F1" }: Props) {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasOverlay = typeof ring === "number" || glow;

  const core = isAvatarVariant(avatarVariant) ? (
    <AvatarIllustration
      variant={avatarVariant}
      className={cx("inline-flex shrink-0 rounded-full", SIZES[size], hasOverlay ? "relative z-10" : className)}
    />
  ) : (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZES[size],
        hasOverlay ? "relative z-10" : className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </span>
  );

  if (!hasOverlay) return core;

  const ratio = Math.max(0, Math.min(100, ring ?? 0));
  return (
    <span className={cx("relative inline-flex shrink-0 items-center justify-center rounded-full", className)}>
      {glow ? (
        <span
          className="absolute inset-0 -z-10 rounded-full opacity-40 blur-lg"
          style={{ backgroundColor: color, transform: "scale(1.7)" }}
          aria-hidden
        />
      ) : null}
      {typeof ring === "number" ? (
        <span
          className="absolute -inset-1 rounded-full p-[3px]"
          style={{ background: `conic-gradient(${color} ${ratio * 3.6}deg, ${RING_TRACK} 0deg)` }}
          aria-hidden
        >
          <span className="block h-full w-full rounded-full" style={{ backgroundColor: ringBg }} />
        </span>
      ) : null}
      {core}
    </span>
  );
}

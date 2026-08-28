/**
 * Kleine set hand-getekende platte silhouet-illustraties (geen foto's, geen
 * gegenereerde assets — er is geen beeldgeneratie-tool in deze omgeving).
 * Bewust simpel en niet aan een specifiek persoon gebonden: haarvorm + kleding
 * verschillen per variant, huidtoon is neutraal warm-beige voor iedereen.
 */
import type { SVGProps } from "react";

export type AvatarVariant = "child-m" | "child-f" | "teen-m" | "teen-f" | "adult-m" | "adult-f";

const SKIN = "#E8B98C";
const SKIN_SHADE = "#D9A374";

function Face({ shirt }: { shirt: string }) {
  return (
    <>
      <circle cx="32" cy="46" r="20" fill={shirt} />
      <circle cx="32" cy="26" r="14" fill={SKIN} />
      <path d="M20 30a12 12 0 0 0 24 0" fill={SKIN_SHADE} opacity="0.25" />
    </>
  );
}

const ILLUSTRATIONS: Record<AvatarVariant, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  "child-m": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#0F7A3D" />
      <path d="M18 20c2-8 26-8 28 0 1 3-1 5-2 3-3-6-21-6-24 0-1 2-3 0-2-3z" fill="#5B3A22" />
    </svg>
  ),
  "child-f": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#C43A28" />
      <path d="M18 19c2-7 26-7 28 0 1 3-1 6-2 4-3-6-21-6-24 0-1 2-3-1-2-4z" fill="#6B3418" />
      <circle cx="15" cy="24" r="4" fill="#6B3418" />
      <circle cx="49" cy="24" r="4" fill="#6B3418" />
    </svg>
  ),
  "teen-m": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#3B1F63" />
      <path d="M17 22c1-9 28-10 30-1 1 4-1 7-2 4-4-8-22-8-26 0-1 3-3 0-2-3z" fill="#3A2A18" />
      <path d="M32 40l6 6-6 6-6-6z" fill="#3DD16F" opacity="0.9" />
    </svg>
  ),
  "teen-f": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#0D8074" />
      <path d="M17 21c2-9 27-9 30-1 1 3 0 15-3 20-1-6 1-11-1-14-4-7-21-7-25 0-2 3 0 8-1 14-3-5-2-16 0-19z" fill="#8A4A22" />
      <path d="M32 40l6 6-6 6-6-6z" fill="#F2A900" opacity="0.9" />
    </svg>
  ),
  "adult-m": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#3B1F63" />
      <path d="M19 21c1-6 24-6 26 0 1 2-1 4-2 2-3-4-19-4-22 0-1 2-3 0-2-2z" fill="#4A4A4A" />
      <rect x="26" y="44" width="12" height="4" rx="2" fill="#3DD16F" />
    </svg>
  ),
  "adult-f": (props) => (
    <svg viewBox="0 0 64 64" {...props}>
      <Face shirt="#C43A28" />
      <path d="M18 20c2-8 26-8 28 0 1 4-1 16-3 19 0-6 1-10-1-13-4-6-20-6-24 0-2 3-1 7-1 13-2-3-1-15 1-19z" fill="#2E2115" />
      <rect x="26" y="44" width="12" height="4" rx="2" fill="#F2A900" />
    </svg>
  ),
};

export function AvatarIllustration({ variant, className }: { variant: AvatarVariant; className?: string }) {
  const Illustration = ILLUSTRATIONS[variant];
  return <Illustration className={className} role="img" aria-hidden />;
}

export function isAvatarVariant(value: string | undefined): value is AvatarVariant {
  return !!value && value in ILLUSTRATIONS;
}

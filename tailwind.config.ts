import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFBF5",
        surface: "#FFFFFF",
        ink: "#231433",
        muted: "#7C6E86",
        line: "#F0E3D5",
        /** Fel, verzadigd groen — merk/identiteit, tekst-links, nav-actief. >=4.5:1 op paper én als witte tekst erop. */
        primary: {
          DEFAULT: "#0F7A3D",
          dark: "#0B5C2E",
          light: "#3DD16F",
        },
        /** Diep paars — voorheen "navy", zelfde rol (donkere premium ondergrond), fellere familie. */
        navy: {
          DEFAULT: "#3B1F63",
          dark: "#241041",
          light: "#5B3A8E",
        },
        sage: {
          DEFAULT: "#DFF6E7",
          light: "#EFFBF3",
          dark: "#BFEAD1",
        },
        sand: {
          DEFAULT: "#F5E4D3",
          light: "#FBF3E9",
        },
        /** "Energie": actie, voltooiing, "jouw beurt"-momenten. Verzadigd koraalrood, >=4.5:1 met witte tekst. */
        accent: {
          DEFAULT: "#C43A28",
          soft: "#FDE2DC",
          dark: "#9E2E1F",
        },
        /** Uitsluitend voor doelen/groei-voortgang — nooit voor generieke acties. */
        progress: {
          DEFAULT: "#0D8074",
          soft: "#D7F3EF",
          dark: "#0A6259",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FDE4E1",
          dark: "#B91C1C",
        },
        /** Sterren-waardering — alleen voor StarRating, nergens anders. Icoon-contrast (>=3:1) tegen wit én navy. */
        star: {
          DEFAULT: "#B8790A",
          muted: "#9B927E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sora)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(32,28,26,0.04), 0 10px 30px -18px rgba(32,28,26,0.25)",
        lift: "0 2px 6px rgba(32,28,26,0.05), 0 20px 44px -20px rgba(32,28,26,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.06)", opacity: "0.85" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(0)" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-28px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-5px) rotate(-3deg)" },
          "75%": { transform: "translateY(-2px) rotate(3deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.32s cubic-bezier(0.22,1,0.36,1) both",
        breathe: "breathe 5.5s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        rise: "rise 1.1s ease-out forwards",
        bob: "bob 0.9s ease-in-out infinite",
        "pulse-soft": "pulse-soft 0.8s ease-in-out infinite",
        blink: "blink 4.5s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F6F1",
        surface: "#FFFFFF",
        ink: "#201C1A",
        muted: "#726858",
        line: "#E8E1D3",
        primary: {
          DEFAULT: "#0E7C86",
          dark: "#0B5A62",
          light: "#35A0AA",
        },
        /** Donkere dashboard-ondergrond voor hero-kaarten (ring + sterren-samenvatting). */
        navy: {
          DEFAULT: "#0F2A3D",
          dark: "#081722",
          light: "#1D4159",
        },
        sage: {
          DEFAULT: "#DCEFF0",
          light: "#EEF7F8",
          dark: "#C1DEE0",
        },
        sand: {
          DEFAULT: "#EFE6D6",
          light: "#F7F1E6",
        },
        /** "Energie": actie, voltooiing, "jouw beurt"-momenten. Donker genoeg voor 4.5:1 met witte tekst. */
        accent: {
          DEFAULT: "#B84C0A",
          soft: "#FDE7D6",
          dark: "#913C08",
        },
        /** Uitsluitend voor doelen/groei-voortgang — nooit voor generieke acties. */
        progress: {
          DEFAULT: "#1A8E85",
          soft: "#DFF3F1",
          dark: "#136158",
        },
        danger: {
          DEFAULT: "#B0403A",
          soft: "#F5E1DE",
          dark: "#8A2F2A",
        },
        /** Sterren-waardering — alleen voor StarRating, nergens anders. Getest tegen wit én navy (>=3:1). */
        star: {
          DEFAULT: "#C2830A",
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

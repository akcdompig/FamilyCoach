import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { FamilyFlowProvider } from "@/lib/store/FamilyFlowProvider";
import { FlowRuntimeProvider } from "@/lib/flow/FlowRuntime";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FamilyFlow — Samen sterk. Stap voor stap.",
  description:
    "Een slimme gezinscoach voor structuur, verbinding en zelfstandigheid. FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.",
};

export const viewport: Viewport = {
  themeColor: "#FFFBF5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sora.variable} ${bricolage.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <FamilyFlowProvider>
          <FlowRuntimeProvider>
            <ToastProvider>{children}</ToastProvider>
          </FlowRuntimeProvider>
        </FamilyFlowProvider>
      </body>
    </html>
  );
}

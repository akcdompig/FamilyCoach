import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { FamilyFlowProvider } from "@/lib/store/FamilyFlowProvider";
import { FlowRuntimeProvider } from "@/lib/flow/FlowRuntime";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FamilyFlow — Samen sterk. Stap voor stap.",
  description:
    "Een slimme gezinscoach voor structuur, verbinding en zelfstandigheid. FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.",
};

export const viewport: Viewport = {
  themeColor: "#F7F7F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
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

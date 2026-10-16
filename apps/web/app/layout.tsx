import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { SentryUserContext } from "./sentry-user-context";

// Doc 18 Section 1 (typography) / Doc 21 Section 7 (performance): self-hosted
// via next/font (downloaded at build time, served from this origin, zero
// request to Google at runtime) with font-display: swap built in, so text
// is never blocked on font load on a slow connection.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });

export const metadata: Metadata = {
  title: "SchoolOS",
  description: "School management for Nigerian schools and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink">
        <SentryUserContext />
        {children}
      </body>
    </html>
  );
}

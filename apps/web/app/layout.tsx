import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolOS",
  description: "School management for Nigerian schools and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

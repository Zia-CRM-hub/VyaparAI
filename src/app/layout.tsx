import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VyaparAI",
  description: "AI Operating System for Boutiques & Tailoring Businesses",
};

export const viewport: Viewport = { themeColor: "#7c2d5b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

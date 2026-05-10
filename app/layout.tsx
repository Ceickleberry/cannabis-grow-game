import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CannaBiz — Grow Game",
  description: "Cannabis grow management simulation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

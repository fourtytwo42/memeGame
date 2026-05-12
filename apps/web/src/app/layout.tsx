import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meme Foundry",
  description:
    "Launch fake coins, build fake clout, and survive simulated chaos."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

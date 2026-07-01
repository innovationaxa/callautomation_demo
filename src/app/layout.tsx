import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const headline = Playfair_Display({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mon AXA — Démo voicebot → selfcare",
  description: "Démo live : voicebot Genesys → Mon Assistant AXA → Mon AXA / WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${headline.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F3F5FA]">{children}</body>
    </html>
  );
}

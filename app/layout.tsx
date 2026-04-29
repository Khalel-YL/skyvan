import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const skyvanFont = Orbitron({
  variable: "--font-skyvan",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://skyvan.com.tr"),
  title: {
    default: "Skyvan OS",
    template: "%s · Skyvan OS",
  },
  description: "Skyvan karavan işletim sistemi ve yönetim omurgası.",
  icons: {
    icon: "/brand/png/emblem-dark.png",
    apple: "/brand/png/emblem-dark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} ${skyvanFont.variable}`}>
      <body
        className="min-h-screen antialiased"
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { DM_Sans, Outfit } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { Pwa } from "@/components/Pwa";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Paisa Tracker",
  description: "Know your balance and track every rupee you spend.",
  manifest: "/manifest.webmanifest",
  applicationName: "Paisa Tracker",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Paisa",
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0f14",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${outfit.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Pwa />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

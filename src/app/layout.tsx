import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GsapConfig } from "@/components/GsapConfig";
import { ClientFixes } from "@/components/ClientFixes";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TouraLuxe | We craft experiences",
  description:
    "A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires. Private jets, curated retreats, and bespoke itineraries.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://touraluxe.com"),
  openGraph: {
    title: "TouraLuxe | We craft experiences",
    description:
      "A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires.",
    url: "https://touraluxe.com",
    siteName: "TouraLuxe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TouraLuxe — Premium Luxury Travel",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TouraLuxe | We craft experiences",
    description:
      "A new standard in luxury travel. Immersive, exclusive, and tailored entirely to your desires.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TouraLuxe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#000000" />
        {/* Preload first frames for 0ms initial render */}
        <link rel="preload" href="/sequence/frame-001.jpg" as="image" media="(min-width: 768px)" />
        <link rel="preload" href="/sequence-mobile/frame-001.jpg" as="image" media="(max-width: 767px)" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <GsapConfig />
        <PwaRegister />
        <ClientFixes />
        {children}
      </body>
    </html>
  );
}

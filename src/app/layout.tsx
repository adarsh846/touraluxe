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
  description: "A premium luxury travel brand.",
  manifest: "/manifest.webmanifest",
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

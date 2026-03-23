import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GsapConfig } from "@/components/GsapConfig";
import { ClientFixes } from "@/components/ClientFixes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TouraLuxe | We craft experiences",
  description: "A premium luxury travel brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased cursor-none`}>
        <GsapConfig />
        <ClientFixes />
        {children}
      </body>
    </html>
  );
}

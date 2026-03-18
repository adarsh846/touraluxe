import { Preloader } from "@/components/Preloader";
import { CustomCursor } from "@/components/CustomCursor";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Featured } from "@/components/sections/Featured";
import { Testimonials } from "@/components/sections/Testimonials";
import { Marquee } from "@/components/sections/Marquee";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/Footer";
import Providers from "@/components/Providers";

export default function Home() {
  return (
    <Providers>
      <Preloader />
      <CustomCursor />
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-between">
        <Hero />
        <Marquee />
        <Services />
        <Featured />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </Providers>
  );
}
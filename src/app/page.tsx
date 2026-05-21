import { Preloader } from "@/components/Preloader";
import { CustomCursor } from "@/components/CustomCursor";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Featured } from "@/components/sections/Featured";
import { Quotes } from "@/components/sections/Quotes";
import { Marquee } from "@/components/sections/Marquee";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/Footer";
import { FlightStage } from "@/components/FlightStage";
import { FloatingSearch } from "@/components/FloatingSearch";

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden w-full max-w-full">
        <Hero />
        <Marquee />

        {/* Original Dark Mode Sections */}
        <div className="w-full">
          <Services />
          <Featured />
        </div>

        <FlightStage>
          <Quotes />
          <CTA />
        </FlightStage>
      </main>

      <Footer />
      <FloatingSearch />
    </>
  );
}
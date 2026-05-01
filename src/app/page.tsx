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
import { Flight3D } from "@/components/Flight3D";
import Providers from "@/components/Providers";

export default function Home() {

  return (
    <Providers>
      <Preloader />
      <CustomCursor />
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden w-full max-w-full">
        <Hero />
        <Marquee />

        {/* Original Dark Mode Sections */}
        <div className="w-full">
          <Services />
          <Featured />
        </div>

        {/* Unified Flight Experience Wrapper */}
        <div id="flight-wrapper" className="relative w-full bg-[#0a0a0a]">

          {/* ─── BASE BACKGROUND & GROUND PARALLAX (Under plane) ─── */}
          <div className="absolute inset-0 bg-[#0a0a0a] z-0" />
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute left-0 right-0 bg-no-repeat bg-center bg-cover origin-center gsap-ground-parallax opacity-80 will-change-transform"
              style={{
                backgroundImage: "url('/assets/background-reduced.jpg')",
                top: "-30%",
                bottom: "-30%",
              }}
            />
          </div>

          {/* ─── DEEP CLOUDS (Under plane, slower parallax) ─── */}
          <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 bottom-[-150px] bg-no-repeat bg-top bg-cover opacity-40 gsap-clouds-deep will-change-transform"
              style={{
                backgroundImage: "url('/assets/clouds.png')",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)"
              }}
            />
          </div>

          {/* ─── HIGHLIGHT EFFECTS ─── */}
          <div className="absolute top-0 left-0 right-0 h-[25vh] z-[1] pointer-events-none"
            style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)" }} />

          {/* ─── DENSE ENTRY CLOUD CEILING ─── */}
          {/* z-[6] sits ABOVE plane (z-[2]) and foreground clouds (z-[5]) */}
          <div className="absolute top-0 left-0 right-0 h-[70vh] z-[6] pointer-events-none overflow-hidden">
            {/* Layer 1: Primary dense cloud mass */}
            <div
              className="absolute inset-0 bg-no-repeat bg-cover bg-center"
              style={{
                backgroundImage: "url('/assets/cloud-ceiling.png')",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 25%, transparent 60%)",
                maskImage: "linear-gradient(to bottom, black 0%, black 25%, transparent 60%)",
                filter: "brightness(0.9) contrast(1.1) saturate(0.85) hue-rotate(5deg) grayscale(0.15)"
              }}
            />
            {/* Layer 2: Mirrored for extra density and gap-filling */}
            <div
              className="absolute inset-0 bg-no-repeat bg-cover bg-bottom opacity-80"
              style={{
                backgroundImage: "url('/assets/cloud-ceiling.png')",
                transform: "scaleX(-1)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 55%)",
                maskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 55%)",
                filter: "brightness(0.9) contrast(1.1) saturate(0.85) hue-rotate(5deg) grayscale(0.15)"
              }}
            />
            {/* Dark gradient at top to blend into #0a0a0a background */}
            <div
              className="absolute top-0 left-0 right-0 h-[30%]"
              style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)" }}
            />
          </div>

          {/* ─── CONTENT SECTIONS (z-[10]) ─── */}
          <div className="relative z-[10] w-full flex flex-col">
            {/* Spacer to give the airplane room to dive in before hitting text */}
            <div className="w-full h-[50vh] pointer-events-none" />
            <Quotes />
            <CTA />
          </div>

          {/* ─── FOREGROUND CLOUDS (Over plane, faster parallax) ─── */}
          {/* Note: Plane is z-[2], so z-[5] will render on top of it! */}
          <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden mix-blend-screen">
            <div
              className="absolute top-0 left-0 right-0 bottom-[-50px] bg-no-repeat bg-bottom bg-cover opacity-100 gsap-clouds-foreground will-change-transform"
              style={{
                backgroundImage: "url('/assets/clouds.png')",
                transform: "scaleX(-1)", // Flip horizontally to look different from deep clouds
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)"
              }}
            />
          </div>

          {/* Absolute bottom sealer to guarantee solid black transition into Footer */}
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-black to-transparent pointer-events-none z-[11]" />
        </div>
      </main>

      {/* Flight3D acts as a fixed background layer just for the flight-container section */}
      <Flight3D />

      <Footer />
    </Providers>
  );
}
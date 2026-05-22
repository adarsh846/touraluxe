"use client";

import React, { useRef } from "react";
import { Flight3D } from "./Flight3D";
import { FlightPathName } from "@/lib/flightPaths";

interface FlightStageProps {
  children: React.ReactNode;
  pathName?: FlightPathName;
}

/**
 * FlightStage - A modular container for the TouraLuxe 3D Flight Experience.
 * This component encapsulates the environment (clouds, parallax background) 
 * and the 3D plane animation, ensuring the experience is stable and portable.
 */
export function FlightStage({ children, pathName = "classic-touraluxe" }: FlightStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      id="flight-wrapper"
      ref={containerRef}
      className="relative w-full bg-[#0a0a0a]"
    >
      {/* ─── BASE BACKGROUND & GROUND PARALLAX (Under plane) ─── */}
      <div className="absolute inset-0 bg-[#0a0a0a] z-0" />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 bg-no-repeat bg-center bg-cover origin-center gsap-ground-parallax opacity-80"
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
          className="absolute top-0 left-0 right-0 bottom-[-150px] bg-no-repeat bg-top bg-cover opacity-40 gsap-clouds-deep"
          style={{
            backgroundImage: "url('/assets/clouds.png')",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)"
          }}
        />
      </div>

      {/* ─── HIGHLIGHT EFFECTS ─── */}
      <div
        className="absolute top-0 left-0 right-0 h-[25vh] z-[1] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)" }}
      />

      {/* ─── DENSE ENTRY CLOUD CEILING ─── */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] z-[6] pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/cloud-ceiling.png')",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 25%, transparent 60%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 25%, transparent 60%)"
          }}
        />
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-bottom opacity-80"
          style={{
            backgroundImage: "url('/assets/cloud-ceiling.png')",
            transform: "scaleX(-1)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 55%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 55%)"
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[30%]"
          style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)" }}
        />
      </div>

      {/* ─── CONTENT SLOT (The text/sections that scroll past) ─── */}
      <div className="relative z-[10] w-full flex flex-col">
        {/* Spacer to give the airplane room to dive in before hitting text */}
        <div className="w-full h-[50vh] pointer-events-none" />
        {children}
      </div>

      {/* ─── FOREGROUND CLOUDS (Over plane, faster parallax) ─── */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden mix-blend-screen">
        <div
          className="absolute top-0 left-0 right-0 bottom-[-50px] bg-no-repeat bg-bottom bg-cover opacity-100 gsap-clouds-foreground"
          style={{
            backgroundImage: "url('/assets/clouds.png')",
            transform: "scaleX(-1)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)"
          }}
        />
      </div>

      {/* ─── 3D ENGINE ─── */}
      {/* We pass the containerRef so Flight3D knows exactly what to trigger on */}
      <Flight3D containerRef={containerRef} pathName={pathName} />

      {/* Bottom sealer */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-black to-transparent pointer-events-none z-[11]" />
    </div>
  );
}

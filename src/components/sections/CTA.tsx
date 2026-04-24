"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Magnetic } from "../Magnetic";
import { X } from "lucide-react";

export function CTA() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Masked text reveal sequence for the CTA
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      });

      // 1. Unmask the words smoothly
      tl.to(".cta-word", {
        y: "0%",
        duration: 1.2,
        stagger: 0.08,
        ease: "power4.out",
      })
        // 2. Fade up the rest of the content (paragraph and button)
        .fromTo(
          ".cta-content",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
          },
          "-=0.8" // Start fading in while words are still landing
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const openModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    setIsSubmitted(false);
    dialog.showModal();

    // GPU-accelerated entrance — single timeline, no stagger delay on mobile
    const tl = gsap.timeline({ defaults: { force3D: true } });
    tl.fromTo(
      dialog,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    )
    .fromTo(
      ".modal-content",
      { y: 30, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" },
      "-=0.15"
    )
    .fromTo(
      ".modal-field",
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.04 },
      "-=0.2"
    );
  };

  const closeModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    gsap.to(".modal-content", {
      y: 20, opacity: 0, scale: 0.97,
      duration: 0.2, ease: "power2.in", force3D: true,
    });
    gsap.to(dialog, {
      opacity: 0, duration: 0.25, ease: "power2.in", delay: 0.05,
      onComplete: () => dialog.close(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Animate submit
    gsap.to(".modal-form", {
      opacity: 0, y: -10, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setIsSubmitted(true);
        gsap.fromTo(
          ".success-message",
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out" }
        );
      },
    });
  };

  return (
    <>
      <section 
        ref={containerRef}
        id="contact"
        className="relative py-40 px-6 w-full text-[#1d1d1f] overflow-visible flex items-center justify-center min-h-screen bg-transparent"
      >
        <div 
          ref={contentRef}
          className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8"
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] flex flex-wrap justify-center gap-x-[0.3em]">
            {"Ready to transcend the ordinary?".split(" ").map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex pt-2 pb-1 -my-2">
                <span className="cta-word inline-block translate-y-[110%] will-change-transform text-[#1d1d1f]">
                  {word}
                </span>
              </span>
            ))}
          </h2>
          
          <p className="cta-content opacity-0 text-lg md:text-xl text-[#1d1d1f]/60 max-w-xl font-normal tracking-wide will-change-transform">
            Connect with our travel curators to design your next unparalleled experience.
          </p>

          <div className="cta-content opacity-0 will-change-transform">
            <Magnetic>
              <button
                onClick={openModal}
                className="mt-4 inline-block rounded-full bg-[#1d1d1f] px-8 py-4 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Begin Your Journey
              </button>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[9000] w-full h-full max-w-none max-h-none m-0 p-0 bg-black/80 backdrop-blur-md border-none outline-none will-change-[opacity]"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="modal-content flex items-center justify-center min-h-full px-4 py-8 will-change-transform">
          <div className="relative w-full max-w-lg bg-[#141414] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
            {/* Close Button */}
            <div className="absolute top-5 right-5 z-10">
              <Magnetic>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <X size={16} />
                </button>
              </Magnetic>
            </div>

            {!isSubmitted ? (
              <form ref={formRef} onSubmit={handleSubmit} className="modal-form flex flex-col gap-6">
                <div className="modal-field">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-1">
                    Let&apos;s craft your experience.
                  </h3>
                  <p className="text-sm text-white/40">
                    Fill in your details and our curators will reach out within 24 hours.
                  </p>
                </div>

                <div className="modal-field flex flex-col gap-1.5">
                  <label htmlFor="contact-name" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="modal-field flex flex-col gap-1.5">
                  <label htmlFor="contact-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="modal-field flex flex-col gap-1.5">
                  <label htmlFor="contact-destination" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Dream Destination</label>
                  <input
                    id="contact-destination"
                    type="text"
                    placeholder="e.g. Maldives, Swiss Alps, Amalfi Coast"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="modal-field flex flex-col gap-1.5">
                  <label htmlFor="contact-message" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Tell us more</label>
                  <textarea
                    id="contact-message"
                    rows={3}
                    placeholder="Share your vision for the perfect trip..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>

                <div className="modal-field">
                  <Magnetic className="block w-full">
                    <button
                      type="submit"
                      className="w-full rounded-full bg-white text-black py-3.5 text-sm font-semibold transition-all hover:bg-white/90 active:scale-[0.98] shadow-lg"
                    >
                      Send Inquiry
                    </button>
                  </Magnetic>
                </div>
              </form>
            ) : (
              <div className="success-message flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-2 shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  Inquiry Received
                </h3>
                <p className="text-sm text-white/40 max-w-xs">
                  Our travel curators will reach out within 24 hours to begin designing your experience.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-4 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

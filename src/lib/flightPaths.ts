import gsap from "gsap";
import * as THREE from "three";

export interface FlightPathParams {
  timeline: gsap.core.Timeline;
  planeGroup: THREE.Group;
  myPlane: THREE.Group;
  light: THREE.PointLight;
  rimLight: THREE.PointLight;
  camera: THREE.PerspectiveCamera;
  sectionDuration: number;
  xScale: number;
  tau: number;
}

export type FlightPathName = "classic-touraluxe";

/**
 * Registry of available flight paths.
 * You can add new animation sequences here without touching the 3D engine.
 */
export const FLIGHT_PATHS: Record<FlightPathName, (params: FlightPathParams) => void> = {
  "classic-touraluxe": ({
    timeline,
    planeGroup,
    myPlane,
    light,
    rimLight,
    camera,
    sectionDuration,
    xScale,
    tau
  }) => {
    let delay = 0;

    // ══════════════════════════════════════════════════════════
    // PHASE 1: CLOUD-BREAK ENTRANCE
    // ══════════════════════════════════════════════════════════
    gsap.set(planeGroup.position, { x: 350, y: 200, z: -600 });
    gsap.set(planeGroup.rotation, { x: tau * 0.1, y: tau * -0.25, z: tau * 0.1 });

    // Fade the fuselage in
    myPlane.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        timeline.to((child as THREE.Mesh).material, {
          opacity: 1,
          duration: sectionDuration * 0.5
        }, delay);
      }
    });

    timeline.to(planeGroup.position, { x: 0, y: 10, z: -100, ease: "power2.out" }, delay);
    timeline.to(planeGroup.rotation, { x: tau * 0.2, y: tau * -0.1, z: 0, ease: "power2.out" }, delay);
    timeline.to(light.position, { x: 50, y: 10, z: 120, ease: "power2.out" }, delay);
    delay += sectionDuration;

    // ══════════════════════════════════════════════════════════
    // PHASE 2: GRACEFUL LEFT BANK
    // ══════════════════════════════════════════════════════════
    timeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.04, ease: "power2.inOut" }, delay);
    timeline.to(planeGroup.position, { x: -25 * xScale, y: 3, z: -70, ease: "power2.inOut" }, delay);
    timeline.to(rimLight.position, { x: -60, y: 30, z: -50, ease: "power2.inOut" }, delay);
    delay += sectionDuration;

    // ══════════════════════════════════════════════════════════
    // PHASE 3: RIGHT CORRECTION
    // ══════════════════════════════════════════════════════════
    timeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: tau * 0.035, ease: "power3.inOut" }, delay);
    timeline.to(planeGroup.position, { x: 20 * xScale, y: -3, z: -60, ease: "sine.inOut" }, delay);
    timeline.to(light.position, { x: 60, y: 5, z: 100, ease: "sine.inOut" }, delay);
    delay += sectionDuration;

    // ══════════════════════════════════════════════════════════
    // PHASE 4: LEVEL CRUISE (THE HERO MOMENT)
    // ══════════════════════════════════════════════════════════
    timeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: 0, ease: "power4.inOut" }, delay);
    timeline.to(planeGroup.position, { x: 0, y: 0, z: -55, ease: "power4.inOut" }, delay);
    timeline.to(light.position, { x: 40, y: 0, z: 130, ease: "power4.inOut" }, delay);
    timeline.to(rimLight.position, { x: -40, y: 20, z: -80, ease: "power4.inOut" }, delay);
    delay += sectionDuration;

    // ══════════════════════════════════════════════════════════
    // PHASE 5: NOSE-UP CLIMB
    // ══════════════════════════════════════════════════════════
    timeline.to(planeGroup.rotation, { x: tau * 0.17, y: 0, z: tau * 0.02, ease: "power2.inOut" }, delay);
    timeline.to(planeGroup.position, { z: -90, x: -5 * xScale, y: -8, ease: "power2.inOut" }, delay);
    timeline.to(light.position, { x: 30, y: -15, z: 80, ease: "power2.inOut" }, delay);
    delay += sectionDuration;

    // ══════════════════════════════════════════════════════════
    // PHASE 6: EXPLOSIVE EXIT
    // ══════════════════════════════════════════════════════════
    const exitZ = camera.position.z + 170;
    timeline.to(planeGroup.rotation, { duration: sectionDuration, x: -tau * 0.05, y: 0, z: -tau * 0.1, ease: "none" }, delay);
    timeline.to(planeGroup.position, { duration: sectionDuration, x: 0, y: 35, z: exitZ, ease: "power2.in" }, delay);
    timeline.to(light.position, { duration: sectionDuration, x: 0, y: 0, z: 0, ease: "power1.in" }, delay);
    timeline.to(light, { duration: sectionDuration * 0.7, intensity: 1.8, ease: "power2.in" }, delay);
    timeline.to(light, { duration: sectionDuration * 0.3, intensity: 0.9, ease: "power2.out" }, delay + sectionDuration * 0.7);
    timeline.to(rimLight, { duration: sectionDuration, intensity: 0, ease: "power2.in" }, delay);
  }
};

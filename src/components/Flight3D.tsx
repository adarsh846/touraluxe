"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function Flight3D() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unsupported">("loading");

  useEffect(() => {
    const container = canvasContainerRef.current;
    let unsupportedTimeout: number | null = null;

    if (!container) return;
    if (!supportsWebGL()) {
      unsupportedTimeout = window.setTimeout(() => {
        setLoadState("unsupported");
      }, 0);

      return () => {
        if (unsupportedTimeout) {
          window.clearTimeout(unsupportedTimeout);
        }
      };
    }

    let w = window.innerWidth;
    let h = window.innerHeight;
    let renderer: THREE.WebGLRenderer | null = null;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 1200); // Blend model into background at distance

    const aspect = w / h;
    // Smooth FOV scaling — wider on portrait to prevent wing cropping
    const fov = 45 + Math.max(0, (1 - aspect) * 30);
    const camera = new THREE.PerspectiveCamera(fov, aspect, 1, 3000);
    const minCamZ = aspect < 1 ? 165 : 180;
    const camZ = (screen.width - w) / 3;
    camera.position.set(0, 0, camZ < minCamZ ? minCamZ : camZ);
    // Less horizontal offset on portrait to keep the plane centered in narrow viewport
    const lookAtX = aspect < 1 ? 5 : 15;
    camera.lookAt(new THREE.Vector3(lookAtX, 5, 0));

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      unsupportedTimeout = window.setTimeout(() => {
        setLoadState("unsupported");
      }, 0);
      return () => {
        if (unsupportedTimeout) {
          window.clearTimeout(unsupportedTimeout);
        }
      };
    }

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ─── LIGHTING (original fb37f5e calibration) ───
    const light = new THREE.PointLight(0xffffff, 0.75);
    light.position.set(70, -20, 150);
    scene.add(light);

    const softLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(softLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(0, 30, 200);
    scene.add(fillLight);

    // Rim light kept at 0 intensity (referenced by timeline but visually silent)
    const rimLight = new THREE.PointLight(0xffffff, 0);
    rimLight.position.set(-80, 40, -100);
    scene.add(rimLight);

    // ─── PLANE GROUP ───
    const planeGroup = new THREE.Group();
    scene.add(planeGroup);

    const tau = Math.PI * 2;

    // Initial position (exact reference modified to start further offscreen)
    gsap.set(planeGroup.rotation, { y: tau * -0.25 });
    gsap.set(planeGroup.position, { x: 180, y: -32, z: -60 });

    const render = () => renderer?.render(scene, camera);
    render();

    const onResize = () => {
      if (!renderer) return;
      w = window.innerWidth;
      h = window.innerHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = 45 + Math.max(0, (1 - aspect) * 30);
      const minZ = aspect < 1 ? 165 : 180;
      const cZ = (screen.width - w) / 3;
      camera.position.z = cZ < minZ ? minZ : cZ;
      const lookAtX = aspect < 1 ? 5 : 15;
      camera.lookAt(new THREE.Vector3(lookAtX, 5, 0));
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render();
    };
    window.addEventListener("resize", onResize);

    let myPlane: THREE.Group | null = null;
    let flightTimeline: gsap.core.Timeline | null = null;

    const manager = new THREE.LoadingManager(() => {
      if (!myPlane) return;

      // Compute current aspect at load time for responsive scaling
      const currentAspect = window.innerWidth / window.innerHeight;

      // Auto-scale and center the model
      // Desktop (aspect >= 1): full 85-unit wingspan
      // Portrait phones: scales down proportionally (e.g., ~62 at 0.46 aspect)
      const box = new THREE.Box3().setFromObject(myPlane);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const baseScale = currentAspect < 1 ? 85 * (0.55 + currentAspect * 0.45) : 85;
      const scale = baseScale / maxDim;
      myPlane.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      myPlane.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      myPlane.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = (child as THREE.Mesh);
          mesh.frustumCulled = false;
          if (mesh.material) {
            (mesh.material as any).metalness = 0.8;
            (mesh.material as any).roughness = 0.2;
            (mesh.material as any).emissive = new THREE.Color(0x050505);
            (mesh.material as any).emissiveIntensity = 1.0;
            (mesh.material as any).transparent = true;
            (mesh.material as any).opacity = 0;
          }
        }
      });

      // Align model orientation
      myPlane.rotation.y = -Math.PI / 2;

      planeGroup.add(myPlane);
      setLoadState("ready");

      const flightWrapper = document.getElementById("flight-wrapper");
      if (!flightWrapper) return;

      const sectionDuration = 1;

      // Scale flight path x-positions on narrow screens to keep S-curves proportional
      const xScale = currentAspect < 1 ? 0.6 + currentAspect * 0.4 : 1;

      flightTimeline = gsap.timeline({
        onUpdate: render,
        scrollTrigger: {
          trigger: flightWrapper,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        defaults: { duration: sectionDuration, ease: "power2.inOut" },
      });

      let delay = 0;

      // ══════════════════════════════════════════════════════════
      // PHASE 1: CLOUD-BREAK ENTRANCE
      // The plane punches through the cloud ceiling from the upper-right,
      // fading in as it descends — like breaking through an overcast layer.
      // ══════════════════════════════════════════════════════════
      gsap.set(planeGroup.position, { x: 350, y: 200, z: -600 });
      gsap.set(planeGroup.rotation, { x: tau * 0.1, y: tau * -0.25, z: tau * 0.1 });

      // Fade the fuselage in during descent
      myPlane.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as any;
          flightTimeline?.to(mat, {
            opacity: 1,
            duration: sectionDuration * 0.5,
            onStart: () => { mat.transparent = true; }
          }, delay)
          .set(mat, { transparent: false }, delay + sectionDuration * 0.5);
        }
      });

      // Sweep down and left into frame — long, elegant approach
      flightTimeline.to(planeGroup.position, { x: 0, y: 10, z: -100, ease: "power2.out" }, delay);
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.2, y: tau * -0.1, z: 0, ease: "power2.out" }, delay);
      // Key light tracks the plane's descent
      flightTimeline.to(light.position, { x: 50, y: 10, z: 120, ease: "power2.out" }, delay);
      delay += sectionDuration;

      // ══════════════════════════════════════════════════════════
      // PHASE 2: GRACEFUL LEFT BANK
      // Coordinated turn — the plane rolls into a banked left curve
      // with nose tracking and the fuselage catching light on the turn.
      // ══════════════════════════════════════════════════════════
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.04, ease: "power2.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: -25 * xScale, y: 3, z: -70, ease: "power2.inOut" }, delay);
      // Rim light shifts to catch the banked wing edge
      flightTimeline.to(rimLight.position, { x: -60, y: 30, z: -50, ease: "power2.inOut" }, delay);
      delay += sectionDuration;

      // ══════════════════════════════════════════════════════════
      // PHASE 3: RIGHT CORRECTION WITH BREATHING ALTITUDE
      // Recovery from the bank — a natural S-curve correction
      // with a gentle altitude breath that feels organic.
      // ══════════════════════════════════════════════════════════
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: tau * 0.035, ease: "power3.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: 20 * xScale, y: -3, z: -60, ease: "sine.inOut" }, delay);
      // Key light follows to the right, warming the fuselage
      flightTimeline.to(light.position, { x: 60, y: 5, z: 100, ease: "sine.inOut" }, delay);
      delay += sectionDuration;

      // ══════════════════════════════════════════════════════════
      // PHASE 4: LEVEL CRUISE — THE HERO MOMENT
      // Wings level, centered, head-on. This is the money shot
      // where the plane is perfectly framed for maximum impact.
      // ══════════════════════════════════════════════════════════
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: 0, ease: "power4.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: 0, y: 0, z: -55, ease: "power4.inOut" }, delay);
      // All lights converge — maximum illumination for the hero frame
      flightTimeline.to(light.position, { x: 40, y: 0, z: 130, ease: "power4.inOut" }, delay);
      flightTimeline.to(rimLight.position, { x: -40, y: 20, z: -80, ease: "power4.inOut" }, delay);
      delay += sectionDuration;

      // ══════════════════════════════════════════════════════════
      // PHASE 5: NOSE-UP CLIMB INITIATION
      // The plane pitches up and begins gaining altitude —
      // a dramatic shift from level flight to climbing power.
      // ══════════════════════════════════════════════════════════
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.17, y: 0, z: tau * 0.02, ease: "power2.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { z: -90, x: -5 * xScale, y: -8, ease: "power2.inOut" }, delay);
      // Light shifts below as the plane climbs above it
      flightTimeline.to(light.position, { x: 30, y: -15, z: 80, ease: "power2.inOut" }, delay);
      delay += sectionDuration;

      // ══════════════════════════════════════════════════════════
      // PHASE 6: EXPLOSIVE EXIT — AFTERBURNER CLIMB
      // Full-power climb toward the viewer. The plane pitches nose-up,
      // banks slightly, and rockets past the camera with the key light
      // fading to simulate distance. Exit uses camera-relative Z
      // to guarantee clearance on every screen size.
      // ══════════════════════════════════════════════════════════
      const exitZ = camera.position.z + 170;
      flightTimeline.to(planeGroup.rotation, { duration: sectionDuration, x: -tau * 0.05, y: 0, z: -tau * 0.1, ease: "none" }, delay);
      flightTimeline.to(planeGroup.position, { duration: sectionDuration, x: 0, y: 35, z: exitZ, ease: "power2.in" }, delay);
      // Lights fade as the airliner scorches past
      flightTimeline.to(light.position, { duration: sectionDuration, x: 0, y: 0, z: 0, ease: "power1.in" }, delay);
      flightTimeline.to(light, { duration: sectionDuration * 0.7, intensity: 1.8, ease: "power2.in" }, delay);
      flightTimeline.to(light, { duration: sectionDuration * 0.3, intensity: 0.9, ease: "power2.out" }, delay + sectionDuration * 0.7);
      flightTimeline.to(rimLight, { duration: sectionDuration, intensity: 0, ease: "power2.in" }, delay);

      const grounds = document.querySelectorAll(".gsap-ground-parallax");
      const deepClouds = document.querySelectorAll(".gsap-clouds-deep");
      const foregroundClouds = document.querySelectorAll(".gsap-clouds-foreground");

      grounds.forEach((groundNode) => {
        gsap.to(groundNode, {
          y: "30%",
          force3D: true,
          scrollTrigger: {
            trigger: "#flight-wrapper",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      deepClouds.forEach((cloudNode) => {
        gsap.from(cloudNode, {
          y: "20%",
          force3D: true,
          scrollTrigger: {
            trigger: "#flight-wrapper",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      foregroundClouds.forEach((cloudNode) => {
        gsap.from(cloudNode, {
          y: "25%",
          force3D: true,
          scrollTrigger: {
            trigger: "#flight-wrapper",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    });

    manager.onError = () => {
      setLoadState("unsupported");
    };

    const loader = new GLTFLoader(manager);
    loader.load(
      "/assets/airplane.glb",
      (gltf) => {
        myPlane = gltf.scene;
      },
      undefined,
      () => {
        setLoadState("unsupported");
      }
    );

    const flightWrapperNode = document.getElementById("flight-wrapper");
    let observer: IntersectionObserver | null = null;

    if (flightWrapperNode) {
      observer = new IntersectionObserver(
        ([entry]) => {
          container.style.visibility = entry.isIntersecting ? "visible" : "hidden";
        },
        { threshold: 0, rootMargin: "0px" }
      );
      observer.observe(flightWrapperNode);
    }

    const onScrollEnd = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("scrollend", onScrollEnd);

    return () => {
      if (unsupportedTimeout) {
        window.clearTimeout(unsupportedTimeout);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scrollend", onScrollEnd);
      if (observer) observer.disconnect();
      if (flightTimeline) flightTimeline.kill();
      gsap.killTweensOf(".gsap-clouds-parallax");
      gsap.killTweensOf(".gsap-ground-parallax");
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();

          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      container.replaceChildren();
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      style={{ visibility: "hidden" }}
      className="fixed inset-0 pointer-events-none z-[2] w-full h-full"
    >
      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

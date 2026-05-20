"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLIGHT_PATHS, FlightPathName } from "@/lib/flightPaths";

gsap.registerPlugin(ScrollTrigger);

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

interface Flight3DProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
  pathName?: FlightPathName;
}

export function Flight3D({ containerRef, pathName = "classic-touraluxe" }: Flight3DProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unsupported">("loading");
  const isVisible = useRef(false);

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
    const camZ = aspect < 1 ? minCamZ : (screen.width - w) / 3;
    camera.position.set(0, 0, camZ < minCamZ ? minCamZ : camZ);
    // Less horizontal offset on portrait to keep the plane centered in narrow viewport
    const lookAtX = aspect < 1 ? 5 : 15;
    camera.lookAt(new THREE.Vector3(lookAtX, 5, 0));

    try {
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        precision: "mediump"
      } as any);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0); 
    
    // Optimization: Shadows are expensive and not needed for this floating scene
    renderer.shadowMap.enabled = false;
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

    // Optimization: Skip rendering if the component is off-screen
    const render = () => {
      if (!isVisible.current) return;
      renderer?.render(scene, camera);
    };
    render();

    let myPlane: THREE.Group | null = null;
    let flightTimeline: gsap.core.Timeline | null = null;
    let originalMaxDim = 1;
    let originalCenter = new THREE.Vector3();
    let isInitialized = false;

    const rebuildTimeline = () => {
      if (!myPlane || !isInitialized || !canvasContainerRef.current) return;

      // 1. Clean up old timeline and ScrollTrigger completely using the ID to prevent ghost instances
      const oldTrigger = ScrollTrigger.getById("flight-trigger");
      if (oldTrigger) {
        oldTrigger.kill(true);
      }
      if (flightTimeline) {
        flightTimeline.kill();
        flightTimeline = null;
      }

      // 2. Clear old states and proceed to timeline rebuild

      const currentAspect = window.innerWidth / window.innerHeight;

      // Auto-scale and center the model responsively using original boundaries
      const baseScale = currentAspect < 1 ? 85 * (0.55 + currentAspect * 0.45) : 85;
      const scale = baseScale / originalMaxDim;
      myPlane.scale.set(scale, scale, scale);
      myPlane.position.set(-originalCenter.x * scale, -originalCenter.y * scale, -originalCenter.z * scale);

      const flightWrapper = containerRef?.current || document.getElementById("flight-wrapper");
      if (!flightWrapper) return;

      const sectionDuration = 1;

      // Scale flight path x-positions on narrow screens to keep S-curves proportional
      const xScale = currentAspect < 1 ? 0.6 + currentAspect * 0.4 : 1;

      flightTimeline = gsap.timeline({
        onUpdate: render,
        scrollTrigger: {
          id: "flight-trigger",
          trigger: flightWrapper,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        defaults: { duration: sectionDuration, ease: "power2.inOut" },
      });

      const pathFunction = FLIGHT_PATHS[pathName] || FLIGHT_PATHS["classic-touraluxe"];
      pathFunction({
        timeline: flightTimeline,
        planeGroup,
        myPlane,
        light,
        rimLight,
        camera,
        sectionDuration,
        xScale,
        tau
      });

      ScrollTrigger.refresh();
      render();

      // 3. Fade the canvas back in smoothly now that coordinates are 100% accurate
      canvasContainerRef.current.style.opacity = "1";
    };

    let rebuildTimeout: number | null = null;
    const onResize = () => {
      if (!renderer || !canvasContainerRef.current) return;
      
      // Instantly hide the canvas during resize to prevent the user from seeing any layout shift jumps
      canvasContainerRef.current.style.opacity = "0";

      w = window.innerWidth;
      h = window.innerHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = 45 + Math.max(0, (1 - aspect) * 30);
      const minZ = aspect < 1 ? 165 : 180;
      const cZ = aspect < 1 ? minZ : (screen.width - w) / 3;
      camera.position.z = cZ < minZ ? minZ : cZ;
      const lookAtX = aspect < 1 ? 5 : 15;
      camera.lookAt(new THREE.Vector3(lookAtX, 5, 0));
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render();

      // Debounce the timeline rebuild by 600ms to guarantee React finishes rendering 
      // the new desktop/mobile DOM heights before we measure coordinates.
      if (rebuildTimeout) {
        window.clearTimeout(rebuildTimeout);
      }
      rebuildTimeout = window.setTimeout(() => {
        rebuildTimeline();
      }, 600);
    };
    window.addEventListener("resize", onResize);

    const manager = new THREE.LoadingManager(() => {
      if (!myPlane) return;

      const box = new THREE.Box3().setFromObject(myPlane);
      const size = box.getSize(new THREE.Vector3());
      originalMaxDim = Math.max(size.x, size.y, size.z);
      originalCenter = box.getCenter(new THREE.Vector3());
      isInitialized = true;

      myPlane.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = (child as THREE.Mesh);
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
          mesh.frustumCulled = true;
          if (mesh.material) {
            (mesh.material as any).metalness = 0.8;
            (mesh.material as any).roughness = 0.2;
            (mesh.material as any).emissive = new THREE.Color(0x050505);
            (mesh.material as any).emissiveIntensity = 1.0;
          }
        }
      });

      // Align model orientation
      myPlane.rotation.y = -Math.PI / 2;

      planeGroup.add(myPlane);

      // Pre-compile all GLSL shaders on the GPU now (during load) instead of
      // lazily on the first scroll frame — eliminates first-scroll stutter
      if (renderer) {
        renderer.compile(scene, camera);
      }

      setLoadState("ready");

      const flightWrapper = containerRef?.current || document.getElementById("flight-wrapper");
      if (!flightWrapper) return;

      // Build flight path timeline for the first time
      rebuildTimeline();

      const grounds = flightWrapper.querySelectorAll(".gsap-ground-parallax");
      const deepClouds = flightWrapper.querySelectorAll(".gsap-clouds-deep");
      const foregroundClouds = flightWrapper.querySelectorAll(".gsap-clouds-foreground");

      grounds.forEach((groundNode, idx) => {
        gsap.to(groundNode, {
          y: "30%",
          force3D: true,
          scrollTrigger: {
            id: `parallax-ground-${idx}`,
            trigger: flightWrapper,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      deepClouds.forEach((cloudNode, idx) => {
        gsap.from(cloudNode, {
          y: "20%",
          force3D: true,
          scrollTrigger: {
            id: `parallax-deep-${idx}`,
            trigger: flightWrapper,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      foregroundClouds.forEach((cloudNode, idx) => {
        gsap.from(cloudNode, {
          y: "25%",
          force3D: true,
          scrollTrigger: {
            id: `parallax-foreground-${idx}`,
            trigger: flightWrapper,
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

    const flightWrapperNode = containerRef?.current || document.getElementById("flight-wrapper");
    let observer: IntersectionObserver | null = null;

    if (flightWrapperNode) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible.current = entry.isIntersecting;
          container.style.visibility = entry.isIntersecting ? "visible" : "hidden";
          if (entry.isIntersecting) render(); // Final render to ensure state is correct
        },
        { threshold: 0, rootMargin: "200px" } // Increased margin for smoother entry
      );
      observer.observe(flightWrapperNode);
    }

    return () => {
      if (unsupportedTimeout) {
        window.clearTimeout(unsupportedTimeout);
      }
      window.removeEventListener("resize", onResize);
      if (observer) observer.disconnect();

      // Dynamically destroy and garbage-collect all cloud/ground scroll triggers
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.id && (t.vars.id.startsWith("parallax-") || t.vars.id === "flight-trigger")) {
          t.kill(true);
        }
      });

      if (flightTimeline) flightTimeline.kill();
      gsap.killTweensOf(".gsap-clouds-parallax");
      gsap.killTweensOf(".gsap-ground-parallax");
      gsap.killTweensOf(".gsap-clouds-deep");
      gsap.killTweensOf(".gsap-clouds-foreground");
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
      style={{ visibility: "hidden", opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-[2] w-full h-full transition-opacity duration-500 ease-out"
    >
      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

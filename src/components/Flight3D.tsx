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
    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    const camZ = (screen.width - w) / 3;
    camera.position.set(0, 0, camZ < 180 ? 180 : camZ);
    camera.lookAt(new THREE.Vector3(0, 5, 0));

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

    // ─── LIGHTING (boosted for dark TouraLuxe background) ───
    const light = new THREE.PointLight(0xffffff, 2.0);
    light.position.set(70, -20, 150);
    scene.add(light);

    const softLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(softLight);

    // Front fill light to prevent silhouette effect
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(0, 30, 100);
    scene.add(fillLight);

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
      camera.aspect = w / h;
      const cZ = (screen.width - w) / 3;
      camera.position.z = cZ < 180 ? 180 : cZ;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render();
    };
    window.addEventListener("resize", onResize);

    let myPlane: THREE.Group | null = null;
    let flightTimeline: gsap.core.Timeline | null = null;

    const manager = new THREE.LoadingManager(() => {
      if (!myPlane) return;

      // Auto-scale and center the model
      const box = new THREE.Box3().setFromObject(myPlane);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 85 / maxDim; // More balanced size
      myPlane.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      myPlane.position.x -= center.x * scale;
      myPlane.position.y -= center.y * scale;
      myPlane.position.z -= center.z * scale;

      myPlane.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = (child as THREE.Mesh);
          mesh.frustumCulled = false;
          if (mesh.material) {
            (mesh.material as any).metalness = 0.8;
            (mesh.material as any).roughness = 0.2;
          }
        }
      });

      // Align model orientation (nose should point forward/away from camera by default)
      myPlane.rotation.y = -Math.PI / 2; 

      planeGroup.add(myPlane);
      setLoadState("ready");

      const flightWrapper = document.getElementById("flight-wrapper");
      if (!flightWrapper) return;

      const sectionDuration = 1;

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

      // Start position (Dive-in from top right)
      gsap.set(planeGroup.position, { x: 250, y: 150, z: -100 });
      gsap.set(planeGroup.rotation, { x: tau * 0.1, y: tau * -0.25, z: tau * 0.1 });

      flightTimeline.to(planeGroup.position, { x: 0, y: 10, ease: "power1.in" }, delay);
      flightTimeline.to(planeGroup.rotation, { x: tau * 0.2, y: tau * -0.1, z: 0, ease: "power1.in" }, delay);
      delay += sectionDuration;

      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.05, ease: "power1.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: -30, y: 0, z: -60, ease: "power1.inOut" }, delay);
      delay += sectionDuration;

      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: tau * 0.05, ease: "power3.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: 30, y: 0, z: -60, ease: "power2.inOut" }, delay);
      delay += sectionDuration;

      flightTimeline.to(planeGroup.rotation, { x: tau * 0.25, y: 0, z: 0, ease: "power2.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { x: 0, y: 0, z: -60, ease: "power2.inOut" }, delay);
      delay += sectionDuration;

      flightTimeline.to(planeGroup.rotation, { x: tau * 0.15, y: 0, z: tau * 0.03, ease: "power2.inOut" }, delay);
      flightTimeline.to(planeGroup.position, { z: -100, x: 0, y: -10, ease: "power2.inOut" }, delay);
      delay += sectionDuration;

      flightTimeline.to(planeGroup.rotation, { duration: sectionDuration, x: -tau * 0.05, y: 0, z: tau * 0.03, ease: "power1.in" }, delay);
      flightTimeline.to(planeGroup.position, { duration: sectionDuration, x: -10, y: 40, z: 350, ease: "power2.in" }, delay);
      flightTimeline.to(light.position, { duration: sectionDuration, x: 0, y: 0, z: 0 }, delay);

      const grounds = document.querySelectorAll(".gsap-ground-parallax");
      const deepClouds = document.querySelectorAll(".gsap-clouds-deep");
      const foregroundClouds = document.querySelectorAll(".gsap-clouds-foreground");

      grounds.forEach((groundNode) => {
        gsap.to(groundNode, {
          y: "15%",
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
          y: "8%",
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

# TouraLuxe: Complete Technical & Design Specification

TouraLuxe is a cinematic web experience built to showcase premium travel services through advanced 3D motion and high-fidelity front-end engineering.

---

## 1. Project Directory Structure
```text
TouraLuxe/
├── public/                  # Static assets
│   ├── assets/              # airplane.glb, clouds.png, background.jpg
│   └── icons/               # High-res PWA brand assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Design tokens & global resets
│   │   ├── layout.tsx       # Root configuration & Font loading
│   │   ├── page.tsx         # Main landing page assembly
│   │   └── manifest.ts      # PWA metadata
│   ├── components/          # Reusable UI & Logic
│   │   ├── sections/        # Hero, Services, Featured, etc.
│   │   ├── Flight3D.tsx     # Core WebGL/Three.js engine
│   │   ├── Magnetic.tsx     # Cursor physics component
│   │   ├── CustomCursor.tsx # Custom GSAP follower
│   │   ├── Preloader.tsx    # Asset sequence loader
│   │   └── Navbar.tsx       # Interactive navigation
│   └── lib/                 # Utility functions & hooks
└── design.md                # This document
```

---

## 2. Design System & Tokens

### Color Palette
*   **Background:** `#000000` (True Black)
*   **Foreground:** `#f5f5f7` (Apple-style Soft White)
*   **Muted:** `#86868b` (Secondary Text Gray)
*   **Selection:** White background with black text for high contrast.

### Typography
*   **Primary Font:** Inter (Variable Sans-Serif).
*   **Character:** Wide tracking for headings to evoke "luxury and space."
*   **Antialiasing:** Forced `-webkit-font-smoothing: antialiased` for ultra-crisp text on high-DPI displays.

### Cursor & Interactions
*   **Native Cursor:** Suppressed on desktop using a 1x1 transparent PNG data URI to allow the `CustomCursor.tsx` (GSAP follower) to take precedence.
*   **Tactile Feedback:** Buttons use the `Magnetic` wrapper which applies a weighted transform (lerp) based on mouse proximity.

---

## 3. The 3D Engine (`Flight3D.tsx`)

### WebGL Scene Configuration
*   **Renderer:** `WebGLRenderer` with `antialias: true` and `alpha: true`.
*   **Shadows:** `PCFSoftShadowMap` for realistic aircraft shading.
*   **Fog:** `THREE.Fog(0x0a0a0a, 10, 1200)` to blend the airplane model into the sky background as it moves toward the horizon.

### Lighting Parameters
| Light Type | Intensity | Position | Role |
| :--- | :--- | :--- | :--- |
| **PointLight** | 0.75 | `(70, -20, 150)` | Main fuselage highlight |
| **AmbientLight**| 1.5 | N/A | Base scene illumination |
| **Directional** | 0.5 | `(0, 30, 200)` | Fill light |
| **RimLight** | 0.0 – 1.8 | `(-80, 40, -100)` | Dynamic edge lighting during banked turns |

### Animation Timeline (GSAP + ScrollTrigger)
The flight path is divided into **6 Phases**:
1.  **Entrance:** Cloud-break from `(350, 200, -600)` with opacity fade.
2.  **Left Bank:** Coordinated roll to `-tau * 0.04` using Euler rotations.
3.  **S-Curve:** Correction bank with "breathing altitude" (sine ease).
4.  **Hero Moment:** Perfectly leveled flight at `(0, 0, -55)` for maximum brand impact.
5.  **Climb:** Nose-up pitch initiation.
6.  **Afterburner Exit:** Explosive z-axis acceleration past the camera `camera.position.z + 170`.

---

## 4. Section Breakdown

| Section | Component | Functionality |
| :--- | :--- | :--- |
| **Hero** | `Hero.tsx` | High-impact entrance with animated typography. |
| **Velocity** | `Marquee.tsx`| High-speed scrolling brand ticker. |
| **Offerings** | `Services.tsx`| Grid of luxury services with hover reveals. |
| **Portfolio** | `Featured.tsx`| High-res imagery with parallax transitions. |
| **Social Proof**| `Testimonials.tsx`| Rendered directly over the 3D flight path. |
| **Action** | `CTA.tsx` | Final conversion point before footer. |
| **Navigation** | `Navbar.tsx` | Floating glassmorphism menu with active section tracking. |

---

## 5. Performance & Technical Optimization

### Responsive Mathematics
*   **FOV Scaling:** `45 + Math.max(0, (1 - aspect) * 30)`. This formula dynamically increases the Field of View on portrait (mobile) devices to ensure the aircraft wings aren't cropped.
*   **Path Scaling:** X-axis positions are multiplied by `currentAspect < 1 ? 0.6 + currentAspect * 0.4 : 1` to compress the flight path for narrow screens.

### Memory & Lifecycle
*   **Asset Disposal:** `geometry.dispose()`, `material.dispose()`, and `renderer.dispose()` are called on component unmount to prevent GPU memory leaks.
*   **Visibility Toggle:** `IntersectionObserver` hides the canvas (`visibility: hidden`) when the user is in the Hero or Footer sections to save battery/CPU.

---

## 6. PWA & Deployment

*   **Offline Experience:** Standard PWA manifest allows the site to be installed as a "Home Screen" app on iOS and Android.
*   **Tap Optimization:** `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` provide a native app-like feel.
*   **Smooth Scrolling:** Lenis is configured with `lerp: 0.1` and `syncTouch: true` for consistent momentum scrolling across all hardware.

---

## 7. Future Scope & Roadmap

### 7.1 Immersive Audio (Next Phase)
*   **Engine Synthesis:** Implement an `AudioContext` based engine hum that modulates its frequency (pitch) based on the `ScrollTrigger` velocity.
*   **Spatial Audio:** Use Three.js `PositionalAudio` to make the aircraft sounds move from right-to-left or top-to-bottom relative to the 3D model's position in the viewport.

### 7.2 Personalization & AI
*   **Generative Itineraries:** Integrate an AI module to generate custom travel plans based on user interaction with specific "Services" cards.
*   **Dynamic Weather Sync:** Connect to a weather API to change the Three.js sky colors, fog density, and cloud types to match the real-time weather at the user's destination.

### 7.3 Advanced Interactivity
*   **Cockpit View:** A "Hero Transition" where the camera dives into the aircraft cockpit for a 360-degree interactive view of the luxury interior.
*   **AR Preview:** A "View in AR" button for mobile users to place the high-fidelity aircraft model in their physical environment using WebXR.

### 7.4 Performance Scaling
*   **LOD (Level of Detail):** Implement automatic switching between high-poly and low-poly airplane models based on the user's GPU capabilities.
*   **Edge Caching:** Implement stale-while-revalidate strategies for the `.glb` and 4k cloud textures to ensure near-instant repeat visits.

---

## 8. Technical Appendix: Interaction Constants

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Lenis Lerp** | `0.1` | Controls the "heaviness" of the smooth scroll. |
| **Magnetic Pull** | `0.35` | The coefficient of attraction for the magnetic buttons. |
| **Cursor Lerp** | `0.2` | The delay/smoothness of the custom cursor follower. |
| **Cloud Parallax** | `1.5x` | Foreground cloud speed relative to scroll. |
| **Fog Near/Far** | `10 / 1200` | Depth range for 3D element visibility blending. |
| **Transition Ease** | `power4.inOut` | The standard easing for high-impact section entries. |


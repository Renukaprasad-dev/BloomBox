# FERNHOLLOW — IMMERSIVE 3D FLOWER VALLEY WEBSITE
## Implementation Plan & Architectural Specification

### 1. Existing Architecture Analysis
- **Root Directory Context:** `C:\Users\Msc\Downloads\bloombox`
- **Initial Inspection Findings:**
  - The repository contained an existing Java console flower shop billing application located under `bloombox/` (`bloombox/app/BloomBox.java`, `bloombox/model/*`, `bloombox/exceptions/*`, `README.md`, `AI_LOG.txt`).
  - Git repository was uninitialized (`.git` not found initially); Git has now been initialized locally.
  - Search conducted for Gladeye original valley engine, compiled webpack bundles, pre-existing shaders, camera GLB tracks, or valley assets: **None were present in the directory or surrounding downloads**.
  - Following the explicit guidelines in Phase 1 & Phase 3:
    - Because the proprietary Gladeye valley engine and assets are not available locally and must not be scraped or reverse-engineered without authorization, we proceed with **SECOND CHOICE — ORIGINAL THREE.JS IMPLEMENTATION**.
    - We will not present this fallback as the original Gladeye engine, but as an original, high-performance procedural Three.js experience delivering the exact requested aesthetic and functional fidelity.
  - The existing Java console application in `bloombox/` is completely preserved so no existing functionality is destroyed.

---

### 2. Technology Stack & Dependencies
- **Framework:** Next.js 15 / React 19 (or React 18 compatible) with App Router for industry-standard SSR/SSG and native zero-config Vercel deployment.
- **3D Graphics Engine:** Three.js (`three`, `@types/three`).
- **Post-Processing / Shaders:** Custom Three.js post-processing shader passes or optimized canvas compositing for Bloom, Fog, Vignette, and Chromatic Aberration.
- **Audio Engine:** HTML5 Web Audio API with smooth gain ramping and synthesized organic ambient audio drone (plus audio buffer support) to satisfy browser autoplay policies and zero broken external asset links.
- **Typography:**
  - Headline: `Antonio` (Google Fonts, weights 400).
  - Body & UI: `Manrope` (Google Fonts, weights 400, 500).
- **Icons & Visuals:** `lucide-react` for precision UI iconography (arrow, speaker mute/unmute).
- **Styling:** Tailwind CSS / Vanilla CSS modules for fine-grained typography, responsive clamping, and hardware-accelerated transitions.

---

### 3. File Breakdown

#### Files to Reuse / Preserve:
- `bloombox/` (Entire Java console application preserved in place).
- `bloombox/README.md`
- `bloombox/AI_LOG.txt`

#### Files to Create:
1. `package.json`: Core Next.js, React, Three.js, Lucide React dependencies and build scripts.
2. `tsconfig.json`: TypeScript configuration with path aliases (`@/*`).
3. `next.config.mjs`: Production Next.js config tuned for static asset loading and client-side Three.js performance.
4. `tailwind.config.ts` & `postcss.config.mjs`: Color palette (`#000000`, `#f5efe2`, `#151510`, `rgba(245,239,226,0.75)`), responsive breakpoints (`820px`).
5. `.gitignore`: Standard Next.js & node_modules exclusions.
6. `app/layout.tsx`: HTML head with Google Fonts preconnect (`Antonio`, `Manrope`), SEO metadata, OpenGraph tags, responsive viewport.
7. `app/page.tsx`: Client-safe page shell integrating `ValleyScene`, `Header`, `HeroSection`, `LoadingScreen`, and bottom wander/sound controls.
8. `app/globals.css`: Base dark styling, custom cursor styles, noise textures, responsive rules.
9. `components/ValleyScene.tsx`: The centerpiece procedural 3D valley.
   - **Terrain:** Custom undulating vertex-displaced valley geometry with deep rolling hills, layered noise, dark velvety lighting, and atmospheric exponential fog.
   - **Flowers:** Over 3,500+ instanced procedural glowing flowers with dynamic color palettes (pink, violet, lavender, warm cream, subtle cyan), glowing centers, and stem/foliage geometry.
   - **Dynamic Blooming:** Distance-based flower scale and emissive intensity ramping as camera approaches.
   - **Camera System:** Smooth path trajectory with automatic forward drift, mouse-guided parallax tilt, smooth wheel/drag scrubbing, and damping.
   - **Mouse Interaction:** Interactive pointer raycaster or screen-space repulsion field that excites nearby flowers, disperses glowing spore particles, and brightens floral centers.
   - **Atmospheric Particles:** 1,000+ floating luminescent pollen spores drifting through the night air with turbulence.
   - **Post-Processing / Shaders:** Selective bloom, cinematic vignette, subtle chromatic aberration, and atmospheric depth fog.
10. `components/Header.tsx`: Fixed header with Fernhollow wordmark, desktop navigation (`WORK`, `ABOUT`, `JOURNAL`), and cream pill `LET'S TALK` CTA. Responsive collapse at `<= 820px`.
11. `components/HeroSection.tsx`: Centered hero unit with `Grown, not built.` (Antonio 158px reference), `Rooted in nature. Built for what's next.` (Manrope 20px), and circular arrow CTA button with hover animations (camera ease-to-stop, particle burst, audio muffle).
12. `components/SoundToggle.tsx`: Ambient sound controller with Web Audio API generative night valley drone, mute/unmute state with SVG icons, smooth fade in/out, and autoplay unlocking.
13. `components/LoadingScreen.tsx`: Minimalist full-screen black overlay with 9px pulsing cream dot, fading out seamlessly when 3D assets/shaders initialize.
14. `FERNHOLLOW_IMPLEMENTATION_REPORT.md`: Comprehensive completion report covering all 10 phases.

---

### 4. Implementation Strategy & Milestones

1. **Phase 1 & 2 Setup:** Initialize Next.js project with TypeScript, Tailwind, Three.js, Lucide icons, and the Fernhollow visual identity.
2. **Phase 3 3D Valley Engine:**
   - Develop `ValleyScene.tsx` with procedural terrain, instanced glowing flower geometry, custom shaders/materials, bloom & depth fog, camera drift & path controls.
   - Implement interactive mouse-influence sphere and floral bloom animations.
3. **Phase 4 & 5 UI & Interactions:**
   - Implement Header, Hero, CTA button with hover interactions (camera easing, particle dispersal, audio low-pass filter).
   - Implement Bottom "SCROLL TO WANDER" and Audio toggle.
   - Implement 9px pulsing dot loader with 1.6s interface reveal.
4. **Phase 6 Mobile Optimization:**
   - Media queries for <=820px screen width.
   - Adaptive Three.js pixel ratio and flower count scaling for mobile GPUs.
5. **Phase 8 Verification & Testing:**
   - Execute dev server, inspect rendered output, test interactions, audio, scroll, responsiveness.
   - Execute production build (`npm run build`).
6. **Phase 9 Vercel Deployment:**
   - Configure for Vercel deployment, verify environment, prepare production release.
7. **Phase 10 Final Deliverable:**
   - Compile `FERNHOLLOW_IMPLEMENTATION_REPORT.md`.

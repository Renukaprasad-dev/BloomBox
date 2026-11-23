'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ValleySceneProps {
  onLoaded?: () => void;
  isCtaHovered?: boolean;
}

// Simplex-style smooth noise for terrain elevation
function terrainElevation(x: number, z: number): number {
  // Center valley trough: lower elevation along x near 0
  const valleyWidth = 28;
  const distFromCenter = Math.abs(x);
  const valleyFactor = Math.pow(Math.min(distFromCenter / valleyWidth, 1.8), 2.2);

  // Layered sinusoidal hills
  const hill1 = Math.sin(x * 0.04) * Math.cos(z * 0.03) * 14;
  const hill2 = Math.cos(x * 0.08 + 1.2) * Math.sin(z * 0.06) * 6;
  const ridge = Math.sin(x * 0.015 - z * 0.01) * 18;

  // Base elevation: hills rise higher as we move away from center x
  const baseElev = valleyFactor * 32 - 6;

  return baseElev + hill1 + hill2 + ridge;
}

export const ValleyScene: React.FC<ValleySceneProps> = ({
  onLoaded,
  isCtaHovered = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Scene references
  const isCtaHoveredRef = useRef(isCtaHovered);
  isCtaHoveredRef.current = isCtaHovered;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const hasGl = !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
      );
      if (!hasGl) {
        setWebGlSupported(false);
        onLoaded?.();
        return;
      }
    } catch {
      setWebGlSupported(false);
      onLoaded?.();
      return;
    }

    let animationFrameId: number;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Deep nocturnal fog
    scene.fog = new THREE.FogExp2(0x020306, 0.0075);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 900);
    camera.position.set(0, 7.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0d141e, 1.2);
    scene.add(ambientLight);

    // Moonlight: cool directional light grazing the valley ridges
    const moonLight = new THREE.DirectionalLight(0x4a6fa5, 1.4);
    moonLight.position.set(40, 90, -50);
    scene.add(moonLight);

    // Soft camera lantern to illuminate foreground flowers
    const cameraLantern = new THREE.PointLight(0xf5efe2, 1.8, 45, 1.4);
    scene.add(cameraLantern);

    // 3. Terrain Generation
    const terrainGeo = new THREE.PlaneGeometry(360, 600, 140, 200);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = terrainElevation(vx, vz);
      posAttr.setY(i, vy);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, 0, -180);
    scene.add(terrainMesh);

    // 4. Glowing Flower Meadow
    const isMobile = width < 820;
    const FLOWER_COUNT = isMobile ? 2400 : 4200;

    // Palette: Pink, Violet, Lavender, Warm Cream, Subtle Cyan
    const flowerColors = [
      new THREE.Color('#ff4b93'), // Pink
      new THREE.Color('#ff75a0'), // Soft Rose Pink
      new THREE.Color('#8e44ad'), // Deep Violet
      new THREE.Color('#b39ddb'), // Lavender
      new THREE.Color('#f5efe2'), // Warm Cream
      new THREE.Color('#ffe8cc'), // Amber Cream
      new THREE.Color('#4dd0e1'), // Cyan Luminescence
    ];

    // Flower Blossom Geometry (5-petal star blossom)
    const petalCount = 5;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    for (let i = 0; i < petalCount * 2; i++) {
      const radius = i % 2 === 0 ? 0.38 : 0.16;
      const angle = (i / (petalCount * 2)) * Math.PI * 2;
      petalShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    petalShape.closePath();

    const blossomGeo = new THREE.ShapeGeometry(petalShape, 4);
    blossomGeo.rotateX(-Math.PI / 2);

    const blossomMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Glowing Flower Center Geometry
    const centerGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const centerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });

    // Instanced Meshes
    const blossomInstanced = new THREE.InstancedMesh(blossomGeo, blossomMat, FLOWER_COUNT);
    const centerInstanced = new THREE.InstancedMesh(centerGeo, centerMat, FLOWER_COUNT);

    // Flower Data Store for dynamic animations
    interface FlowerData {
      baseX: number;
      baseY: number;
      baseZ: number;
      baseScale: number;
      currentScale: number;
      color: THREE.Color;
      rotationY: number;
      tiltX: number;
      tiltZ: number;
    }

    const flowers: FlowerData[] = [];
    const dummy = new THREE.Object3D();
    const colorDummy = new THREE.Color();

    // Distribute flowers organically across the valley
    for (let i = 0; i < FLOWER_COUNT; i++) {
      // Clustered towards valley floor and lower hill gradients
      const u = Math.random();
      const spreadX = (Math.pow(u, 1.8) * 2 - 1) * 75; // -75 to 75 with concentration in middle
      const spreadZ = -Math.random() * 520 + 40; // -480 to 40 along path
      const y = terrainElevation(spreadX, spreadZ - 180) + 0.35; // slightly above ground

      const chosenColor = flowerColors[Math.floor(Math.random() * flowerColors.length)].clone();
      // Slight individual color variance
      chosenColor.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.08);

      const baseScale = 0.55 + Math.random() * 0.75;

      flowers.push({
        baseX: spreadX,
        baseY: y,
        baseZ: spreadZ,
        baseScale,
        currentScale: baseScale * 0.2, // starts closed/unbloomed until camera approaches
        color: chosenColor,
        rotationY: Math.random() * Math.PI * 2,
        tiltX: (Math.random() - 0.5) * 0.35,
        tiltZ: (Math.random() - 0.5) * 0.35,
      });

      // Initial matrix
      dummy.position.set(spreadX, y, spreadZ);
      dummy.rotation.set(flowers[i].tiltX, flowers[i].rotationY, flowers[i].tiltZ);
      dummy.scale.setScalar(flowers[i].currentScale);
      dummy.updateMatrix();

      blossomInstanced.setMatrixAt(i, dummy.matrix);
      blossomInstanced.setColorAt(i, chosenColor);

      centerInstanced.setMatrixAt(i, dummy.matrix);
      // Center color is vibrant cream/white tinted with flower hue
      colorDummy.copy(chosenColor).lerp(new THREE.Color(0xffffff), 0.7);
      centerInstanced.setColorAt(i, colorDummy);
    }

    blossomInstanced.instanceMatrix.needsUpdate = true;
    if (blossomInstanced.instanceColor) blossomInstanced.instanceColor.needsUpdate = true;
    centerInstanced.instanceMatrix.needsUpdate = true;
    if (centerInstanced.instanceColor) centerInstanced.instanceColor.needsUpdate = true;

    scene.add(blossomInstanced);
    scene.add(centerInstanced);

    // 5. Floating Spores / Atmospheric Dust Particles
    const PARTICLE_COUNT = isMobile ? 650 : 1300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    const sporeColors = [
      new THREE.Color('#f5efe2'),
      new THREE.Color('#ff75a0'),
      new THREE.Color('#4dd0e1'),
      new THREE.Color('#b39ddb'),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const px = (Math.random() - 0.5) * 120;
      const py = 1 + Math.random() * 22;
      const pz = -Math.random() * 500 + 30;

      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      particleVelocities[i * 3 + 1] = Math.random() * 0.015 + 0.005;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      const sc = sporeColors[Math.floor(Math.random() * sporeColors.length)];
      particleColors[i * 3] = sc.r;
      particleColors[i * 3 + 1] = sc.g;
      particleColors[i * 3 + 2] = sc.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Circular glowing particle texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pCtx = particleCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(245,239,226,0.85)');
      grad.addColorStop(0.8, 'rgba(245,239,226,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTex = new THREE.CanvasTexture(particleCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 1.2 : 1.6,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Navigation, Camera Movement & Mouse Interaction
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const mouse3D = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    let cameraProgress = 0; // Along Z path
    let cameraVelocity = 0.28; // Constant gentle forward drift
    let userScrollDelta = 0;
    let touchStartY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Project mouse into 3D world for flower excitement
      raycaster.setFromCamera(new THREE.Vector2(mouse.targetX, mouse.targetY), camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hit)) {
        mouse3D.copy(hit);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Natural smooth wheel wandering
      userScrollDelta += e.deltaY * 0.055;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const delta = touchStartY - e.touches[0].clientY;
        touchStartY = e.touches[0].clientY;
        userScrollDelta += delta * 0.09;
      }
    };

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial signal that scene setup is complete
    onLoaded?.();

    // 7. Animation Loop
    let clock = new THREE.Clock();
    let ctaDisperseBurst = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // CTA hover behavior: Ease camera drift to stop, trigger spore burst
      const isHovered = isCtaHoveredRef.current;
      const targetSpeed = isHovered ? 0.02 : 0.28;
      cameraVelocity += (targetSpeed - cameraVelocity) * 0.06;

      // Handle user scroll inertia
      cameraProgress += cameraVelocity + userScrollDelta;
      userScrollDelta *= 0.88; // Friction damping

      // Loop path seamlessly
      if (cameraProgress > 420) {
        cameraProgress = 0;
      } else if (cameraProgress < 0) {
        cameraProgress = 420;
      }

      // Camera coordinates along winding valley path
      const camZ = -cameraProgress + 15;
      const camX = Math.sin(cameraProgress * 0.018) * 8 + mouse.x * 3.5;
      const terrainHeightAtCam = terrainElevation(camX, camZ - 180);
      const camY = Math.max(terrainHeightAtCam + 5.5, 4.8) + mouse.y * 1.5;

      camera.position.x += (camX - camera.position.x) * 0.08;
      camera.position.y += (camY - camera.position.y) * 0.08;
      camera.position.z += (camZ - camera.position.z) * 0.08;

      // Look slightly ahead along valley curvature
      const lookAtZ = camera.position.z - 38;
      const lookAtX = Math.sin((cameraProgress + 38) * 0.018) * 10 + mouse.x * 5.0;
      const lookAtY = terrainElevation(lookAtX, lookAtZ - 180) + 4.0 - mouse.y * 2.0;

      camera.lookAt(lookAtX, lookAtY, lookAtZ);

      // Camera lantern tracks camera position
      cameraLantern.position.copy(camera.position);

      // Animate flowers: Blooming as camera approaches + gentle sway + mouse excitation
      let flowerMatrixNeedsUpdate = false;
      const pAttr = particleGeo.attributes.position;
      const pArr = pAttr.array as Float32Array;

      // CTA particle dispersal burst
      if (isHovered) {
        ctaDisperseBurst = Math.min(ctaDisperseBurst + 0.04, 1.0);
      } else {
        ctaDisperseBurst = Math.max(ctaDisperseBurst - 0.03, 0);
      }

      // Update flowers
      for (let i = 0; i < FLOWER_COUNT; i++) {
        const f = flowers[i];
        const distToCam = Math.hypot(f.baseX - camera.position.x, f.baseZ - camera.position.z);

        // Flower blooms as camera approaches (within 45 units)
        const bloomThreshold = 52;
        let targetScale = f.baseScale * 0.25;
        if (distToCam < bloomThreshold) {
          const bloomFactor = Math.pow(1 - distToCam / bloomThreshold, 1.4);
          targetScale = f.baseScale * (0.25 + bloomFactor * 0.95);
        }

        // Mouse proximity excitation: flowers near cursor glow and tilt slightly
        const distToMouse = Math.hypot(f.baseX - mouse3D.x, f.baseZ - mouse3D.z);
        if (distToMouse < 8.5) {
          targetScale *= 1.25;
        }

        f.currentScale += (targetScale - f.currentScale) * 0.1;

        // Subtle ambient breeze sway
        const sway = Math.sin(elapsedTime * 1.8 + f.baseX * 0.2 + f.baseZ * 0.3) * 0.08;

        dummy.position.set(f.baseX, f.baseY, f.baseZ);
        dummy.rotation.set(f.tiltX + sway, f.rotationY, f.tiltZ + sway);
        dummy.scale.setScalar(f.currentScale);
        dummy.updateMatrix();

        blossomInstanced.setMatrixAt(i, dummy.matrix);
        centerInstanced.setMatrixAt(i, dummy.matrix);
        flowerMatrixNeedsUpdate = true;
      }

      if (flowerMatrixNeedsUpdate) {
        blossomInstanced.instanceMatrix.needsUpdate = true;
        centerInstanced.instanceMatrix.needsUpdate = true;
      }

      // Animate atmospheric particles / spores
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Upward gentle drift with wind turbulence
        pArr[i3] += Math.sin(elapsedTime * 0.5 + pArr[i3 + 1] * 0.2) * 0.02;
        pArr[i3 + 1] += particleVelocities[i3 + 1];
        pArr[i3 + 2] += Math.cos(elapsedTime * 0.4 + pArr[i3] * 0.2) * 0.02;

        // When CTA is hovered, disperse particles radially outward
        if (ctaDisperseBurst > 0) {
          const dx = pArr[i3] - camera.position.x;
          const dy = pArr[i3 + 1] - camera.position.y;
          const dz = pArr[i3 + 2] - (camera.position.z - 15);
          const dist = Math.hypot(dx, dy, dz) + 0.1;
          pArr[i3] += (dx / dist) * ctaDisperseBurst * 0.35;
          pArr[i3 + 1] += (dy / dist) * ctaDisperseBurst * 0.35;
          pArr[i3 + 2] += (dz / dist) * ctaDisperseBurst * 0.35;
        }

        // Recycle particles that drift too high or too far behind camera
        if (pArr[i3 + 1] > 26) {
          pArr[i3 + 1] = 1;
        }
        if (pArr[i3 + 2] > camera.position.z + 10) {
          pArr[i3 + 2] = camera.position.z - 450;
        }
      }
      pAttr.needsUpdate = true;

      // Render frame
      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);

      // Dispose geometries, materials and textures
      terrainGeo.dispose();
      terrainMat.dispose();
      blossomGeo.dispose();
      blossomMat.dispose();
      centerGeo.dispose();
      centerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onLoaded]);

  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-black">
      <div ref={containerRef} className="h-full w-full" />
      {!webGlSupported && (
        <div className="flex h-full w-full items-center justify-center p-8 text-center text-[#f5efe2]/80">
          <p>WebGL is unavailable on this device. Please enable hardware acceleration in your browser settings.</p>
        </div>
      )}
    </div>
  );
};

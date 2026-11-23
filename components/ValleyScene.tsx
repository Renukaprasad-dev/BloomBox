'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ValleySceneProps {
  onLoaded?: () => void;
  isCtaHovered?: boolean;
}

export const ValleyScene: React.FC<ValleySceneProps> = ({
  onLoaded,
  isCtaHovered = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
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
    scene.background = new THREE.Color(0x020306);
    scene.fog = new THREE.FogExp2(0x04060a, 0.018);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 300);
    camera.position.set(0, 3.2, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x1a2233, 1.4);
    scene.add(ambientLight);

    // Central Warm Architectural Focal Spotlight (from archway)
    const portalSpot = new THREE.SpotLight(0xffdfa8, 4.5, 45, Math.PI / 4, 0.5, 1.2);
    portalSpot.position.set(0, 9, -12);
    portalSpot.target.position.set(0, 1.5, 0);
    scene.add(portalSpot);
    scene.add(portalSpot.target);

    // Cool Moonlight grazing the flower banks
    const moonLight = new THREE.DirectionalLight(0x6b8cff, 1.8);
    moonLight.position.set(16, 22, 18);
    scene.add(moonLight);

    // Soft foreground fill for front petals
    const frontFill = new THREE.PointLight(0xffe6d0, 1.2, 25);
    frontFill.position.set(0, 4, 8);
    scene.add(frontFill);

    // 3. Central Architectural Stone Archway & Pathway
    // Dark cobblestone/soil central pathway
    const pathGeo = new THREE.PlaneGeometry(7.5, 50, 20, 40);
    pathGeo.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x08090c,
      roughness: 0.95,
      metalness: 0.05,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.position.set(0, 0.02, -8);
    scene.add(pathMesh);

    // Flanking elevated garden soil beds
    const groundGeo = new THREE.PlaneGeometry(60, 50, 40, 40);
    groundGeo.rotateX(-Math.PI / 2);
    const gPos = groundGeo.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const vx = gPos.getX(i);
      const vz = gPos.getZ(i);
      // Rise into flower banks away from central path (|x| > 3.5)
      const distFromCenter = Math.max(0, Math.abs(vx) - 3.2);
      const elev = Math.min(Math.pow(distFromCenter * 0.45, 1.4) + Math.sin(vz * 0.2) * 0.4, 4.5);
      gPos.setY(i, elev);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x040608,
      roughness: 0.98,
      metalness: 0.02,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, 0, -8);
    scene.add(groundMesh);

    // Classical Architectural Archway in background
    const archGroup = new THREE.Group();
    const columnGeo = new THREE.CylinderGeometry(0.55, 0.65, 12, 16);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c12,
      roughness: 0.85,
      metalness: 0.15,
    });

    const leftCol = new THREE.Mesh(columnGeo, archMat);
    leftCol.position.set(-4.2, 6, -14);
    const rightCol = new THREE.Mesh(columnGeo, archMat);
    rightCol.position.set(4.2, 6, -14);

    const archTopGeo = new THREE.TorusGeometry(4.2, 0.6, 12, 24, Math.PI);
    const archTop = new THREE.Mesh(archTopGeo, archMat);
    archTop.position.set(0, 11.5, -14);
    archTop.rotation.z = 0;

    archGroup.add(leftCol, rightCol, archTop);
    scene.add(archGroup);

    // Golden inner lantern inside archway
    const lanternGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffdfa8 });
    const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
    lanternMesh.position.set(0, 9.8, -13.8);
    scene.add(lanternMesh);

    // 4. Detailed Flower Geometries & Instancing
    const dummy = new THREE.Object3D();

    // ----------------- FLOWER 1: ROSE (Multi-layered cup petals) -----------------
    const roseGroupGeo = new THREE.BufferGeometry();
    // Rose Blossom: 3 overlapping cup petal tiers
    const rosePetalGeo = new THREE.CylinderGeometry(0.38, 0.12, 0.45, 7, 1, true);
    rosePetalGeo.rotateX(0.15);
    const roseMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const ROSE_COUNT = 380;
    const roseMesh = new THREE.InstancedMesh(rosePetalGeo, roseMat, ROSE_COUNT);

    // Rose stem & leaf
    const stemGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.4, 6);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x1b3b22,
      roughness: 0.8,
    });
    const roseStemMesh = new THREE.InstancedMesh(stemGeo, stemMat, ROSE_COUNT);

    const roseColors = [
      new THREE.Color('#d90429'), // Velvety Crimson
      new THREE.Color('#ef233c'), // Bright Rose
      new THREE.Color('#ff4d6d'), // Vivid Pink
      new THREE.Color('#c9184a'), // Magenta Rose
      new THREE.Color('#ff758f'), // Soft Blush
      new THREE.Color('#f5efe2'), // Cream Rose
    ];

    // ----------------- FLOWER 2: TULIP (Upright 3D chalice blossom) -----------------
    const tulipPetalGeo = new THREE.ConeGeometry(0.32, 0.65, 6, 1, true);
    tulipPetalGeo.rotateX(Math.PI);
    const tulipMat = new THREE.MeshStandardMaterial({
      roughness: 0.38,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    const TULIP_COUNT = 340;
    const tulipMesh = new THREE.InstancedMesh(tulipPetalGeo, tulipMat, TULIP_COUNT);
    const tulipStemMesh = new THREE.InstancedMesh(stemGeo, stemMat, TULIP_COUNT);

    const tulipColors = [
      new THREE.Color('#7b2cbf'), // Royal Violet
      new THREE.Color('#9d4edd'), // Purple
      new THREE.Color('#ff5400'), // Sunset Tangerine
      new THREE.Color('#ffb703'), // Golden Tulip
      new THREE.Color('#f72585'), // Hot Pink
      new THREE.Color('#f5efe2'), // Ivory
    ];

    // ----------------- FLOWER 3: DAISY / SUNFLOWER (Disk Center + Radial Petals) -----------------
    // Radial petal star disk
    const daisyShape = new THREE.Shape();
    daisyShape.moveTo(0, 0);
    const dPetals = 12;
    for (let p = 0; p < dPetals * 2; p++) {
      const rad = p % 2 === 0 ? 0.48 : 0.18;
      const ang = (p / (dPetals * 2)) * Math.PI * 2;
      daisyShape.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    daisyShape.closePath();
    const daisyPetalGeo = new THREE.ShapeGeometry(daisyShape, 4);
    daisyPetalGeo.rotateX(-Math.PI / 2);
    const daisyMat = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const DAISY_COUNT = 420;
    const daisyMesh = new THREE.InstancedMesh(daisyPetalGeo, daisyMat, DAISY_COUNT);

    // Raised daisy golden center
    const daisyCenterGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const daisyCenterMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.6,
      emissive: 0x884400,
      emissiveIntensity: 0.4,
    });
    const daisyCenterMesh = new THREE.InstancedMesh(daisyCenterGeo, daisyCenterMat, DAISY_COUNT);
    const daisyStemMesh = new THREE.InstancedMesh(stemGeo, stemMat, DAISY_COUNT);

    const daisyColors = [
      new THREE.Color('#ffffff'), // Pure White
      new THREE.Color('#f5efe2'), // Warm Cream
      new THREE.Color('#ffb703'), // Bright Amber
      new THREE.Color('#ffcad4'), // Baby Pink
      new THREE.Color('#bde0fe'), // Cornflower Cyan
    ];

    // ----------------- FLOWER 4: LAVENDER (Vertical Spikes) -----------------
    const lavenderSpikeGeo = new THREE.CylinderGeometry(0.12, 0.05, 0.95, 6);
    const lavenderMat = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      emissive: 0x3c096c,
      emissiveIntensity: 0.25,
    });
    const LAVENDER_COUNT = 450;
    const lavenderMesh = new THREE.InstancedMesh(lavenderSpikeGeo, lavenderMat, LAVENDER_COUNT);
    const lavenderStemMesh = new THREE.InstancedMesh(stemGeo, stemMat, LAVENDER_COUNT);

    const lavenderColors = [
      new THREE.Color('#7209b7'),
      new THREE.Color('#560bad'),
      new THREE.Color('#3a0ca3'),
      new THREE.Color('#b5179e'),
      new THREE.Color('#c77dff'),
    ];

    // ----------------- FLOWER 5: BROAD LEAVES & FERNS -----------------
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.28, 0.5, 0, 1.1);
    leafShape.quadraticCurveTo(-0.28, 0.5, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 4);
    leafGeo.rotateX(-0.6);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x14341c,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const LEAF_COUNT = 520;
    const leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, LEAF_COUNT);

    // Distribution arrays to store dynamic sway offsets
    interface FlowerInstance {
      x: number;
      y: number;
      z: number;
      scale: number;
      rotX: number;
      rotY: number;
      rotZ: number;
      swaySpeed: number;
    }

    const roseInstances: FlowerInstance[] = [];
    const tulipInstances: FlowerInstance[] = [];
    const daisyInstances: FlowerInstance[] = [];
    const lavenderInstances: FlowerInstance[] = [];

    // Helper to calculate ground elevation at (x, z)
    const getGroundY = (x: number, z: number) => {
      const distFromCenter = Math.max(0, Math.abs(x) - 3.2);
      return Math.min(Math.pow(distFromCenter * 0.45, 1.4) + Math.sin(z * 0.2) * 0.4, 4.5);
    };

    // Helper to distribute a flower type on both flanks
    const populateFlowers = (
      count: number,
      instances: FlowerInstance[],
      mesh: THREE.InstancedMesh,
      stemMesh: THREE.InstancedMesh,
      colors: THREE.Color[],
      heightOffset: number,
      scaleRange: [number, number]
    ) => {
      for (let i = 0; i < count; i++) {
        // Flank either left (negative x) or right (positive x)
        const side = i % 2 === 0 ? 1 : -1;
        const x = side * (3.6 + Math.pow(Math.random(), 1.3) * 16);
        const z = -22 + Math.random() * 32; // -22 to 10 around camera
        const groundY = getGroundY(x, z);
        const y = groundY + heightOffset;

        const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
        const rotY = Math.random() * Math.PI * 2;
        const rotX = (Math.random() - 0.5) * 0.25;
        const rotZ = (Math.random() - 0.5) * 0.25;

        instances.push({
          x,
          y,
          z,
          scale,
          rotX,
          rotY,
          rotZ,
          swaySpeed: 1.2 + Math.random() * 1.5,
        });

        // Set Flower Head Matrix
        dummy.position.set(x, y, z);
        dummy.rotation.set(rotX, rotY, rotZ);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // Color
        const col = colors[Math.floor(Math.random() * colors.length)];
        mesh.setColorAt(i, col);

        // Set Stem Matrix
        dummy.position.set(x, y - 0.65 * scale, z);
        dummy.rotation.set(rotX * 0.5, rotY, rotZ * 0.5);
        dummy.scale.set(scale, scale * 1.1, scale);
        dummy.updateMatrix();
        stemMesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      stemMesh.instanceMatrix.needsUpdate = true;
    };

    // Populate all 4 flower varieties
    populateFlowers(ROSE_COUNT, roseInstances, roseMesh, roseStemMesh, roseColors, 1.25, [1.0, 1.6]);
    populateFlowers(TULIP_COUNT, tulipInstances, tulipMesh, tulipStemMesh, tulipColors, 1.15, [0.9, 1.5]);
    populateFlowers(DAISY_COUNT, daisyInstances, daisyMesh, daisyStemMesh, daisyColors, 0.95, [0.85, 1.45]);
    populateFlowers(LAVENDER_COUNT, lavenderInstances, lavenderMesh, lavenderStemMesh, lavenderColors, 1.05, [0.9, 1.5]);

    // Also set Daisy centers
    for (let i = 0; i < DAISY_COUNT; i++) {
      const d = daisyInstances[i];
      dummy.position.set(d.x, d.y + 0.05 * d.scale, d.z);
      dummy.rotation.set(d.rotX, d.rotY, d.rotZ);
      dummy.scale.setScalar(d.scale * 0.9);
      dummy.updateMatrix();
      daisyCenterMesh.setMatrixAt(i, dummy.matrix);
    }
    daisyCenterMesh.instanceMatrix.needsUpdate = true;

    // Populate Foliage Leaves
    for (let i = 0; i < LEAF_COUNT; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * (3.4 + Math.random() * 18);
      const z = -24 + Math.random() * 34;
      const y = getGroundY(x, z) + 0.35;
      const scale = 0.9 + Math.random() * 1.3;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        -0.4 + (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.4
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      leafMesh.setMatrixAt(i, dummy.matrix);
    }
    leafMesh.instanceMatrix.needsUpdate = true;

    // Add all meshes to scene
    scene.add(roseMesh);
    scene.add(roseStemMesh);
    scene.add(tulipMesh);
    scene.add(tulipStemMesh);
    scene.add(daisyMesh);
    scene.add(daisyCenterMesh);
    scene.add(daisyStemMesh);
    scene.add(lavenderMesh);
    scene.add(lavenderStemMesh);
    scene.add(leafMesh);

    // 5. Supplementary Atmospheric Floating Spores (subtle golden pollen)
    const SPORE_COUNT = 300;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(SPORE_COUNT * 3);
    for (let i = 0; i < SPORE_COUNT; i++) {
      sporePositions[i * 3] = (Math.random() - 0.5) * 28;
      sporePositions[i * 3 + 1] = 0.8 + Math.random() * 8;
      sporePositions[i * 3 + 2] = -20 + Math.random() * 30;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));

    // Particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const g = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(255, 235, 180, 0.95)');
      g.addColorStop(0.4, 'rgba(255, 180, 100, 0.4)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = g;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const pTex = new THREE.CanvasTexture(pCanvas);
    const sporeMat = new THREE.PointsMaterial({
      size: 0.65,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sporePoints = new THREE.Points(sporeGeo, sporeMat);
    scene.add(sporePoints);

    // 6. Mouse Interaction & Camera Control
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollOffset = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollOffset = window.scrollY / maxScroll;
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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    onLoaded?.();

    // 7. Animation Loop with Gentle Flower Swaying
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Camera coordinates: slow drift + mouse tilt + scroll push
      const targetCamZ = 12 - scrollOffset * 8;
      const targetCamY = 3.0 + mouse.y * 0.8 - scrollOffset * 1.5;
      const targetCamX = mouse.x * 2.2;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;

      // Look toward the archway center
      camera.lookAt(mouse.x * 0.8, 2.8 + mouse.y * 0.3, -12);

      // Subtle flower sway animation
      const swayWind = Math.sin(elapsed * 1.5) * 0.06;

      // Animate Roses
      for (let i = 0; i < ROSE_COUNT; i++) {
        const r = roseInstances[i];
        const indSway = Math.sin(elapsed * r.swaySpeed + r.x * 0.5) * 0.08;
        dummy.position.set(r.x, r.y, r.z);
        dummy.rotation.set(r.rotX + indSway, r.rotY, r.rotZ + swayWind);
        dummy.scale.setScalar(r.scale);
        dummy.updateMatrix();
        roseMesh.setMatrixAt(i, dummy.matrix);
      }
      roseMesh.instanceMatrix.needsUpdate = true;

      // Animate Tulips
      for (let i = 0; i < TULIP_COUNT; i++) {
        const t = tulipInstances[i];
        const indSway = Math.sin(elapsed * t.swaySpeed + t.z * 0.4) * 0.07;
        dummy.position.set(t.x, t.y, t.z);
        dummy.rotation.set(t.rotX + indSway, t.rotY, t.rotZ + swayWind * 0.8);
        dummy.scale.setScalar(t.scale);
        dummy.updateMatrix();
        tulipMesh.setMatrixAt(i, dummy.matrix);
      }
      tulipMesh.instanceMatrix.needsUpdate = true;

      // Spore drift
      const sPos = sporeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SPORE_COUNT; i++) {
        const idx = i * 3;
        sPos[idx + 1] += 0.008; // upward drift
        sPos[idx] += Math.sin(elapsed * 0.8 + sPos[idx + 1]) * 0.008;
        if (sPos[idx + 1] > 10) sPos[idx + 1] = 0.8;
      }
      sporeGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      pathGeo.dispose();
      pathMat.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      columnGeo.dispose();
      archTopGeo.dispose();
      archMat.dispose();
      lanternGeo.dispose();
      lanternMat.dispose();

      rosePetalGeo.dispose();
      roseMat.dispose();
      stemGeo.dispose();
      stemMat.dispose();
      tulipPetalGeo.dispose();
      tulipMat.dispose();
      daisyPetalGeo.dispose();
      daisyMat.dispose();
      daisyCenterGeo.dispose();
      daisyCenterMat.dispose();
      lavenderSpikeGeo.dispose();
      lavenderMat.dispose();
      leafGeo.dispose();
      leafMat.dispose();

      sporeGeo.dispose();
      sporeMat.dispose();
      pTex.dispose();
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#12071a] via-[#090b14] to-black">
          <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-8">
            <h3 className="font-antonio text-2xl text-[#f5efe2] mb-2">BloomBox Botanical Sanctuary</h3>
            <p className="text-xs text-[#f5efe2]/70 leading-relaxed">
              Experience optimized for hardware acceleration. Explore our curated collections and order management portal below.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

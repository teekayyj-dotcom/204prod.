import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface SpiralGalleryProps {
  urls: string[];
  className?: string;
}

export function SpiralGallery({ urls, className = "" }: SpiralGalleryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isMounted = true;

    // Get images from project
    let activeUrls = [...urls];
    if (activeUrls.length === 0) { activeUrls = ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"]; }
    while (activeUrls.length > 0 && activeUrls.length < 15) {
      activeUrls = [...activeUrls, ...activeUrls];
    }
    activeUrls = activeUrls.slice(0, 24);
    const numberOfImages = activeUrls.length;


    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let spiralMesh: THREE.Mesh, tiltGroup: THREE.Group, shaderMaterial: THREE.ShaderMaterial;
    let texture: THREE.CanvasTexture;

    let scrollOffset = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotation = { x: 0, z: 0 };
    let baseRotation = { x: -0.18, z: 0.12 };
    let imageRatios: number[] = [];
    
    let inertiaParams = {
      friction: 0.94,
      strength: 0.8,
      maxSpeed: 0.05,
      directionSmoothing: 0.92,
      scrollSensitivity: 0.0008
    };

    const isMobile = window.innerWidth < 1024;
    let config = {
      imageHeight: 7,
      curvature: -0.030,
      gapSize: 0,
      spiralRadius: 3.5,
      spiralTurns: 2.8 + (numberOfImages - 21) * 0.1,
      spiralHeight: 12 + (numberOfImages - 21) * 0.25,
      centerX: isMobile ? 0 : 1.2,
      centerY: 4.38,
      centerZ: 0
    };

    let originalPositions: Array<{ x: number; y: number; z: number; offsetX: number; offsetY: number; offsetZ: number }> = [];
    let targetVelocity = 0;
    let currentVelocity = 0;
    let acceleration = 0;

    let touchStartY = 0;
    let touchLastY = 0;
    let touchVelocity = 0;
    let isTouching = false;

    let isDraggingTouch = false;
    let touchDragStartX = 0;
    let touchDragStartY = 0;

    // Asynchronous master texture creator
    const createMasterTexture = (imageUrls: string[], ratios: number[]): Promise<THREE.CanvasTexture> => {
      return new Promise((resolve) => {
        const textureCanvas = document.createElement('canvas');
        const ctx = textureCanvas.getContext('2d');
        const baseHeight = 500;
        let loaded = 0;
        const loadedImages: HTMLImageElement[] = [];

        imageUrls.forEach((url, idx) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            ratios[idx] = ratio;
            loadedImages[idx] = img;
            loaded++;

            if (loaded === imageUrls.length) {
              const widths = ratios.map(r => r * baseHeight);
              const totalWidth = widths.reduce((sum, w) => sum + w, 0);
              textureCanvas.width = totalWidth;
              textureCanvas.height = baseHeight;
              
              if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                let offsetX = 0;
                imageUrls.forEach((_, i) => {
                  const currentImg = loadedImages[i];
                  if (currentImg) {
                    const currentWidth = ratios[i] * baseHeight;
                    ctx.drawImage(currentImg, offsetX, 0, currentWidth, baseHeight);
                    offsetX += currentWidth;
                  }
                });
              }
              const tex = new THREE.CanvasTexture(textureCanvas);
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.generateMipmaps = false;
              resolve(tex);
            }
          };

          img.onerror = () => {
            // If it failed via proxy, try loading directly
            if (img.src.includes('cors-proxy')) {
              img.src = url;
              return;
            }
            // If it fails again, fallback to placeholder logic
            ratios[idx] = 0.8;
            loaded++;
            if (loaded === imageUrls.length) {
              if (ctx) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                ctx.fillStyle = '#444444';
                ctx.font = '24px sans-serif';
                ctx.fillText('Image Failed', 20, baseHeight / 2);
              }
              const tex = new THREE.CanvasTexture(textureCanvas);
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              resolve(tex);
            }
          };
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
          img.src = `${apiUrl}/media/cors-proxy?url=${encodeURIComponent(url)}`;
        });
      });
    };

    function rebuildGeometry() {
      if (!spiralMesh) return;
      const totalSlots = imageRatios.length;
      const widths = imageRatios.map(r => r * config.imageHeight);
      const totalWidth = widths.reduce((a, b) => a + b, 0);
      const segmentsW = 200 + totalSlots * 20;
      const segmentsH = 24;
      
      const geometry = new THREE.PlaneGeometry(totalWidth, config.imageHeight, segmentsW, segmentsH);
      const positions = geometry.attributes.position;
      const uvs = geometry.attributes.uv;
      
      let origX: number[] = [];
      let origY: number[] = [];
      for (let i = 0; i < positions.count; i++) {
        origX.push(positions.getX(i));
        origY.push(positions.getY(i));
      }
      
      let cumulative = [0];
      for (let i = 0; i < totalSlots; i++) {
        cumulative.push(cumulative[i] + widths[i] / totalWidth);
      }
      
      const imageRatio = 1 - config.gapSize;
      
      for (let i = 0; i < uvs.count; i++) {
        let u = uvs.getX(i);
        u = Math.max(0, Math.min(0.999999, u));
        let found = false;
        for (let j = 0; j < totalSlots; j++) {
          if (u >= cumulative[j] && u < cumulative[j + 1]) {
            let localU = (u - cumulative[j]) / (cumulative[j + 1] - cumulative[j]);
            if (localU > imageRatio) {
              uvs.setX(i, cumulative[j + 1] - 0.001);
            } else {
              let scaledU = localU / imageRatio;
              const edgeMargin = 0.001;
              scaledU = Math.max(edgeMargin, Math.min(1 - edgeMargin, scaledU));
              let newU = cumulative[j] + scaledU * (cumulative[j + 1] - cumulative[j]);
              uvs.setX(i, newU);
            }
            found = true;
            break;
          }
        }
        if (!found) {
          uvs.setX(i, cumulative[totalSlots] - 0.001);
        }
      }
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const nx = x / (totalWidth / 2);
        const curve = config.curvature * 0.4 * (nx * nx - 1);
        positions.setXYZ(i, x, y, -curve);
      }
      
      for (let i = 0; i < positions.count; i++) {
        const x = origX[i];
        const y = origY[i];
        let t = (x + totalWidth / 2) / totalWidth;
        t = Math.max(0, Math.min(1, t));
        
        const angle = t * Math.PI * 2 * config.spiralTurns;
        const radius = config.spiralRadius * (1 - t * 0.12);
        let px = Math.sin(angle) * radius;
        let pz = Math.cos(angle) * radius;
        let py = (t - 0.5) * config.spiralHeight + y * 0.35;
        
        if (!originalPositions[i]) {
          originalPositions[i] = { 
            x: px, y: py, z: pz, 
            offsetX: (Math.random() - 0.5) * 0.001, 
            offsetY: (Math.random() - 0.5) * 0.001, 
            offsetZ: (Math.random() - 0.5) * 0.001 
          };
        }
        
        px += originalPositions[i].offsetX;
        py += originalPositions[i].offsetY;
        pz += originalPositions[i].offsetZ;
        
        positions.setXYZ(i, px, py, pz);
      }
      
      geometry.computeVertexNormals();
      const oldGeo = spiralMesh.geometry;
      spiralMesh.geometry = geometry;
      if (oldGeo) oldGeo.dispose();
      
      if (shaderMaterial) {
        shaderMaterial.uniforms.gap.value = config.gapSize;
      }
    }

    function updateUVOffset() {
      if (!shaderMaterial) return;
      let offset = scrollOffset;
      while (offset >= 1.0) offset -= 1.0;
      while (offset < 0) offset += 1.0;
      shaderMaterial.uniforms.offset.value = offset;
    }

    // Initialize 3D Scene
    async function initThree() {
      scene = new THREE.Scene();
      scene.background = null; // transparent background so CSS color/gradient shines through
      
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 500;
      
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 3.5, 9);
      
      renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
      mainLight.position.set(5, 8, 5);
      scene.add(mainLight);
      
      tiltGroup = new THREE.Group();
      tiltGroup.rotation.x = baseRotation.x;
      tiltGroup.rotation.z = baseRotation.z;
      scene.add(tiltGroup);
      
      texture = await createMasterTexture(activeUrls, imageRatios);
      if (!isMounted) {
        texture.dispose();
        renderer.dispose();
        return;
      }
      
      shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: texture },
          gap: { value: config.gapSize },
          offset: { value: 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform float gap;
          uniform float offset;
          varying vec2 vUv;
          
          void main() {
            float u = vUv.x + offset;
            if (u >= 1.0) u -= 1.0;
            if (u < 0.0) u += 1.0;
            vec4 color = texture2D(map, vec2(u, vUv.y));
            gl_FragColor = color;
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      spiralMesh = new THREE.Mesh(new THREE.BufferGeometry(), shaderMaterial);
      spiralMesh.position.set(config.centerX, config.centerY, config.centerZ);
      spiralMesh.rotation.x = 0.35;
      spiralMesh.rotation.y = 0;
      tiltGroup.add(spiralMesh);
      
      rebuildGeometry();
      
      // Start Animation
      animate();
    }

    // Scroll & Drag handlers
    const handleWheel = (e: WheelEvent) => {
      // Do NOT preventDefault — let GSAP ScrollSmoother handle page scroll normally.
      // Only update the 3D spiral UV offset.
      const rawDelta = e.deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength;
      let maxAccel = 0.015;
      let deltaAccel = rawDelta - acceleration;
      deltaAccel = Math.max(-maxAccel, Math.min(maxAccel, deltaAccel));
      acceleration += deltaAccel;
      acceleration = Math.max(-0.03, Math.min(0.03, acceleration));
      
      let targetDelta = acceleration;
      targetVelocity = targetVelocity * inertiaParams.directionSmoothing + targetDelta * (1 - inertiaParams.directionSmoothing);
      targetVelocity = Math.max(-inertiaParams.maxSpeed, Math.min(inertiaParams.maxSpeed, targetVelocity));
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - previousMousePosition.x;
      const dy = e.clientY - previousMousePosition.y;
      dragRotation.z += dx * 0.002;
      dragRotation.x -= dy * 0.002;
      dragRotation.x = Math.max(-0.35, Math.min(0.35, dragRotation.x));
      dragRotation.z = Math.max(-0.35, Math.min(0.35, dragRotation.z));
      if (tiltGroup) {
        tiltGroup.rotation.x = baseRotation.x + dragRotation.x;
        tiltGroup.rotation.z = baseRotation.z + dragRotation.z;
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isTouching = true;
        touchStartY = e.touches[0].clientY;
        touchLastY = touchStartY;
        touchVelocity = 0;
        container.style.cursor = 'grabbing';
      } else if (e.touches.length === 2) {
        isDraggingTouch = true;
        touchDragStartX = e.touches[1].clientX;
        touchDragStartY = e.touches[1].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTouching && e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchLastY;
        const rawVelocity = deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength * 0.5;
        touchVelocity = touchVelocity * 0.7 + rawVelocity * 0.3;
        
        let deltaScroll = deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength * 0.8;
        scrollOffset += deltaScroll;
        updateUVOffset();
        touchLastY = currentY;
      } else if (isDraggingTouch && e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[1].clientX - touchDragStartX;
        const dy = e.touches[1].clientY - touchDragStartY;
        dragRotation.z += dx * 0.003;
        dragRotation.x -= dy * 0.003;
        dragRotation.x = Math.max(-0.35, Math.min(0.35, dragRotation.x));
        dragRotation.z = Math.max(-0.35, Math.min(0.35, dragRotation.z));
        if (tiltGroup) {
          tiltGroup.rotation.x = baseRotation.x + dragRotation.x;
          tiltGroup.rotation.z = baseRotation.z + dragRotation.z;
        }
        touchDragStartX = e.touches[1].clientX;
        touchDragStartY = e.touches[1].clientY;
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
      isDraggingTouch = false;
      container.style.cursor = 'grab';
      if (Math.abs(touchVelocity) > 0.001) {
        targetVelocity = touchVelocity * 1.2;
        targetVelocity = Math.max(-inertiaParams.maxSpeed * 1.5, Math.min(inertiaParams.maxSpeed * 1.5, targetVelocity));
      }
      touchVelocity = 0;
    };

    // Attach listeners scoped to the element
    // Use passive: true for wheel so the browser (and GSAP ScrollSmoother) can scroll freely
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // Resize Handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (renderer && camera) {
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(container);

    let animationFrameId: number;
    function updateTouchInertia() {
      if (!isTouching) {
        touchVelocity *= 0.95;
        if (Math.abs(touchVelocity) > 0.0001) {
          scrollOffset += touchVelocity * 0.5;
          updateUVOffset();
        } else {
          touchVelocity = 0;
        }
      }
    }

    function updateInertia() {
      targetVelocity *= inertiaParams.friction;
      currentVelocity = currentVelocity * 0.85 + targetVelocity * 0.15;
      
      if (Math.abs(currentVelocity) > 0.0001) {
        scrollOffset += currentVelocity;
        updateUVOffset();
      } else {
        currentVelocity = 0;
        targetVelocity = 0;
        acceleration = 0;
      }
      updateTouchInertia();
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      updateInertia();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    // Launch Three.js
    initThree();

    // Clean up resources on unmount or dependency change
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      resizeObserver.disconnect();

      if (texture) texture.dispose();
      if (spiralMesh && spiralMesh.geometry) spiralMesh.geometry.dispose();
      if (shaderMaterial) shaderMaterial.dispose();
      if (renderer) renderer.dispose();
    };
  }, [urls]);


  return (
    <motion.div 
      ref={containerRef}
      className={`relative min-h-[500px] lg:min-h-[600px] bg-zinc-950/20 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center cursor-grab active:cursor-grabbing group shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] ${className}`}
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full outline-none" />
      
      {/* Subtle overlay hint */}
      <div className="absolute bottom-4 right-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-[9px] tracking-widest uppercase text-white/50 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-sans">
        <div className="w-1.5 h-1.5 rounded-full bg-[#EB5B00] animate-pulse" />
        Interactive 3D Spiral
      </div>
    </motion.div>
  );
}

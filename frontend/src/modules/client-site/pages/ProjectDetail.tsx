// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import * as THREE from 'three';

const shot = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const fallbackProjects = [
  {
    id: "midnight-textile",
    number: "01",
    title: "Midnight Textile",
    client: "Mira Atelier",
    year: "2025",
    category: "Fashion Film",
    role: "Director / DP",
    image: shot("photo-1516321318423-f06f85e504b3"),
    video: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c93159318eca11d331cfb51138ec3783&profile_id=139&oauth2_token_id=57447761",
    description: "A sharply lit studio piece balancing tactile wardrobe detail with humid city-night energy."
  },
  {
    id: "neon-harvest",
    number: "02",
    title: "Neon Harvest",
    client: "Field Theory",
    year: "2024",
    category: "Brand Film",
    role: "Creative Director",
    image: shot("photo-1518005020951-eccb494ad742"),
    video: "https://player.vimeo.com/external/435674703.sd.mp4?s=7fdf70a2569e2c6599db733575971485600ff0a9&profile_id=165&oauth2_token_id=57447761",
    description: "A saturated campaign world built around ritualized product framing and sculpted motion."
  },
  {
    id: "soft-machinery",
    number: "03",
    title: "Soft Machinery",
    client: "Nami Objects",
    year: "2024",
    category: "Digital Campaign",
    role: "Lead Editor / Colorist",
    image: shot("photo-1524758631624-e2822e304c36"),
    video: "https://player.vimeo.com/external/340338356.sd.mp4?s=cfd3b5b63488820c85c2763c8be0a5fa70cb9e49&profile_id=165&oauth2_token_id=57447761",
    description: "A graphic product narrative using modular sets, hard edges, and close texture study."
  }
];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const scrollY = useMotionValue(0);
  const bgY = useTransform(scrollY, [0, 1000], [0, -200]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0.1]);
  const textOpacity = useTransform(scrollY, [0, 600], [1, 0.95]);
  const titleY = useTransform(scrollY, [0, 1000], [0, -1000]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !project) return;

    let isMounted = true;

    // Get images from project
    let urls = (project.behindTheScenes || []).map((img: any) => img.url);
    if (urls.length === 0) {
      urls = [project.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"];
    }
    // Duplicate images to fill the spiral beautifully (at least 15 images)
    while (urls.length > 0 && urls.length < 15) {
      urls = [...urls, ...urls];
    }
    urls = urls.slice(0, 24); // Cap at 24 images

    const numberOfImages = urls.length;
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
            ratios[idx] = 0.8;
            loaded++;
            if (loaded === imageUrls.length) {
              const tex = new THREE.CanvasTexture(textureCanvas);
              resolve(tex);
            }
          };
          img.src = url;
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
      
      texture = await createMasterTexture(urls, imageRatios);
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
  }, [project, project?.behindTheScenes, project?.image]);

  useEffect(() => {
    const scrollRoot = document.querySelector('[data-client-scroll-root="true"]');

    const handleScroll = () => {
      scrollY.set(scrollRoot ? scrollRoot.scrollTop : window.scrollY);
    };

    const target = scrollRoot || window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [scrollY]);

  useEffect(() => {
    const scrollRoot = document.querySelector('[data-client-scroll-root="true"]');
    if (scrollRoot) {
      scrollRoot.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [id]);

  useEffect(() => {
    const getProject = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/projects/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProject({
            id: data.slug,
            title: data.title,
            client: data.client || "Self-Initiated",
            year: String(data.year),
            category: data.format || "Production",
            role: data.format || "Creative Production",
            description: data.summary || "A creative production showcase.",
            image: data.cover_media?.url || data.cover_image || shot("photo-1516321318423-f06f85e504b3"),
            video: data.video_url || data.videoUrl || null,
            behindTheScenes: data.gallery || []
          });
        } else {
          // Fallback to local mock data
          const local = fallbackProjects.find(p => p.id === id);
          setProject(local ? { ...local, behindTheScenes: [] } : null);
        }
      } catch (err) {
        console.error("Failed to fetch project detail, using fallback list:", err);
        const local = fallbackProjects.find(p => p.id === id);
        setProject(local ? { ...local, behindTheScenes: [] } : null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getProject();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#EB5B00]" size={32} />
          <span className="text-white/40 text-sm font-medium">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center px-6">
          <AlertCircle className="mx-auto text-white/20 mb-4" size={48} />
          <h2 className="text-3xl font-syne font-bold uppercase tracking-tight mb-4">Project Not Found</h2>
          <button onClick={() => navigate('/works')} className="text-[#EB5B00] hover:text-white transition-colors flex items-center gap-2 justify-center mx-auto text-sm font-semibold uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Works
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button Overlay */}
      <button 
        onClick={() => navigate('/works')} 
        className="fixed top-24 left-6 md:left-12 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#EB5B00] hover:border-[#EB5B00] hover:text-black transition-all group"
        aria-label="Back to Works"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Full Height Video / Hero Section */}
      <section className="sticky top-0 w-full h-[100svh] bg-black overflow-hidden z-0">
        <motion.div 
          className="absolute inset-0"
          style={{ y: bgY, opacity: heroOpacity }}
        >
          {(() => {
            const videoUrl = project.video || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
            const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
            const vmMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
            const embedUrl = ytMatch
              ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1`
              : vmMatch
                ? `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1&controls=0&background=1`
                : null;
            
            if (embedUrl) {
              return (
                <iframe
                  src={embedUrl}
                  className="w-full h-full object-cover scale-105 pointer-events-none opacity-60"
                  style={{ border: "none" }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={project.title}
                />
              );
            } else {
              return (
                <video 
                  src={videoUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-60" 
                  poster={project.image}
                />
              );
            }
          })()}
        </motion.div>
        
        {/* Title Overlay */}
        <motion.div 
          className="absolute inset-0 flex flex-col justify-end p-6 md:px-12 pb-8 md:pb-12 max-w-7xl mx-auto w-full z-10"
          style={{ y: titleY, opacity: textOpacity }}
        >
          <motion.div 
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-[#EB5B00] font-sans text-sm md:text-base font-bold uppercase tracking-widest">
              {project.client}
            </span>
            <h1 className="text-white font-syne font-black text-4xl md:text-6xl lg:text-8xl uppercase tracking-tight leading-none m-0">
              {project.title}
            </h1>
          </motion.div>
        </motion.div>
      </section>

      {/* Project Info Section */}
      <section className="relative z-10 bg-black pt-8 md:pt-12 pb-24 md:pb-32 px-6 md:px-12 w-full border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left Column: Summary Table */}
          <motion.div 
            className="lg:col-span-4 flex flex-col font-sans"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col pb-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Client</span>
              <span className="text-white text-lg font-medium">{project.client}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Category</span>
              <span className="text-white text-lg font-medium">{project.category}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Year</span>
              <span className="text-white text-lg font-medium">{project.year}</span>
            </div>
            <div className="flex flex-col py-6 border-b border-white/10">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Role</span>
              <span className="text-white text-lg font-medium">{project.role}</span>
            </div>
          </motion.div>

          {/* Right Column: Project Description */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h2 className="text-white font-syne font-bold text-3xl md:text-4xl uppercase tracking-tight mb-8">
              Project Description
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-white/70">
              <p className="text-xl md:text-2xl leading-relaxed mb-8 text-white/90 font-light">
                {project.description}
              </p>
              <p className="mb-6 leading-relaxed">
                For the {project.title} campaign, our objective was to redefine the visual language of {project.client}'s brand, pushing boundaries in {project.category.toLowerCase()}. We developed a comprehensive end-to-end strategy spanning concept art to final execution.
              </p>
              <p className="leading-relaxed">
                The resulting suite of assets was deployed globally across multiple digital and physical touchpoints. Our work on {project.role.toLowerCase()} required a highly bespoke approach, leading to a truly distinguished output that set a new benchmark in the industry.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Behind the Scenes section with Left Info Panel and Right 3D Spiral Canvas */}
      <section className="relative z-10 bg-black border-t border-white/5 py-24 px-6 md:px-12 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Behind the Scenes info */}
          <motion.div 
            className="lg:col-span-4 flex flex-col justify-between bg-zinc-950/40 border border-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 z-10 min-h-[400px] lg:min-h-0"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-[#EB5B00] font-semibold mb-2">Production Study</span>
              <h2 className="text-3xl font-syne font-black uppercase tracking-tight text-white mb-1">Behind The Scenes</h2>
              <p className="text-xs font-sans text-white/40 tracking-wider uppercase">Visual Breakdown & Concept Art</p>
              
              <p className="text-sm leading-relaxed text-white/70 font-light mt-6 mb-8">
                An interactive exploration of cinematic lighting, material styling, and modular set designs. 
                Use your <strong className="text-white font-medium font-sans">mouse wheel</strong> or <strong className="text-white font-medium font-sans">swipe vertically</strong> on the spiral to navigate through the assets.
              </p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 font-sans">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 tracking-widest uppercase">Client</span>
                  <span className="text-xs font-medium text-white/90">{project.client}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 tracking-widest uppercase">Category</span>
                  <span className="text-xs font-medium text-white/90">{project.category}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 tracking-widest uppercase">Format</span>
                  <span className="text-xs font-medium text-white/90">Cinematic Film Stills</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 tracking-widest uppercase">Aspect Ratio</span>
                  <span className="text-xs font-medium text-white/90">2.39:1 Anamorphic</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-[10px] tracking-wider text-white/40 uppercase font-medium bg-white/5 py-2 px-3 rounded border border-white/5 self-start font-sans">
              <span className="text-xs">🖱️</span> Drag anywhere on the spiral to rotate & tilt 3D space
            </div>
          </motion.div>
          
          {/* Right panel: Three.js WebGL canvas */}
          <motion.div 
            ref={containerRef}
            className="lg:col-span-8 relative min-h-[500px] lg:min-h-[600px] bg-zinc-950/20 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center cursor-grab active:cursor-grabbing group shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
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
          
        </div>
      </section>
    </div>
  );
}

// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { Square, List, LayoutGrid, Search, ChevronDown } from "lucide-react";

function FluidHero({ title, children }) {
    const containerRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const appInstanceRef = useRef(null);
    const [threeLoaded, setThreeLoaded] = useState(!!window.THREE);

    useEffect(() => {
        if (window.THREE) {
            setThreeLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.async = true;
        script.onload = () => {
            setThreeLoaded(true);
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!threeLoaded || !canvasContainerRef.current) return;
        const THREE = window.THREE;
        if (!THREE) return;

        const container = containerRef.current;
        const canvasContainer = canvasContainerRef.current;

        let rect = container.getBoundingClientRect();
        let width = canvasContainer.clientWidth || rect.width || 800;
        let height = canvasContainer.clientHeight || rect.height || 360;

        class TouchTexture {
            constructor() {
                this.size = 64;
                this.width = this.height = this.size;
                this.maxAge = 64;
                this.radius = 0.25 * this.size;
                this.speed = 1 / this.maxAge;
                this.trail = [];
                this.last = null;
                this.initTexture();
            }

            initTexture() {
                this.canvas = document.createElement("canvas");
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.ctx = this.canvas.getContext("2d");
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.texture = new THREE.Texture(this.canvas);
            }

            update() {
                this.clear();
                let speed = this.speed;
                for (let i = this.trail.length - 1; i >= 0; i--) {
                    const point = this.trail[i];
                    let f = point.force * speed * (1 - point.age / this.maxAge);
                    point.x += point.vx * f;
                    point.y += point.vy * f;
                    point.age++;
                    if (point.age > this.maxAge) {
                        this.trail.splice(i, 1);
                    } else {
                        this.drawPoint(point);
                    }
                }
                this.texture.needsUpdate = true;
            }

            clear() {
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            addTouch(point) {
                let force = 0;
                let vx = 0;
                let vy = 0;
                const last = this.last;
                if (last) {
                    const dx = point.x - last.x;
                    const dy = point.y - last.y;
                    if (dx === 0 && dy === 0) return;
                    const dd = dx * dx + dy * dy;
                    let d = Math.sqrt(dd);
                    vx = dx / d;
                    vy = dy / d;
                    force = Math.min(dd * 20000, 2.0);
                }
                this.last = { x: point.x, y: point.y };
                this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
            }

            drawPoint(point) {
                const pos = {
                    x: point.x * this.width,
                    y: (1 - point.y) * this.height
                };

                let intensity = 1;
                if (point.age < this.maxAge * 0.3) {
                    intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
                } else {
                    const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
                    intensity = -t * (t - 2);
                }
                intensity *= point.force;

                const radius = this.radius;
                let color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
                let offset = this.size * 5;
                this.ctx.shadowOffsetX = offset;
                this.ctx.shadowOffsetY = offset;
                this.ctx.shadowBlur = radius * 1;
                this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

                this.ctx.beginPath();
                this.ctx.fillStyle = "rgba(255,0,0,1)";
                this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        class GradientBackground {
            constructor(sceneManager) {
                this.sceneManager = sceneManager;
                this.mesh = null;
                this.uniforms = {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(width, height) },
                    uColor1: { value: new THREE.Vector3(0.894, 0.212, 0.212) }, // Red E43636
                    uColor2: { value: new THREE.Vector3(0.0, 0.0, 0.0) },       // Black
                    uColor3: { value: new THREE.Vector3(0.922, 0.357, 0.0) },    // Orange EB5B00
                    uColor4: { value: new THREE.Vector3(0.894, 0.212, 0.212) },
                    uColor5: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
                    uColor6: { value: new THREE.Vector3(0.922, 0.357, 0.0) },
                    uSpeed: { value: 1.5 },
                    uIntensity: { value: 1.8 },
                    uTouchTexture: { value: null },
                    uGrainIntensity: { value: 0.08 },
                    uZoom: { value: 1.0 },
                    uDarkNavy: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
                    uGradientSize: { value: 0.45 },
                    uGradientCount: { value: 12.0 },
                    uColor1Weight: { value: 1.2 },
                    uColor2Weight: { value: 1.0 }
                };
            }

            init() {
                const viewSize = this.sceneManager.getViewSize();
                const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

                const material = new THREE.ShaderMaterial({
                    uniforms: this.uniforms,
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vec3 pos = position.xyz;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
                            vUv = uv;
                        }
                    `,
                    fragmentShader: `
                        uniform float uTime;
                        uniform vec2 uResolution;
                        uniform vec3 uColor1;
                        uniform vec3 uColor2;
                        uniform vec3 uColor3;
                        uniform vec3 uColor4;
                        uniform vec3 uColor5;
                        uniform vec3 uColor6;
                        uniform float uSpeed;
                        uniform float uIntensity;
                        uniform sampler2D uTouchTexture;
                        uniform float uGrainIntensity;
                        uniform float uZoom;
                        uniform vec3 uDarkNavy;
                        uniform float uGradientSize;
                        uniform float uGradientCount;
                        uniform float uColor1Weight;
                        uniform float uColor2Weight;
                        
                        varying vec2 vUv;
                        
                        #define PI 3.14159265359
                        
                        float grain(vec2 uv, float time) {
                            vec2 grainUv = uv * uResolution * 0.5;
                            float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
                            return grainValue * 2.0 - 1.0;
                        }
                        
                        vec3 getGradientColor(vec2 uv, float time) {
                            float gradientRadius = uGradientSize;
                            
                            vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
                            vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
                            vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
                            vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
                            vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
                            vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);
                            
                            vec2 center7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
                            vec2 center8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
                            vec2 center9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
                            vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
                            vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
                            vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);
                            
                            float dist1 = length(uv - center1);
                            float dist2 = length(uv - center2);
                            float dist3 = length(uv - center3);
                            float dist4 = length(uv - center4);
                            float dist5 = length(uv - center5);
                            float dist6 = length(uv - center6);
                            float dist7 = length(uv - center7);
                            float dist8 = length(uv - center8);
                            float dist9 = length(uv - center9);
                            float dist10 = length(uv - center10);
                            float dist11 = length(uv - center11);
                            float dist12 = length(uv - center12);
                            
                            float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
                            float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
                            float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
                            float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
                            float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
                            float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
                            float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
                            float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
                            float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
                            float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
                            float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
                            float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);
                            
                            vec2 rotatedUv1 = uv - 0.5;
                            float angle1 = time * uSpeed * 0.15;
                            rotatedUv1 = vec2(
                                rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
                                rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
                            );
                            rotatedUv1 += 0.5;
                            
                            vec2 rotatedUv2 = uv - 0.5;
                            float angle2 = -time * uSpeed * 0.12;
                            rotatedUv2 = vec2(
                                rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
                                rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
                            );
                            rotatedUv2 += 0.5;
                            
                            float radialGradient1 = length(rotatedUv1 - 0.5);
                            float radialGradient2 = length(rotatedUv2 - 0.5);
                            float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
                            float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);
                            
                            vec3 color = vec3(0.0);
                            color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
                            color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
                            color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
                            color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
                            color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
                            color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;
                            
                            if (uGradientCount > 6.0) {
                                color += uColor1 * influence7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
                                color += uColor2 * influence8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
                                color += uColor3 * influence9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
                                color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
                            }
                            if (uGradientCount > 10.0) {
                                color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
                                color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
                            }
                            
                            color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
                            color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;
                            
                            color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
                            
                            float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                            color = mix(vec3(luminance), color, 1.35);
                            
                            color = pow(color, vec3(0.92)); 
                            
                            float brightness1 = length(color);
                            float mixFactor1 = max(brightness1 * 1.2, 0.15); 
                            color = mix(uDarkNavy, color, mixFactor1);
                            
                            float maxBrightness = 1.0;
                            float brightness = length(color);
                            if (brightness > maxBrightness) {
                                color = color * (maxBrightness / brightness);
                            }
                            
                            return color;
                        }
                        
                        void main() {
                            vec2 uv = vUv;
                            
                            vec4 touchTex = texture2D(uTouchTexture, uv);
                            float vx = -(touchTex.r * 2.0 - 1.0);
                            float vy = -(touchTex.g * 2.0 - 1.0);
                            float intensity = touchTex.b;
                            
                            uv.x += vx * 0.8 * intensity;
                            uv.y += vy * 0.8 * intensity;
                            
                            vec2 center = vec2(0.5);
                            float dist = length(uv - center);
                            float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
                            float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
                            uv += vec2(ripple + wave);
                            
                            vec3 color = getGradientColor(uv, uTime);
                            
                            float grainValue = grain(uv, uTime);
                            color += grainValue * uGrainIntensity;
                            
                            float timeShift = uTime * 0.5;
                            color.r += sin(timeShift) * 0.02;
                            color.g += cos(timeShift * 1.4) * 0.02;
                            color.b += sin(timeShift * 1.2) * 0.02;
                            
                            float brightness2 = length(color);
                            float mixFactor2 = max(brightness2 * 1.2, 0.15); 
                            color = mix(uDarkNavy, color, mixFactor2);
                            
                            color = clamp(color, vec3(0.0), vec3(1.0));
                            
                            float maxBrightness = 1.0;
                            float brightness = length(color);
                            if (brightness > maxBrightness) {
                                color = color * (maxBrightness / brightness);
                            }
                            
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `
                });

                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.position.z = 0;
                this.sceneManager.scene.add(this.mesh);
            }

            update(delta) {
                if (this.uniforms.uTime) {
                    this.uniforms.uTime.value += delta;
                }
            }

            onResize(w, h) {
                const viewSize = this.sceneManager.getViewSize();
                if (this.mesh) {
                    this.mesh.geometry.dispose();
                    this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
                }
                if (this.uniforms.uResolution) {
                    this.uniforms.uResolution.value.set(w, h);
                }
            }
        }

        class App {
            constructor(canvasContainer, w, h) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: false
                });
                this.renderer.setSize(w, h);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                canvasContainer.appendChild(this.renderer.domElement);
                this.renderer.domElement.style.width = "100%";
                this.renderer.domElement.style.height = "100%";

                this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
                this.camera.position.z = 50;
                this.scene = new THREE.Scene();
                this.clock = new THREE.Clock();

                this.touchTexture = new TouchTexture();
                this.gradientBackground = new GradientBackground(this);
                this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;

                this.colorSchemes = {
                    9: {
                        color1: new THREE.Vector3(0.753, 0.382, 0.348), // C06158 - Desaturated Terracotta Red
                        color2: new THREE.Vector3(0.965, 0.937, 0.824), // F6EFD2 - Cream
                        color3: new THREE.Vector3(0.922, 0.357, 0.0)    // EB5B00 - Orange
                    }
                };

                this.init();
            }

            setColorScheme(scheme) {
                const colors = this.colorSchemes[scheme];
                const uniforms = this.gradientBackground.uniforms;

                uniforms.uColor1.value.copy(colors.color1);
                uniforms.uColor2.value.copy(colors.color2);
                uniforms.uColor3.value.copy(colors.color3);
                uniforms.uColor4.value.copy(colors.color1);
                uniforms.uColor5.value.copy(colors.color2);
                uniforms.uColor6.value.copy(colors.color3);

                this.scene.background = new THREE.Color(0xF6EFD2);
                uniforms.uDarkNavy.value.set(0.965, 0.937, 0.824);
                uniforms.uGradientSize.value = 0.45;
                uniforms.uGradientCount.value = 12.0;
                uniforms.uSpeed.value = 0.7;
                uniforms.uColor1Weight.value = 1.2;
                uniforms.uColor2Weight.value = 1.0;
            }

            init() {
                this.gradientBackground.init();
                this.setColorScheme(9);
                this.tick();
            }

            onMouseMoveRelative(x, y) {
                this.mouse = { x, y };
                this.touchTexture.addTouch(this.mouse);
            }

            getViewSize() {
                const fovInRadians = (this.camera.fov * Math.PI) / 180;
                const height = Math.abs(this.camera.position.z * Math.tan(fovInRadians / 2) * 2);
                return { width: height * this.camera.aspect, height };
            }

            update(delta) {
                this.touchTexture.update();
                this.gradientBackground.update(delta);
            }

            render() {
                const delta = this.clock.getDelta();
                const clampedDelta = Math.min(delta, 0.1);
                this.renderer.render(this.scene, this.camera);
                this.update(clampedDelta);
            }

            tick() {
                if (this.destroyed) return;
                this.render();
                this.animationFrameId = requestAnimationFrame(() => this.tick());
            }

            onResize(w, h) {
                this.camera.aspect = w / h;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(w, h);
                this.gradientBackground.onResize(w, h);
            }

            destroy() {
                this.destroyed = true;
                cancelAnimationFrame(this.animationFrameId);
                if (this.renderer) {
                    this.renderer.dispose();
                    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
                        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
                    }
                }
            }
        }

        const app = new App(canvasContainer, width, height);
        appInstanceRef.current = app;

        const handleResize = () => {
            if (!containerRef.current || !appInstanceRef.current) return;
            const r = containerRef.current.getBoundingClientRect();
            appInstanceRef.current.onResize(r.width, r.height);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (appInstanceRef.current) {
                appInstanceRef.current.destroy();
            }
        };
    }, [threeLoaded]);

    const handleMouseMove = (e) => {
        if (!appInstanceRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        appInstanceRef.current.onMouseMoveRelative(x, y);
    };

    const handleTouchMove = (e) => {
        if (!appInstanceRef.current || !containerRef.current || !e.touches[0]) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.touches[0].clientX - rect.left) / rect.width;
        const y = 1.0 - (e.touches[0].clientY - rect.top) / rect.height;
        appInstanceRef.current.onMouseMoveRelative(x, y);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative h-[80vh] overflow-hidden flex flex-col justify-center items-center p-8 md:p-12 mb-12 select-none bg-black group cursor-crosshair"
        >
            {/* Canvas Container */}
            <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 via-10% to-transparent z-10 pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-20 w-full flex flex-col items-center justify-center text-center gap-2 pointer-events-auto">
                <div className="w-full text-center">
                    <h1 className="font-black text-white text-[56px] md:text-[80px] tracking-tight uppercase leading-none mb-1 drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)] font-syne">
                        {title}
                    </h1>
                    {children}
                </div>
            </div>
        </div>
    );
}

const shot = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

function FilterDropdown({ 
  label, 
  options, 
  selected, 
  toggleOption, 
  isOpen, 
  setIsOpen 
}) {
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider border rounded transition-all select-none ${selected.length > 0 ? 'border-[#EB5B00] text-[#EB5B00] bg-[#EB5B00]/5' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'}`}
      >
        <span>{label} {selected.length > 0 && `(${selected.length})`}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-white/10 rounded-md shadow-2xl z-40 max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <label 
                key={opt} 
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-white/70 hover:text-white cursor-pointer select-none"
              >
                <input 
                  type="checkbox" 
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="rounded border-white/10 bg-transparent text-[#EB5B00] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ImageWithFallback({ src, alt, ...props }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-white/5 min-h-[200px]">
        <span className="text-white/20 font-extrabold italic tracking-[-0.06em] uppercase text-xl" style={{ fontFamily: "'Monument Extended', sans-serif" }}>
          204PROD.
        </span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setError(true)} 
      {...props} 
    />
  );
}

export function WorksPage() {
  const [view, setView] = useState('single');
  const [hoveredProject, setHoveredProject] = useState(null);

  // Filter State
  const [activeFilter, setActiveFilter] = useState(null);
  
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const handleMouseMove = (e) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  const toggleFilter = (value, selectedState, setFn) => {
    setFn(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/projects");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const mapped = data.map((proj, idx) => ({
              id: proj.slug,
              number: String(idx + 1).padStart(2, '0'),
              title: proj.title,
              client: proj.client || "Self-Initiated",
              year: String(proj.year),
              services: proj.format || "Production",
              category: proj.format || "Production",
              image: proj.cover_media?.url || proj.cover_image || shot("photo-1516321318423-f06f85e504b3"),
              description: proj.summary || "A creative production showcase."
            }));
            setProjects(mapped);
          } else {
            useFallbackMock();
          }
        } else {
          useFallbackMock();
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
        useFallbackMock();
      } finally {
        setLoading(false);
      }
    };

    const useFallbackMock = () => {
      const fallbackList = [
        {
          id: "midnight-textile",
          number: "01",
          title: "Midnight Textile",
          client: "Mira Atelier",
          year: "2025",
          services: "Fashion Film",
          category: "Fashion Film",
          image: shot("photo-1516321318423-f06f85e504b3"),
          description: "A sharply lit studio piece balancing tactile wardrobe detail with humid city-night energy."
        },
        {
          id: "neon-harvest",
          number: "02",
          title: "Neon Harvest",
          client: "Field Theory",
          year: "2024",
          services: "Brand Film",
          category: "Brand Film",
          image: shot("photo-1518005020951-eccb494ad742"),
          description: "A saturated campaign world built around ritualized product framing and sculpted motion."
        },
        {
          id: "soft-machinery",
          number: "03",
          title: "Soft Machinery",
          client: "Nami Objects",
          year: "2024",
          services: "Digital Campaign",
          category: "Digital Campaign",
          image: shot("photo-1524758631624-e2822e304c36"),
          description: "A graphic product narrative using modular sets, hard edges, and close texture study."
        }
      ];
      setProjects(fallbackList);
    };

    fetchProjects();
  }, []);

  const serviceOptions = Array.from(new Set(projects.map(p => p.services).filter(Boolean)));
  const clientOptions = Array.from(new Set(projects.map(p => p.client).filter(Boolean)));
  const yearOptions = Array.from(new Set(projects.map(p => String(p.year)).filter(Boolean))).sort((a, b) => b.localeCompare(a));

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client && project.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.services && project.services.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesService = selectedServices.length === 0 || selectedServices.includes(project.services);
    const matchesClient = selectedClients.length === 0 || selectedClients.includes(project.client);
    const matchesYear = selectedYears.length === 0 || selectedYears.includes(String(project.year));

    return matchesSearch && matchesService && matchesClient && matchesYear;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <main className="home-shell">
      <FluidHero title="Portfolio">
        <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "15px", fontWeight: 400 }} className="mt-2">
          Explore our latest projects and creative endeavors.
        </p>
      </FluidHero>

      <section className="mt-16 w-[80%] mx-auto text-white">
        {/* Header & View Controls */}
        <div className="flex flex-col gap-8 mb-16">
          {/* Portfolio Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-y border-white/10 py-4">
            {/* Left: View Controls */}
            <div className="flex items-center gap-4">
              <span className="text-white/40 font-sans text-xs font-semibold uppercase tracking-widest mr-2">
                View
              </span>
              <button 
                onClick={() => setView('single')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'single' ? 'text-[#EB5B00] bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Single View"
              >
                <Square size={18} />
              </button>
              <button 
                onClick={() => setView('row')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'row' ? 'text-[#EB5B00] bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Row View"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setView('gallery')} 
                className={`p-2 transition-colors duration-300 rounded-md hover:bg-white/5 ${view === 'gallery' ? 'text-[#EB5B00] bg-white/[0.02]' : 'text-white/30 hover:text-white'}`}
                aria-label="Gallery View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Right: Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Compact Search Input */}
              <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-white/10 focus-within:border-white/30 focus-within:bg-zinc-900 transition-all group">
                <Search size={16} className="text-white/40 group-focus-within:text-white/70" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-32 focus:w-48 transition-all"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <FilterDropdown 
                  label="Service"
                  options={serviceOptions}
                  selected={selectedServices}
                  toggleOption={(opt) => toggleFilter(opt, selectedServices, setSelectedServices)}
                  isOpen={activeFilter === 'service'}
                  setIsOpen={(open) => setActiveFilter(open ? 'service' : null)}
                />
                
                <FilterDropdown 
                  label="Client"
                  options={clientOptions}
                  selected={selectedClients}
                  toggleOption={(opt) => toggleFilter(opt, selectedClients, setSelectedClients)}
                  isOpen={activeFilter === 'client'}
                  setIsOpen={(open) => setActiveFilter(open ? 'client' : null)}
                />

                <FilterDropdown 
                  label="Year"
                  options={yearOptions}
                  selected={selectedYears}
                  toggleOption={(opt) => toggleFilter(opt, selectedYears, setSelectedYears)}
                  isOpen={activeFilter === 'year'}
                  setIsOpen={(open) => setActiveFilter(open ? 'year' : null)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#EB5B00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
            <p className="text-white/40 text-lg font-light">No projects match the selected criteria.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              {/* SINGLE VIEW */}
              {view === 'single' && (
                <div className="flex flex-col gap-32">
                  {filteredProjects.map((project) => (
                    <motion.div key={project.id} variants={itemVariants} className="flex flex-col gap-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[#EB5B00] font-sans text-lg md:text-xl font-bold">{project.number}</span>
                          <h3 className="text-white font-syne font-black text-4xl md:text-6xl uppercase tracking-tight leading-none hover:text-[#EB5B00] transition-colors duration-300">
                            {project.title}
                          </h3>
                        </div>
                        <div className="text-left md:text-right text-white/70 font-sans text-sm font-semibold uppercase tracking-widest leading-relaxed">
                          <p>{project.client} &mdash; {project.year}</p>
                          <p className="text-white/40 mt-1">{project.services}</p>
                        </div>
                      </div>
                      
                      <div className="w-full aspect-[4/5] md:aspect-[21/9] bg-zinc-950 overflow-hidden relative group rounded-2xl border border-white/5">
                        <ImageWithFallback 
                          src={project.image} 
                          alt={project.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" 
                        />
                      </div>
                      
                      <div className="max-w-3xl">
                        <p className="text-white/80 font-sans text-lg md:text-xl font-medium leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ROW VIEW */}
              {view === 'row' && (
                <div 
                  className="flex flex-col border-t border-white/10"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  {filteredProjects.map((project) => (
                    <motion.div 
                      key={project.id} 
                      variants={itemVariants}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      className="group relative border-b border-white/10 py-6 md:py-8 cursor-pointer flex items-center"
                    >
                      {/* Subtle Background change */}
                      <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      {/* Text Row */}
                      <div className="relative z-10 flex flex-wrap md:flex-nowrap items-center gap-x-4 md:gap-x-6 text-white/80 font-sans text-sm md:text-base font-semibold uppercase tracking-widest w-full px-4 pointer-events-none">
                        <span className="text-[#EB5B00] min-w-[3rem] font-bold">{project.number}</span>
                        <span className="hidden md:inline text-white/30">&mdash;</span>
                        
                        <span className="text-white font-syne font-bold text-2xl md:text-3xl group-hover:text-[#EB5B00] transition-colors duration-300 md:min-w-[300px]">
                          {project.title}
                        </span>
                        
                        <div className="hidden md:flex items-center gap-6 flex-1 justify-end text-xs lg:text-sm">
                          <span>&mdash;</span>
                          <span className="w-48 text-right truncate">{project.client}</span>
                          <span>&mdash;</span>
                          <span className="w-64 text-right truncate">{project.services}</span>
                          <span>&mdash;</span>
                          <span>{project.year}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* GALLERY VIEW */}
              {view === 'gallery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <motion.div key={project.id} variants={itemVariants} className="relative group aspect-square md:aspect-[4/5] bg-zinc-950 overflow-hidden cursor-pointer rounded-2xl border border-white/5">
                      <ImageWithFallback 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-40" 
                      />
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <h3 className="text-white font-syne font-bold text-2xl md:text-3xl uppercase tracking-tighter leading-tight drop-shadow-lg">
                          {project.title}
                        </h3>
                        <p className="text-[#EB5B00] font-sans text-xs md:text-sm font-bold uppercase tracking-widest mt-4 drop-shadow-md">
                          {project.category}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Load More Button */}
        {filteredProjects.length > 0 && (
          <div className="mt-16 flex justify-center">
            <button className="group relative overflow-hidden px-8 py-4 bg-zinc-900 border border-white/10 hover:border-[#EB5B00]/50 transition-colors duration-300 rounded-sm">
              <div className="absolute inset-0 bg-[#EB5B00]/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative text-white/80 group-hover:text-white font-sans text-xs font-semibold uppercase tracking-widest transition-colors duration-300">
                Load More
              </span>
            </button>
          </div>
        )}

        {/* Floating Cursor Image for Row View */}
        <AnimatePresence>
          {view === 'row' && hoveredProject && (
            <motion.div
              className="fixed pointer-events-none z-50 w-72 aspect-video overflow-hidden shadow-2xl hidden md:block border border-white/10 rounded-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ 
                left: 0, 
                top: 0,
                x: cursorXSpring, 
                y: cursorYSpring,
                translateX: "32px", // Offset slightly to the right of the cursor
                translateY: "-50%"  // Center vertically on cursor
              }}
            >
              <ImageWithFallback 
                src={projects.find(p => p.id === hoveredProject)?.image || ''} 
                alt="Project Preview" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

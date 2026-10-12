import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

type Project = {
  id: string;
  cover_media?: { thumbnail_url?: string; url?: string };
  cover_image?: string;
  published: boolean;
};

interface WorksTransitionOverlayProps {
  onNavigate: () => void;
  onComplete: () => void;
}

const SCREEN_BAND_HEIGHT = 242;
const SCREEN_IMAGE_HEIGHT = 220;
const SCREEN_IMAGE_GAP = 20;
const CLONE_COUNT = 1;          // keep texture under GPU 4096px limit
const MAX_SCREEN_IMAGE_WIDTH = 400;
const IMAGES_PER_BAND = [5, 14, 13, 20, 14, 15, 12];

const TEXTURE_SCALE = 2; // For Retina rendering

const bandConfigs = [
  { offsetY: -720, speed: 1.0, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: -480, speed: 1.2, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: -240, speed: -0.9, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: 0, speed: 1.0, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: 240, speed: -1.3, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: 480, speed: 1.1, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
  { offsetY: 720, speed: -1.0, rotation: -6 * Math.PI / 180, curveAmount: 0.0, curveDirection: 1 },
];

export function WorksTransitionOverlay({ onNavigate, onComplete }: WorksTransitionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onNavigateRef = useRef(onNavigate);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onCompleteRef.current = onComplete;
  }, [onNavigate, onComplete]);

  useEffect(() => {
    let isDestroyed = false;
    let requestAnimFrameId: number;
    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let renderer: THREE.WebGLRenderer;
    let materials: THREE.ShaderMaterial[] = [];
    let meshes: THREE.Mesh[] = [];

    let tl = gsap.timeline({ paused: true });

    const init = () => {
      try {


        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        if (!containerRef.current) return;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        camera.position.z = 1;

        const calculateImageDimensions = (baseHeight: number, _originalAspectRatio: number) => {
          const FIXED_RATIO = 1.5;
          let w = baseHeight * FIXED_RATIO;
          if (w > MAX_SCREEN_IMAGE_WIDTH) {
            w = MAX_SCREEN_IMAGE_WIDTH;
          }
          return { screenWidth: w, screenHeight: baseHeight };
        };

        const createHorizontalTextureForBand = (images: any[]) => {
          let sequenceWidthScreen = 0;
          for (const img of images) {
            if (img && img.loaded) sequenceWidthScreen += img.screenWidth + SCREEN_IMAGE_GAP;
          }
          const totalWidthScreen = sequenceWidthScreen * CLONE_COUNT;

          const canvas = document.createElement('canvas');
          canvas.width = totalWidthScreen * TEXTURE_SCALE;
          canvas.height = SCREEN_BAND_HEIGHT * TEXTURE_SCALE;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let currentX = 0;
          for (let clone = 0; clone < CLONE_COUNT; clone++) {
            for (const imgInfo of images) {
              if (imgInfo && imgInfo.loaded && imgInfo.img) {
                const drawWidth = imgInfo.screenWidth * TEXTURE_SCALE;
                const drawHeight = imgInfo.screenHeight * TEXTURE_SCALE;
                const centeredY = (canvas.height - drawHeight) / 2;
                ctx.save();
                ctx.globalAlpha = 0.95;

                const imgW = imgInfo.img.naturalWidth || imgInfo.img.width;
                const imgH = imgInfo.img.naturalHeight || imgInfo.img.height;

                if (imgW && imgH) {
                  const targetRatio = drawWidth / drawHeight;
                  const imgRatio = imgW / imgH;
                  let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;

                  if (imgRatio > targetRatio) {
                    sWidth = sHeight * targetRatio;
                    sx = (imgW - sWidth) / 2;
                  } else {
                    sHeight = sWidth / targetRatio;
                    sy = (imgH - sHeight) / 2;
                  }
                  ctx.drawImage(imgInfo.img, sx, sy, sWidth, sHeight, currentX, centeredY, drawWidth, drawHeight);
                } else {
                  ctx.drawImage(imgInfo.img, currentX, centeredY, drawWidth, drawHeight);
                }

                ctx.restore();
                currentX += drawWidth + (SCREEN_IMAGE_GAP * TEXTURE_SCALE);
              }
            }
          }
          return { canvas, totalWidth: totalWidthScreen, sequenceWidth: sequenceWidthScreen };
        };

        const dims = calculateImageDimensions(SCREEN_IMAGE_HEIGHT, 1.5);
        const staticImageWidth = dims.screenWidth;

        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 1; dummyCanvas.height = 1;
        const ctxDummy = dummyCanvas.getContext('2d');
        if (ctxDummy) { ctxDummy.fillStyle = '#000000'; ctxDummy.fillRect(0, 0, 1, 1); }
        const dummyTexture = new THREE.Texture(dummyCanvas);
        dummyTexture.needsUpdate = true;





        bandConfigs.forEach((config, index) => {
          const count = IMAGES_PER_BAND[index];
          const seqWidth = count * (staticImageWidth + SCREEN_IMAGE_GAP);

          const material = new THREE.ShaderMaterial({
            uniforms: {
              uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
              uTexture: { value: dummyTexture },
              uSequenceWidth: { value: seqWidth },
              uBandHeight: { value: SCREEN_BAND_HEIGHT },
              uOffsetY: { value: config.offsetY },
              uDirection: { value: config.speed > 0 ? 1.0 : -1.0 },
              uBaseOffset: { value: 0.0 },
              uFlyInOffset: { value: 0.0 },
              uRotation: { value: config.rotation },
              uBandIndex: { value: index },
              uCurveAmount: { value: config.curveAmount },
              uCurveDirection: { value: config.curveDirection },
            },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              precision highp float;
              uniform vec2 uResolution;
              uniform sampler2D uTexture;
              uniform float uSequenceWidth;
              uniform float uBandHeight;
              uniform float uOffsetY;
              uniform float uDirection;
              uniform float uBaseOffset;
              uniform float uFlyInOffset;
              uniform float uRotation;
              uniform float uBandIndex;
              uniform float uCurveAmount;
              uniform float uCurveDirection;

              varying vec2 vUv;

              mat2 rotate2d(float angle) {
                return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              }

              void main() {
                // Apply cinematic Barrel Distortion (CRT / Fisheye effect)
                vec2 centeredUv = vUv - vec2(0.5);
                float r2 = dot(centeredUv, centeredUv);
                float distortionStrength = 0.30; // Controls the curve intensity
                vec2 distortedUv = vUv + centeredUv * (distortionStrength * r2);
                
                vec2 pixelCoord = distortedUv * uResolution;
                float bandTopBase = (uResolution.y - uBandHeight) * 0.5 + uOffsetY;
                float bandCenterY = bandTopBase + (uBandHeight * 0.5);
                vec2 rotationCenter = vec2(uResolution.x * 0.5, bandCenterY);

                vec2 rotatedPixelCoord = pixelCoord - rotationCenter;
                rotatedPixelCoord = rotate2d(-uRotation) * rotatedPixelCoord;
                rotatedPixelCoord += rotationCenter;

                float normalizedX = rotatedPixelCoord.x / uResolution.x;
                float curveFactor = 4.0 * (normalizedX - 0.5) * (normalizedX - 0.5);
                float curveOffset = (0.5 - curveFactor) * uCurveAmount * uCurveDirection;

                float unrotatedBandTop = bandTopBase + curveOffset;
                float unrotatedBandBottom = unrotatedBandTop + uBandHeight;

                float margin = 2.0;
                if (rotatedPixelCoord.y < unrotatedBandTop - margin || rotatedPixelCoord.y > unrotatedBandBottom + margin) {
                  discard;
                }

                float offset = uBaseOffset + uFlyInOffset;

                float rawX = 0.0;
                if (uDirection > 0.0) {
                  // Moves LEFT. Enters from RIGHT. Leading edge is the LEFT edge of the train.
                  if (rotatedPixelCoord.x < offset) { discard; }
                  rawX = rotatedPixelCoord.x - offset;
                } else {
                  // Moves RIGHT. Enters from LEFT. Leading edge is the RIGHT edge of the train.
                  if (rotatedPixelCoord.x > offset) { discard; }
                  // Calculate distance from the LEFT edge of the train so the texture isn't flipped horizontally
                  rawX = rotatedPixelCoord.x - (offset - uSequenceWidth);
                }

                if (rawX < 0.0 || rawX > uSequenceWidth) {
                  discard;
                }

                float textureX = rawX / uSequenceWidth;
                
                float texY = (rotatedPixelCoord.y - unrotatedBandTop) / uBandHeight;
                if (textureX < 0.0 || textureX > 1.0 || texY < 0.0 || texY > 1.0) {
                  discard;
                }

                vec4 imageColor = texture2D(uTexture, vec2(textureX, texY));
                
                // Solid black background for the band
                vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
                
                // Blend image over the black background
                color.rgb = mix(color.rgb, imageColor.rgb, imageColor.a);

                float edge = min(rotatedPixelCoord.y - unrotatedBandTop, unrotatedBandBottom - rotatedPixelCoord.y);
                if (edge < margin) {
                  color.a *= smoothstep(0.0, margin, edge);
                }
                if (color.a < 0.01) { discard; }

                float hueShift = uBandIndex * 0.1;
                color.r *= (1.0 + sin(hueShift)         * 0.02);
                color.g *= (1.0 + sin(hueShift + 2.094) * 0.02);
                color.b *= (1.0 + sin(hueShift + 4.188) * 0.02);
                
                gl_FragColor = color;
              }
            `,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.1
          });

          materials.push(material);

          const geometry = new THREE.PlaneGeometry(2, 2);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.z = index * -0.1;
          scene.add(mesh);
          meshes.push(mesh);
        });

        if (isDestroyed) return;

        const animate = () => {
          requestAnimFrameId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // 1. Fade in container
        if (containerRef.current) {
          tl.to(containerRef.current, { opacity: 1, duration: 0.3, ease: "power2.inOut" });
        }

        const TOTAL_DURATION = 4.4; // Fixed duration for cinematic speedramp
        const PHASE1_DURATION = 2.0;
        const PHASE2_DURATION = 1.2;
        const PHASE3_DURATION = 1.2;

        materials.forEach((mat, i) => {
          const config = bandConfigs[i];
          const isMovingLeft = config.speed > 0;
          const sequenceWidth = mat.uniforms.uSequenceWidth.value;

          // 1. Slow Drift (uBaseOffset)
          // Speed during the "Hold" phase. Very slow.
          const driftSpeed = (isMovingLeft ? -50 : 50) * Math.abs(config.speed);

          // Anchor is where the Head sits during the Hold phase
          const anchorX = isMovingLeft ? -200 : window.innerWidth + 200;
          mat.uniforms.uBaseOffset.value = anchorX;

          const endDriftTarget = anchorX + driftSpeed * TOTAL_DURATION;

          tl.to(mat.uniforms.uBaseOffset, {
            value: endDriftTarget,
            duration: TOTAL_DURATION,
            ease: "none"
          }, 0);

          // 2. Speedramp (uFlyInOffset handles both Fly-In and Fly-Out)

          // --- Phase 1: Fast Fly-In ---
          const startPhysicalX = isMovingLeft ? window.innerWidth + 200 : -200;
          mat.uniforms.uFlyInOffset.value = startPhysicalX - anchorX;

          tl.to(mat.uniforms.uFlyInOffset, {
            value: 0,
            duration: PHASE1_DURATION,
            ease: "power4.inOut"
          }, 0); // Slow start (held breath), then fast inwards, decelerating to 0

          // --- Phase 2: Hold (Implicit) ---
          // From 1.0s to 2.2s, uFlyInOffset stays at 0. Movement is driven entirely by the slow Drift.

          // --- Phase 3: Fast Fly-Out ---
          // Target physical position for the Tail to exit the screen completely
          const targetExitX = isMovingLeft ? -200 - sequenceWidth : window.innerWidth + 200 + sequenceWidth;
          // Target uFlyInOffset must make up the difference between endDriftTarget and targetExitX
          const flyOutTarget = targetExitX - endDriftTarget;

          tl.to(mat.uniforms.uFlyInOffset, {
            value: flyOutTarget,
            duration: PHASE3_DURATION,
            ease: "power3.in"
          }, PHASE1_DURATION + PHASE2_DURATION); // Fast burst outwards, accelerating from 0
        });

        // 3. PAGE SWAP: Swap DOM during the Slow Hold phase
        tl.call(() => {
          try {
            console.log("[Transition] Navigating to works page...");
            onNavigateRef.current();
          } catch (e) {
            console.error("[Transition] Navigation failed", e);
          }
        }, [], PHASE1_DURATION + 0.2); // Trigger slightly after Phase 1 ends

        // 4. ON COMPLETE: Finish transition exactly when Phase 3 ends
        tl.call(() => {
          try {
            console.log("[Transition] Completed!");
            onCompleteRef.current();
          } catch (e) {
            console.error("[Transition] Completion callback failed", e);
          }
        }, [], TOTAL_DURATION);
        tl.play(); // Start the timeline now that everything is ready!

        // Start async data loading in background
        (async () => {
          try {
            const res = await fetch("/api/v1/projects/all");
            let allProjects = [];
            if (res.ok) {
              const rawData = await res.json();
              allProjects = Array.isArray(rawData) ? rawData : (rawData.items || []);
            }

            const publishedProjects = allProjects.filter((p: Project) => p.published);
            const imageUrls = publishedProjects.map((p: Project) => {
              // Prefer full quality url/image before thumbnail
              return p.cover_media?.url || p.cover_image || p.cover_media?.thumbnail_url;
            }).filter(Boolean) as string[];

            if (imageUrls.length === 0) {
              imageUrls.push("https://images.unsplash.com/photo-1649730837819-e68ff76c1816?h=400");
            }


            let globalBag: string[] = [];

            const loadImagesForBand = async (imagesCount: number) => {
              const apiUrl = import.meta.env.VITE_API_URL || "/api/v1";
              const bandUrls: string[] = [];

              for (let i = 0; i < imagesCount; i++) {
                if (globalBag.length === 0) {
                  globalBag = [...imageUrls];
                  for (let k = globalBag.length - 1; k > 0; k--) {
                    const j = Math.floor(Math.random() * (k + 1));
                    [globalBag[k], globalBag[j]] = [globalBag[j], globalBag[k]];
                  }
                }

                let selectedIdx = globalBag.length - 1;
                if (imageUrls.length > 1) {
                  for (let j = globalBag.length - 1; j >= 0; j--) {
                    const candidate = globalBag[j];
                    const matchesPrev = bandUrls.length > 0 && candidate === bandUrls[bandUrls.length - 1];
                    const matchesFirst = (i === imagesCount - 1) && candidate === bandUrls[0];
                    if (!matchesPrev && !matchesFirst) {
                      selectedIdx = j;
                      break;
                    }
                  }
                }
                bandUrls.push(globalBag.splice(selectedIdx, 1)[0]);
              }

              const promises = bandUrls.map((url) => new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  const dims = calculateImageDimensions(SCREEN_IMAGE_HEIGHT, ratio);
                  resolve({ loaded: true, img, ...dims });
                };

                img.onerror = () => {
                  const dims = calculateImageDimensions(SCREEN_IMAGE_HEIGHT, 1.5);
                  const c = document.createElement('canvas');
                  c.width = dims.screenWidth * TEXTURE_SCALE; c.height = dims.screenHeight * TEXTURE_SCALE;
                  const cx = c.getContext('2d');
                  if (cx) { cx.fillStyle = '#1a1a1a'; cx.fillRect(0, 0, c.width, c.height); }
                  resolve({ loaded: true, img: c, ...dims });
                };

                img.src = `${apiUrl}/media/cors-proxy?url=${encodeURIComponent(url)}`;
              }));

              return Promise.all(promises);
            };

            let totalLoaded = 0;
            const totalToLoad = IMAGES_PER_BAND.reduce((a, b) => a + b, 0);

            await Promise.all(
              bandConfigs.map(async (config, index) => {
                const imgs = await loadImagesForBand(IMAGES_PER_BAND[index]);
                totalLoaded += IMAGES_PER_BAND[index];
                setProgress(Math.round((totalLoaded / totalToLoad) * 100));

                const textureData = createHorizontalTextureForBand(imgs);
                if (!textureData) return;
                const texture = new THREE.Texture(textureData.canvas);
                texture.needsUpdate = true;

                if (materials[index] && !isDestroyed) {
                  materials[index].uniforms.uTexture.value = texture;
                }
              })
            );
          } catch (e) {
            console.error("Async loading failed", e);
          }
        })();


      } catch (e) {
        console.error("Transition init failed", e);
        onNavigateRef.current();
        onCompleteRef.current();
      }
    };

    init();

    const handleResize = () => {
      if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        materials.forEach(mat => {
          mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isDestroyed = true;
      window.removeEventListener("resize", handleResize);
      if (requestAnimFrameId) cancelAnimationFrame(requestAnimFrameId);
      if (tl) tl.kill();

      meshes.forEach(mesh => {
        scene?.remove(mesh);
        mesh.geometry?.dispose();
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m: any) => m?.dispose());
      });
      materials.forEach(mat => {
        mat.uniforms.uTexture?.value?.dispose();
        mat.dispose();
      });
      if (renderer) {
        renderer.forceContextLoss();
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []); // Empty dependency array ensures this effect runs exactly once!

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ opacity: 0 }}
    >
      {progress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 font-mono text-xs tracking-widest uppercase">
          {progress}%
        </div>
      )}
    </div>
  );
}

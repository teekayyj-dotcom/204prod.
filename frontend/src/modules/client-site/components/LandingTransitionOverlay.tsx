import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

type Project = {
  id: string;
  cover_media?: { thumbnail_url?: string; url?: string };
  cover_image?: string;
  published: boolean;
};

interface LandingTransitionOverlayProps {
  onNavigate: () => void;
  onComplete: () => void;
}

const NUM_IMAGES = 10;

export function LandingTransitionOverlay({ onNavigate, onComplete }: LandingTransitionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [sequenceImages, setSequenceImages] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const onNavigateRef = useRef(onNavigate);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onCompleteRef.current = onComplete;
  }, [onNavigate, onComplete]);

  // Load images
  useEffect(() => {
    const fetchImages = async () => {
      let imageUrls: string[] = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch("/api/v1/projects/all", { signal: controller.signal });
        clearTimeout(timeoutId);

        let allProjects = [];
        if (res.ok) {
          const rawData = await res.json();
          allProjects = Array.isArray(rawData) ? rawData : (rawData.items || []);
        }

        const publishedProjects = allProjects.filter((p: Project) => p.published && p.featured);
        imageUrls = publishedProjects.map((p: Project) => {
          return p.cover_media?.url || p.cover_image || p.cover_media?.thumbnail_url;
        }).filter(Boolean) as string[];
      } catch (e) {
        console.warn("API fetch failed, using fallback images", e);
      }

      if (imageUrls.length === 0) {
        imageUrls = [
          "https://images.unsplash.com/photo-1649730837819-e68ff76c1816?q=80&w=2000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2000&auto=format&fit=crop"
        ];
      }

      const heroImage = imageUrls[0];
      const seq: string[] = [];
      
      const bag = [...imageUrls];
      
      if (bag.length <= 1) {
        // Fallback if only 1 image exists
        for (let i = 0; i < NUM_IMAGES - 1; i++) seq.push(bag[0]);
        seq.push(heroImage);
      } else {
        // Fill sequence with random images, avoiding consecutive duplicates
        for (let i = 0; i < NUM_IMAGES - 1; i++) {
          let idx = Math.floor(Math.random() * bag.length);
          if (i > 0) {
            while (bag[idx] === seq[i - 1]) {
              idx = Math.floor(Math.random() * bag.length);
            }
          }
          seq.push(bag[idx]);
        }
        
        // Ensure the last random image isn't the same as the hero image (which comes right after)
        if (seq[seq.length - 1] === heroImage) {
          let altIdx = Math.floor(Math.random() * bag.length);
          // If we have at least 3 images, we can avoid matching both the hero AND the previous image
          if (bag.length >= 3) {
            while (bag[altIdx] === heroImage || bag[altIdx] === seq[seq.length - 2]) {
              altIdx = Math.floor(Math.random() * bag.length);
            }
          } else {
            while (bag[altIdx] === heroImage) {
              altIdx = Math.floor(Math.random() * bag.length);
            }
          }
          seq[seq.length - 1] = bag[altIdx];
        }

        // The Hero Image must be at the BOTTOM (Index 9)
        seq.push(heroImage);
      }

      setSequenceImages(seq);
      setTimeout(() => setIsReady(true), 100);
    };
    fetchImages();
  }, []);

  // Animation
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const tl = gsap.timeline();
    const parallaxImages = containerRef.current.querySelectorAll('.image-parallax');

    // Initial states
    gsap.set(containerRef.current, { opacity: 1 });
    
    // Setup panels
    const panels = containerRef.current.querySelectorAll('.slide-panel');
    const images = containerRef.current.querySelectorAll('.image-parallax');
    
    // Set initial positions
    for (let i = 0; i < panels.length; i++) {
      if (i === 0) {
        // Frame 0 fades in at y: 0 to prevent the black gap of the underlying page
        gsap.set(panels[0], { y: '0vh', opacity: 0, clipPath: 'none' });
        gsap.set(images[0], { yPercent: -50 }); // Center parallax for fading frame
      } else {
        const isDown = i % 2 === 0;
        gsap.set(panels[i], { 
          y: isDown ? '-100vh' : '100vh',
          clipPath: 'none',
          opacity: 1
        });
        gsap.set(images[i], { yPercent: isDown ? -60 : -40 });
      }
    }

    // To prevent black gaps between alternating opposite slides, we CANNOT overlap them.
    // STAGGER must exactly equal SLIDE_DURATION. We use 'none' ease to prevent jerkiness.
    const SLIDE_DURATION = 0.8;
    const STAGGER = 0.8;

    for (let i = 0; i < panels.length; i++) {
      const isLast = i === panels.length - 1;
      const startTime = i * STAGGER;
      const isDown = i % 2 === 0;

      if (i === 0) {
        // First panel fades in to cover the screen instantly without gaps
        tl.to(panels[0], {
          opacity: 1,
          duration: SLIDE_DURATION,
          ease: 'none'
        }, startTime);
      } else {
        // Subsequent panels physically slide into view
        tl.to(panels[i], {
          y: '0vh',
          duration: SLIDE_DURATION,
          ease: 'none'
        }, startTime);

        // Parallax effect
        tl.to(images[i], {
          yPercent: isLast ? -50 : (isDown ? -40 : -60),
          duration: SLIDE_DURATION,
          ease: 'none'
        }, startTime);
      }
    }

    const TOTAL_ANIM_TIME = (panels.length - 1) * STAGGER + SLIDE_DURATION;

    // 3. Swap DOM (navigate) right before fade out
    tl.call(() => {
      try { onNavigateRef.current(); } catch(e){}
    }, [], TOTAL_ANIM_TIME - 0.2);

    // 4. Fade out overlay smoothly to reveal landing page
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut'
    }, TOTAL_ANIM_TIME + 0.2);

    // Complete
    tl.call(() => {
      try { onCompleteRef.current(); } catch(e){}
    }, [], TOTAL_ANIM_TIME + 1.0);

    return () => {
      tl.kill();
    };
  }, [isReady]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ opacity: 0, overflow: 'hidden' }}
    >
      {sequenceImages.map((src, i) => (
        <div 
          key={i} 
          className="slide-panel absolute top-0 left-0 w-full h-[100vh] overflow-hidden rounded-none bg-black shadow-none"
          style={{ zIndex: i }}
        >
          <img
            src={src}
            className="image-parallax absolute top-1/2 left-0 w-full h-[130%] object-cover rounded-none -translate-y-1/2"
            alt=""
          />
        </div>
      ))}
    </div>
  );
}

// @ts-nocheck
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);
gsap.config({ trialWarn: false });

import { useWorksTransition } from '../components/WorksTransitionContext';

const shot = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const fallbackProjects = [];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [nextProject, setNextProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const nextSectionRef = useRef<HTMLDivElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const shapeStartRef = useRef<SVGPathElement>(null);
  const shapeEndRef = useRef<SVGPathElement>(null);

  const scrollY = useMotionValue(0);
  const bgY = useTransform(scrollY, [0, 1000], [0, -200]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0.1]);
  const textOpacity = useTransform(scrollY, [0, 600], [1, 0.95]);
  const titleY = useTransform(scrollY, [0, 1000], [0, -1000]);


  let urls = (project?.behindTheScenes || []).map((img: any) => img.url);
  if (urls.length === 0) {
    urls = [project?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"];
  }

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

  useLayoutEffect(() => {
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
        const response = await fetch(`/api/v1/projects/${id}`);
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
            behindTheScenes: data.gallery || [],
            credits: data.structured_credits || []
          });
        } else {
          // Fallback to local mock data
          const local = fallbackProjects.find(p => p.id === id);
          setProject(local ? { ...local, behindTheScenes: [] } : null);
        }

        // Fetch all projects to determine next project
        try {
          const listRes = await fetch(`/api/v1/projects`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const items = listData.items || [];
            if (items.length > 0) {
               const currentIndex = items.findIndex((p: any) => p.slug === id);
               const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % items.length : 0;
               setNextProject(items[nextIndex]);
            }
          }
        } catch (e) {
          console.error("Failed to fetch next project", e);
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

  useEffect(() => {
    if (!nextProject) return;

    // Hardcode the morph shapes so we don't need DOM elements for them
    const pathStart = "M0,290 L1920,290 L1920,790 L0,790 Z";
    const pathEnd = "M0,0 L1920,0 L1920,1080 L0,1080 Z";

    const ctx = gsap.context(() => {
      const nextSection = nextSectionRef.current;
      const maskPath = maskPathRef.current;
      const wrapper = wrapperRef.current;
      const bgOverlay = bgOverlayRef.current;
      const shapeStart = shapeStartRef.current;
      const shapeEnd = shapeEndRef.current;
      
      if (nextSection && maskPath && shapeStart && shapeEnd) {
        const handleMouseEnter = () => {
          if (document.body.classList.contains("is-transitioning")) return;
          gsap.to(maskPath, { duration: 0.6, morphSVG: shapeEnd, ease: "power2.out", overwrite: "auto" });
          if (wrapper) gsap.to(wrapper, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: "auto" });
          if (bgOverlay) gsap.to(bgOverlay, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: "auto" });
        };
        
        const handleMouseLeave = () => {
          if (document.body.classList.contains("is-transitioning")) return;
          gsap.to(maskPath, { duration: 0.6, morphSVG: shapeStart, ease: "power2.out", overwrite: "auto" });
          if (wrapper) gsap.to(wrapper, { opacity: 0.6, duration: 0.6, ease: "power2.out", overwrite: "auto" });
          if (bgOverlay) gsap.to(bgOverlay, { opacity: 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
        };

        nextSection.addEventListener("mouseenter", handleMouseEnter);
        nextSection.addEventListener("mouseleave", handleMouseLeave);
        
        // Store functions on the element so we can remove them in cleanup
        (nextSection as any)._handleMouseEnter = handleMouseEnter;
        (nextSection as any)._handleMouseLeave = handleMouseLeave;
      }
    });

    return () => {
       const nextSection = nextSectionRef.current;
       if (nextSection) {
         if ((nextSection as any)._handleMouseEnter) {
           nextSection.removeEventListener("mouseenter", (nextSection as any)._handleMouseEnter);
         }
         if ((nextSection as any)._handleMouseLeave) {
           nextSection.removeEventListener("mouseleave", (nextSection as any)._handleMouseLeave);
         }
       }
       document.body.classList.remove("is-transitioning");
       ctx.revert();
    };
  }, [nextProject]);

  const handleNextProjectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!nextProject) return;

    const section = nextSectionRef.current;
    const maskPathTarget = maskPathRef.current;
    const placeholder = document.getElementById("next-project-placeholder");
    const pathEnd = "M0,0 L1920,0 L1920,1080 L0,1080 Z";
    
    if (maskPathTarget && section && placeholder) {
      document.body.classList.add("is-transitioning");

      const rect = section.getBoundingClientRect();

      // 1. Create a clone to animate safely in the body
      const clone = section.cloneNode(true) as HTMLElement;
      document.body.appendChild(clone);

      // Fix SVG ID collisions so the browser doesn't break the clip-path!
      const uniqueId = Math.random().toString(36).substring(7);
      const cloneClipPath = clone.querySelector("clipPath");
      const cloneImage = clone.querySelector("image");
      const cloneMaskPath = clone.querySelector("#maskpath");
      
      if (cloneClipPath && cloneImage && cloneMaskPath) {
        cloneClipPath.id = `morphClip_${uniqueId}`;
        cloneImage.setAttribute("clip-path", `url(#${cloneClipPath.id})`);
        cloneMaskPath.id = `maskpath_${uniqueId}`;
      }

      const tl = gsap.timeline();

      // Fade out the text inside the clone smoothly as the expansion begins
      const cloneTextContainer = clone.querySelector("#next-project-text");
      if (cloneTextContainer) {
        tl.to(cloneTextContainer, { opacity: 0, duration: 0.4, ease: "power2.out" }, 0);
      }

      // 2. Hide original to prevent duplicate visuals and keep React happy on unmount
      section.style.opacity = '0';

      // Let GSAP seamlessly hijack the current animation state on the CLONE!
      const cloneWrapper = clone.querySelector("#morphing-wrapper");
      if (cloneWrapper) {
        gsap.to(cloneWrapper, { opacity: 1, duration: 1.2, ease: "power3.inOut" });
      }
      
      // 1. FLIP Technique: Set fixed exactly at current position to prevent jerking
      gsap.set(clone, {
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 9999,
        margin: 0
      });

      // 2. Expand the clone to fill the entire screen vertically
      tl.to(clone, {
        top: 0,
        height: "100vh",
        duration: 1.2,
        ease: "power3.inOut",
        onComplete: () => {
          document.body.classList.remove("is-transitioning");
          
          // Instantly hide the old page so it doesn't flash when jumping to top during popLayout
          const container = document.getElementById("project-detail-container");
          if (container) container.style.opacity = '0';
          
          navigate(`/works/${nextProject.slug}`);
          window.scrollTo(0, 0);

          // Fade out and remove clone after new page has FULLY faded in (0.6s)
          // This prevents a "dip to black" crossfade flash.
          gsap.to(clone, {
            opacity: 0,
            duration: 0.6,
            delay: 0.6, 
            onComplete: () => clone.remove()
          });
        }
      }, 0);

        // 3. Ensure mask is fully expanded. 
        // Animate the unique clone mask explicitly to the shape end node.
        if (cloneMaskPath && shapeEndRef.current) {
          tl.to(
            cloneMaskPath,
            {
              duration: 0.5,
              morphSVG: shapeEndRef.current,
              ease: "power2.out"
            },
            0
          );
        }
    } else {
      navigate(`/works/${nextProject.slug}`);
      window.scrollTo(0, 0);
    }
  };

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
          <button onClick={() => navigate('/works')} className="text-[#EB5B00] hover:text-white transition-colors flex items-center gap-2 justify-center mx-auto text-sm font-semibold uppercase tracking-wider outline-none">
            <ArrowLeft size={16} /> Back to Works
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="project-detail-container" className="min-h-screen bg-black relative">
      {/* Back Button Overlay */}
      <button 
        onClick={() => navigate('/works')} 
        className="fixed top-24 left-6 md:left-12 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#EB5B00] hover:border-[#EB5B00] hover:text-black transition-all group outline-none"
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
            const videoUrl = project.video || null;
            if (!videoUrl) {
              return (
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover opacity-60"
                />
              );
            }
            const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
            const vmMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
            const bunnyLegacyMatch = videoUrl.match(/iframe\.mediadelivery\.net\/embed\//);

            let embedUrl = null;
            if (ytMatch) {
              embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1`;
            } else if (vmMatch) {
              embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1&controls=0&background=1`;
            } else if (bunnyLegacyMatch) {
              embedUrl = videoUrl.includes("?")
                ? `${videoUrl}&autoplay=true&loop=true&muted=true&background=true`
                : `${videoUrl}?autoplay=true&loop=true&muted=true&background=true`;
            }
            
            const nativeVideoUrl = videoUrl?.replace("/play_1080p.mp4", "/play_720p.mp4");
            
            if (embedUrl) {
              return (
                <iframe
                  src={embedUrl}
                  className="w-full h-full object-cover pointer-events-none opacity-60"
                  style={{ border: "none", transform: "scale(1.35)", transformOrigin: "center" }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={project.title}
                />
              );
            } else {
              return (
                <video 
                  src={nativeVideoUrl}
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
          
          {/* Left Column: Project Description */}
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

          {/* Right Column: Summary Table */}
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
          </motion.div>
        </div>
      </section>

      {/* Credits & Behind the Scenes Section */}
      {(project.credits?.length > 0 || project.behindTheScenes?.length > 0) && (
        <section className="relative z-10 bg-black pt-24 pb-32 lg:pb-48 px-6 md:px-12 w-full border-t border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start relative">
            
            {/* Left Column: Credits (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 flex flex-col font-sans">
               <h2 className="text-3xl font-syne font-black uppercase tracking-tight text-white mb-12">Credits</h2>
               <div className="flex flex-col gap-4">
                  {Object.entries(
                    project.credits?.reduce((acc: any, credit: any) => {
                      if (!acc[credit.role]) acc[credit.role] = [];
                      acc[credit.role].push(credit.name);
                      return acc;
                    }, {} as Record<string, string[]>) || {}
                  ).map(([role, names]: [string, any], index: number) => (
                     <div key={index} className="flex flex-row items-baseline gap-4 pb-4 border-b border-white/5">
                        <span className="text-[#EB5B00] text-xs font-semibold uppercase tracking-widest min-w-[140px] shrink-0">{role}</span>
                        <span className="text-white text-base font-medium">{names.join(", ")}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right Column: Behind The Scenes Images */}
            <div className="lg:col-span-8 flex flex-col gap-8">
               <h2 className="text-3xl font-syne font-black uppercase tracking-tight text-white mb-2 lg:hidden">Behind the Scenes</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {project.behindTheScenes?.map((img: any, i: number) => (
                     <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 100 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay: (i % 3) * 0.15 }}
                        className="overflow-hidden rounded-xl border border-white/10 bg-white/5 w-full min-h-[150px] md:min-h-[200px]"
                     >
                        <img src={img.url || img} alt={`Behind the scenes ${i + 1}`} loading="lazy" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" />
                     </motion.div>
                  ))}
               </div>
            </div>

          </div>
        </section>
      )}

      {/* Next Project Section */}
      {nextProject && (
        <div id="next-project-placeholder" className="w-full h-[35vh]">
          <section 
            ref={nextSectionRef}
            className="relative z-10 w-full h-full bg-black cursor-pointer group next-project-section overflow-hidden"
            onClick={handleNextProjectClick}
          >
          {/* Background overlay on hover */}
          <div ref={bgOverlayRef} id="morphing-bg" className="absolute inset-0 bg-white/5 opacity-0 pointer-events-none" />

            {/* Morphing Thumbnail (No sliding, stays centered) */}
          <div ref={wrapperRef} id="morphing-wrapper" className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-60">
             <svg viewBox="0 0 1920 1080" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
               <defs>
                 <path ref={shapeStartRef} id="maskMorphShapeStart" d="M0,290 L1920,290 L1920,790 L0,790 Z" className="hidden" />
                 <path ref={shapeEndRef} id="maskMorphShapeEnd" d="M0,0 L1920,0 L1920,1080 L0,1080 Z" className="hidden" />
                 <clipPath id="morphClip">
                   <path ref={maskPathRef} id="maskpath" d="M0,290 L1920,290 L1920,790 L0,790 Z" />
                 </clipPath>
               </defs>
               <image 
                 id="morphing-image"
                 href={nextProject.cover_media?.url || nextProject.cover_image} 
                 x="0" y="0" width="1920" height="1080" 
                 preserveAspectRatio="xMidYMid slice" 
                 clipPath="url(#morphClip)" 
               />
             </svg>
          </div>

          {/* Title (Fixed position) */}
          <div id="next-project-text" className="relative z-20 flex flex-col items-center justify-end h-full gap-4 text-center px-6 pb-8 md:pb-12 pointer-events-none">
             <h1 className="text-white font-syne font-black text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight leading-none mix-blend-difference">
               {nextProject.title}
             </h1>
          </div>
        </section>
      </div>
      )}

    </div>
  );
}

// @ts-nocheck
import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Play, X, RotateCcw, ListVideo, Film } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ trialWarn: false });

import { useWorksTransition } from '../components/WorksTransitionContext';
import { HlsVideo } from '../../../shared/components/HlsVideo';

const shot = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const fallbackProjects = [];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [nextProject, setNextProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const nextSectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(true);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [manualOrientation, setManualOrientation] = useState<'auto' | 'landscape' | 'portrait'>('auto');

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

  useEffect(() => {
    const updateOrientation = () => {
      const mobile = window.innerWidth <= 820 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsMobilePortrait(mobile && portrait);
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
    };
  }, []);

  useEffect(() => {
    if (isCinemaMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCinemaMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isCinemaMode) {
        handleExitCinema();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isCinemaMode]);

  const handlePlayCinema = async (videoIndex?: number) => {
    if (typeof videoIndex === 'number') {
      setSelectedVideoIndex(videoIndex);
    }
    setIsCinemaMode(true);
    setManualOrientation('auto');
    setIsPlaylistOpen(true);

    // 1. Try native fullscreen on hero section (Android Chrome, Desktop, etc.)
    const el = heroRef.current;
    if (el) {
      const req = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
      if (req) {
        try {
          await req.call(el);
        } catch (e) {
          console.warn("Fullscreen request error", e);
        }
      }
    }

    // 2. Try Screen Orientation Lock API (locks to landscape on Android Chrome)
    try {
      if (window.screen?.orientation && (window.screen.orientation as any).lock) {
        await (window.screen.orientation as any).lock('landscape');
      } else if ((window.screen as any)?.lockOrientation) {
        (window.screen as any).lockOrientation('landscape');
      }
    } catch (e) {
      console.warn("Screen orientation lock error", e);
    }

    // 3. Unmute and play native video if present
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.play().catch(e => console.error("Play failed:", e));
      }
    }, 50);
  };

  const handleExitCinema = async () => {
    setIsCinemaMode(false);
    setManualOrientation('auto');

    // Unlock screen orientation if locked
    try {
      if (window.screen?.orientation && (window.screen.orientation as any).unlock) {
        (window.screen.orientation as any).unlock();
      } else if ((window.screen as any)?.unlockOrientation) {
        (window.screen as any).unlockOrientation();
      }
    } catch (e) {
      console.warn("Screen orientation unlock error", e);
    }

    // Exit native fullscreen if active
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      try {
        const exit = document.exitFullscreen || (document as any).webkitExitFullscreen;
        if (exit) await exit.call(document);
      } catch (e) {
        console.warn("Exit fullscreen error", e);
      }
    }

    // Mute and restore background loop for native video
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.controls = false;
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleManualOrientation = () => {
    setManualOrientation(prev => {
      if (prev === 'auto') return isMobilePortrait ? 'portrait' : 'landscape';
      return prev === 'landscape' ? 'portrait' : 'landscape';
    });
  };

  const shouldRotateLandscape = isCinemaMode && (
    manualOrientation === 'landscape' || (manualOrientation === 'auto' && isMobilePortrait)
  );

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

          // Extract all videos from project (supports comma-separated video_url and gallery video items)
          const rawVideoUrls = (data.video_url || data.videoUrl || "")
            .split(",")
            .map((u: string) => u.trim())
            .filter(Boolean);

          const galleryVideos = (data.gallery || [])
            .filter((g: any) => g.type === 'video' || g.folder === 'final video' || (g.url && (g.url.includes('.mp4') || g.bunny_video_id)))
            .map((g: any) => g.url)
            .filter(Boolean);

          const allUrls = Array.from(new Set([...rawVideoUrls, ...galleryVideos]));

          const videoList = allUrls.map((url, idx) => {
            const matchInGallery = (data.gallery || []).find((g: any) => g.url === url);
            const bunnyMatch = url.match(/(?:b-cdn\.net|mediadelivery\.net\/[^\/]+)\/([a-zA-Z0-9-]+)/);
            const bunnyId = matchInGallery?.bunny_video_id || (bunnyMatch ? bunnyMatch[1] : null);
            const bunnyThumbnail = bunnyId ? `https://vz-f1a07f87-b02.b-cdn.net/${bunnyId}/thumbnail.jpg` : null;

            return {
              id: matchInGallery?.id || `vid-${idx}`,
              url,
              title: matchInGallery?.name || (allUrls.length > 1 ? `Video Cut ${String(idx + 1).padStart(2, '0')}` : data.title),
              thumbnail: matchInGallery?.thumbnail_url || bunnyThumbnail || data.cover_media?.thumbnail_url || data.cover_media?.url || data.cover_image,
            };
          });

          const isVertical = Boolean(
            (data.format || "").toLowerCase().includes("short") ||
            (data.format || "").toLowerCase().includes("reels") ||
            (data.format || "").toLowerCase().includes("tiktok") ||
            (data.format || "").toLowerCase().includes("dọc") ||
            (data.format_slug || "").includes("short")
          );

          setProject({
            id: data.slug,
            title: data.title,
            client: data.client || "Self-Initiated",
            year: String(data.year),
            category: data.format || "Production",
            role: data.format || "Creative Production",
            description: data.summary || "A creative production showcase.",
            image: data.cover_media?.url || data.cover_image || shot("photo-1516321318423-f06f85e504b3"),
            video: videoList[0]?.url || null,
            videos: videoList,
            isVertical,
            behindTheScenes: data.gallery || [],
            credits: data.structured_credits || []
          });
        } else {
          // Fallback to local mock data
          const local = fallbackProjects.find(p => p.id === id);
          if (local) {
            const localVideos = (local.video ? [local.video] : []).map((url: string, idx: number) => ({
              id: `vid-${idx}`,
              url,
              title: local.title,
              thumbnail: local.image
            }));
            setProject({ ...local, video: localVideos[0]?.url || null, videos: localVideos, behindTheScenes: [] });
          } else {
            setProject(null);
          }
        }

        // Fetch all projects to determine next project
        try {
          const listRes = await fetch(`/api/v1/projects`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const allItems = listData.items || [];
            const items = allItems.filter((proj: any) => proj.published && !proj.locked);
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
    return () => {
       document.body.classList.remove("is-transitioning");
    };
  }, [nextProject]);

  const handleNextProjectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!nextProject) return;

    const section = nextSectionRef.current;
    const placeholder = document.getElementById("next-project-placeholder");
    
    if (section && placeholder) {
      document.body.classList.add("is-transitioning");

      const rect = section.getBoundingClientRect();

      // 1. Create a clone to animate safely in the body
      const clone = section.cloneNode(true) as HTMLElement;
      document.body.appendChild(clone);

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

  const renderVideoEmbed = (url: string, isCinema: boolean, posterImage?: string, keySuffix?: string) => {
    if (!url) {
      return (
        <img
          src={posterImage || project?.image}
          alt={project?.title || "Project Preview"}
          className="w-full h-full object-cover opacity-60"
        />
      );
    }
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    const bunnyLegacyMatch = url.match(/iframe\.mediadelivery\.net\/embed\//);

    let embedUrl = null;
    if (ytMatch) {
      embedUrl = isCinema 
        ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&playsinline=1`
        : `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1`;
    } else if (vmMatch) {
      embedUrl = isCinema 
        ? `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=0&controls=1`
        : `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1&controls=0&background=1`;
    } else if (bunnyLegacyMatch) {
      embedUrl = isCinema
        ? (url.includes("?") ? `${url}&autoplay=true&muted=false` : `${url}?autoplay=true&muted=false`)
        : (url.includes("?") ? `${url}&autoplay=true&loop=true&muted=true&background=true` : `${url}?autoplay=true&loop=true&muted=true&background=true`);
    }
    
    const nativeVideoUrl = url?.replace("/play_1080p.mp4", "/play_720p.mp4");
    
    if (embedUrl) {
      return (
        <iframe
          key={`iframe-${url}-${keySuffix || ''}`}
          src={embedUrl}
          className={`w-full h-full ${isCinema ? 'object-contain opacity-100 pointer-events-auto' : 'object-cover pointer-events-none opacity-85'}`}
          style={{ border: "none", transform: isCinema ? "scale(1)" : "scale(1.05)", transformOrigin: "center" }}
          allow="autoplay; fullscreen; picture-in-picture"
          title={project?.title || "Video"}
        />
      );
    } else {
      return (
        <HlsVideo 
          key={`hls-${url}-${keySuffix || ''}`}
          ref={isCinema ? videoRef : undefined}
          src={nativeVideoUrl}
          autoPlay
          loop={!isCinema} 
          muted={!isCinema} 
          controls={isCinema}
          playsInline
          lazyLoad={false}
          preload="auto"
          className={`w-full h-full transition-opacity duration-500 ${isCinema ? 'object-contain opacity-100 pointer-events-auto' : 'object-cover opacity-85 pointer-events-none'}`} 
          poster={posterImage || project?.image}
        />
      );
    }
  };

  const isVertical = Boolean(
    project?.isVertical ||
    project?.category?.toLowerCase().includes("short") ||
    project?.category?.toLowerCase().includes("reels") ||
    project?.category?.toLowerCase().includes("tiktok") ||
    project?.category?.toLowerCase().includes("dọc")
  );

  const baseVideos = (project?.videos || []).map((v: any, i: number) => ({ ...v, originalIndex: i }));
  const minItems = isVertical ? 6 : 4;
  const repeatCount = baseVideos.length > 0 ? Math.max(1, Math.ceil(minItems / baseVideos.length)) : 1;
  const marqueeItems = Array.from({ length: repeatCount }, () => baseVideos).flat();

  const currentCinemaVideo = (project?.videos && project.videos[selectedVideoIndex]) || (project?.videos && project.videos[0]) || { url: project?.video, title: project?.title };

  return (
    <div id="project-detail-container" className="min-h-screen bg-black relative">
      {/* Back Button Overlay */}
      {!isCinemaMode && (
        <button 
          onClick={() => navigate('/works')} 
          className="fixed top-24 left-6 md:left-12 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#EB5B00] hover:border-[#EB5B00] hover:text-black transition-all group outline-none"
          aria-label="Back to Works"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      {/* Full Height Video / Hero Section */}
      <section 
        ref={heroRef} 
        className={
          isCinemaMode 
            ? "fixed inset-0 w-screen h-screen bg-black overflow-hidden z-[9999] flex items-center justify-center" 
            : "sticky top-0 w-full h-[100svh] bg-black overflow-hidden z-0"
        }
      >
        <motion.div 
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
          style={isCinemaMode ? { y: 0, opacity: 1 } : { y: bgY, opacity: heroOpacity }}
        >
          {/* Cinema Top Controls */}
          {isCinemaMode && (
            <div 
              className="absolute top-6 right-6 z-[10002] flex items-center gap-3 transition-all duration-300 pointer-events-auto"
            >
              {project?.videos && project.videos.length > 1 && (
                <button
                  onClick={() => setIsPlaylistOpen(prev => !prev)}
                  className={`px-3.5 py-2 h-11 backdrop-blur-md border rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all outline-none shadow-xl cursor-pointer ${
                    isPlaylistOpen 
                      ? "bg-[#EB5B00] text-black border-[#EB5B00]" 
                      : "bg-black/60 hover:bg-black/90 text-white border-white/20 hover:text-[#EB5B00]"
                  }`}
                  title="Danh sách Video Media"
                >
                  <ListVideo size={16} />
                  <span className="hidden sm:inline">Videos</span>
                  <span className="font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">
                    {selectedVideoIndex + 1}/{project.videos.length}
                  </span>
                </button>
              )}
              {isMobile && (
                <button
                  onClick={toggleManualOrientation}
                  className="w-11 h-11 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:text-[#EB5B00] transition-all outline-none shadow-xl cursor-pointer"
                  title="Xoay hướng màn hình"
                  aria-label="Toggle Screen Orientation"
                >
                  <RotateCcw size={18} />
                </button>
              )}
              <button
                onClick={handleExitCinema}
                className="w-11 h-11 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:text-[#EB5B00] transition-all outline-none shadow-xl cursor-pointer"
                title="Thoát chế độ toàn màn hình"
                aria-label="Exit Cinema Mode"
              >
                <X size={22} />
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div
            className={`transition-all duration-300 flex items-center justify-center bg-black overflow-hidden ${
              shouldRotateLandscape
                ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                : "w-full h-full relative"
            }`}
            style={
              shouldRotateLandscape
                ? {
                    width: '100svh',
                    height: '100svw',
                    maxWidth: '100svh',
                    maxHeight: '100svw',
                  }
                : { width: '100%', height: '100%' }
            }
          >
            {isCinemaMode ? (
              /* Cinema Mode: Main Video Player with Video Selector beside it */
              <div className="w-full h-full flex flex-row relative bg-black overflow-hidden">
                {/* Full-bleed ambient backdrop for vertical videos in cinema mode */}
                {isVertical && currentCinemaVideo?.thumbnail && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-20 blur-3xl scale-125 z-0">
                    <img src={currentCinemaVideo.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Video Player */}
                <div className="flex-1 h-full relative flex items-center justify-center bg-black/90 overflow-hidden z-10">
                  {renderVideoEmbed(currentCinemaVideo?.url, true, currentCinemaVideo?.thumbnail, `cinema-${selectedVideoIndex}`)}
                </div>

                {/* Video Selector Area beside player */}
                {project?.videos && project.videos.length > 1 && (
                  <div 
                    className={`transition-all duration-300 z-40 flex flex-col bg-black/90 backdrop-blur-2xl border-l border-white/10 ${
                      isPlaylistOpen 
                        ? "w-80 md:w-96 translate-x-0" 
                        : "w-0 translate-x-full overflow-hidden border-none"
                    } ${
                      "absolute right-0 top-0 h-full md:relative"
                    }`}
                  >
                    {/* Header of Video Selector */}
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ListVideo size={18} className="text-[#EB5B00]" />
                        <div>
                          <h3 className="text-white text-xs uppercase tracking-widest font-bold">Video Media</h3>
                          <p className="text-white/40 text-[11px]">{project.videos.length} videos available</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsPlaylistOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Đóng danh sách"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Video Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                      {project.videos.map((vid: any, idx: number) => {
                        const isSelected = selectedVideoIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedVideoIndex(idx);
                              setTimeout(() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = 0;
                                  videoRef.current.muted = false;
                                  videoRef.current.play().catch(() => {});
                                }
                              }, 50);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3.5 group cursor-pointer ${
                              isSelected
                                ? "bg-[#EB5B00]/15 border-[#EB5B00] shadow-[0_0_20px_rgba(235,91,0,0.2)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                              {vid.thumbnail ? (
                                <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                  <Film size={18} className="text-white/40" />
                                </div>
                              )}
                              <div className={`absolute inset-0 flex items-center justify-center ${
                                isSelected ? "bg-[#EB5B00]/40" : "bg-black/30 group-hover:bg-black/10"
                              }`}>
                                {isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-[#EB5B00] flex items-center justify-center shadow-md">
                                    <Play size={10} className="text-black ml-0.5" fill="currentColor" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Play size={10} className="text-white ml-0.5" fill="currentColor" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected ? "bg-[#EB5B00] text-black" : "bg-white/10 text-white/60"
                                }`}>
                                  0{idx + 1}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-[#EB5B00] uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    ● Playing
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs md:text-sm font-semibold truncate ${
                                isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                              }`}>
                                {vid.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : project?.videos && project.videos.length > 1 ? (
              /* Preview Mode with Multiple Videos: Full-screen Infinite Running Carousel */
              <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-start bg-black">
                {/* Full screen ambient blurred background glow */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                  {renderVideoEmbed(project.videos[0]?.url, false, project.videos[0]?.thumbnail, 'ambient-bg')}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/70" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
                </div>

                {/* Marquee Track: Seamless Infinite Running Carousel */}
                <div 
                  className="flex flex-row flex-nowrap items-center h-full animate-marquee-carousel relative z-10 select-none py-0"
                  style={{ width: "max-content", willChange: "transform" }}
                >
                  {/* Set 1 */}
                  {marqueeItems.map((vid: any, idx: number) => {
                    const originalIdx = vid.originalIndex ?? (idx % project.videos.length);
                    return (
                      <div 
                        key={`set1-${idx}`}
                        onClick={() => handlePlayCinema(originalIdx)}
                        className={`h-full ${
                          isVertical 
                            ? "aspect-[9/16] max-h-[100svh]" 
                            : "aspect-video max-h-[100svh]"
                        } flex-shrink-0 relative overflow-hidden group cursor-pointer border-x border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-neutral-950`}
                      >
                        {renderVideoEmbed(vid.url, false, vid.thumbnail, `set1-${idx}`)}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/5 transition-colors pointer-events-none" />

                        {/* Hover Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="w-14 h-14 rounded-full bg-[#EB5B00] backdrop-blur-md flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play size={22} className="ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Set 2 (Exact duplicate for seamless infinite loop) */}
                  {marqueeItems.map((vid: any, idx: number) => {
                    const originalIdx = vid.originalIndex ?? (idx % project.videos.length);
                    return (
                      <div 
                        key={`set2-${idx}`}
                        onClick={() => handlePlayCinema(originalIdx)}
                        className={`h-full ${
                          isVertical 
                            ? "aspect-[9/16] max-h-[100svh]" 
                            : "aspect-video max-h-[100svh]"
                        } flex-shrink-0 relative overflow-hidden group cursor-pointer border-x border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-neutral-950`}
                      >
                        {renderVideoEmbed(vid.url, false, vid.thumbnail, `set2-${idx}`)}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/5 transition-colors pointer-events-none" />

                        {/* Hover Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="w-14 h-14 rounded-full bg-[#EB5B00] backdrop-blur-md flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play size={22} className="ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Preview Mode with Single Video or Image */
              renderVideoEmbed(project?.video, false, project?.image, 'single-preview')
            )}
          </div>
        </motion.div>
        
        {/* Title Overlay */}
        <motion.div 
          className={`absolute inset-0 flex flex-col justify-end p-6 md:px-12 pb-8 md:pb-12 max-w-7xl mx-auto w-full z-10 transition-opacity duration-500 ${isCinemaMode ? 'opacity-0 pointer-events-none' : ''}`}
          style={{ y: titleY, opacity: isCinemaMode ? 0 : textOpacity }}
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

        {/* Play Button */}
        {!isCinemaMode && (project.videos?.length > 0 || project.video) && (
          <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-20 pointer-events-none">
            <button 
              onClick={() => handlePlayCinema(0)}
              className="w-16 h-16 md:w-20 md:h-20 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#EB5B00] hover:border-[#EB5B00] hover:text-black hover:scale-105 transition-all duration-300 pointer-events-auto group outline-none shadow-lg cursor-pointer"
              aria-label="Play Video Fullscreen"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 ml-1.5 group-hover:scale-110 transition-transform" fill="currentColor" />
            </button>
          </div>
        )}
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
                     <div key={index} className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] xl:grid-cols-[160px_1fr] items-baseline gap-4 pb-4 border-b border-white/5">
                        <span className="text-[#EB5B00] text-xs font-semibold uppercase tracking-widest leading-snug break-words">{role}</span>
                        <span className="text-white text-base font-medium leading-snug">{names.join(", ")}</span>
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
            {/* Background Image with Object Cover (Avoids cropping/squashing bugs) */}
          <div ref={wrapperRef} id="morphing-wrapper" className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-60 transition-opacity duration-700 group-hover:opacity-100">
             <img 
               id="morphing-image"
               src={nextProject.cover_media?.url || nextProject.cover_image} 
               alt={nextProject.title}
               className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
             />
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

import React, { createContext, useContext, useState, ReactNode, useCallback, startTransition, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorksTransitionOverlay } from './WorksTransitionOverlay';

type WorksTransitionContextType = {
  navigateToWorks: () => void;
};

const WorksTransitionContext = createContext<WorksTransitionContextType>({
  navigateToWorks: () => {},
});

export const useWorksTransition = () => useContext(WorksTransitionContext);

export function WorksTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToWorks = useCallback(() => {
    // If already on works page or already transitioning, do nothing
    if (location.pathname === '/works' || isTransitioning) return;
    setIsTransitioning(true);
    setIsNavigating(false); // Reset navigation state
  }, [location.pathname, isTransitioning]);

  // Preload cors-proxy images in the background to prevent transition lag
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const res = await fetch("/api/v1/projects/all");
        if (res.ok) {
          const rawData = await res.json();
          const allProjects = Array.isArray(rawData) ? rawData : (rawData.items || []);
          const publishedProjects = allProjects.filter((p: any) => p.published);
          const imageUrls = publishedProjects.map((p: any) => p.cover_media?.url || p.cover_image || p.cover_media?.thumbnail_url).filter(Boolean);
          
          const apiUrl = import.meta.env.VITE_API_URL || "/api/v1";
          const head = document.head;
          
          // Preload unique URLs
          const uniqueUrls = Array.from(new Set(imageUrls));
          
          uniqueUrls.forEach((url: any) => {
            const proxyUrl = `${apiUrl}/media/cors-proxy?url=${encodeURIComponent(url)}`;
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
            link.href = proxyUrl;
            head.appendChild(link);
          });
        }
      } catch (e) {
        console.warn("Transition preload failed", e);
      }
    };

    // Delay by 2 seconds to not block initial page load
    const timer = setTimeout(preloadImages, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnimationNavigate = useCallback(() => {
    if (!isNavigating) {
      setIsNavigating(true);
      startTransition(() => {
        navigate('/works');
      });
    }
  }, [isNavigating, navigate]);

  const handleAnimationComplete = useCallback(() => {
    setIsTransitioning(false);
    setIsNavigating(false);
  }, []);

  return (
    <WorksTransitionContext.Provider value={{ navigateToWorks }}>
      {children}
      {isTransitioning && (
        <WorksTransitionOverlay 
          onNavigate={handleAnimationNavigate}
          onComplete={handleAnimationComplete} 
        />
      )}
    </WorksTransitionContext.Provider>
  );
}

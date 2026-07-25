import React, { createContext, useContext, useState, ReactNode, useCallback, startTransition } from 'react';
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

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingTransitionOverlay } from './LandingTransitionOverlay';

interface LandingTransitionContextType {
  navigateToLanding: () => void;
}

const LandingTransitionContext = createContext<LandingTransitionContextType>({
  navigateToLanding: () => {},
});

export function useLandingTransition() {
  return useContext(LandingTransitionContext);
}

export function LandingTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      setIsTransitioning(true);
    } else {
      setIsTransitioning(false);
    }
  }, [location.pathname]);

  const handleComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const navigateToLanding = useCallback(() => {
    if (location.pathname === '/') {
      // Force re-trigger transition if already on landing page
      setIsTransitioning(false);
      setTimeout(() => setIsTransitioning(true), 10);
    } else {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  return (
    <LandingTransitionContext.Provider value={{ navigateToLanding }}>
      {children}
      {isTransitioning && (
        <LandingTransitionOverlay 
          onComplete={handleComplete} 
        />
      )}
    </LandingTransitionContext.Provider>
  );
}

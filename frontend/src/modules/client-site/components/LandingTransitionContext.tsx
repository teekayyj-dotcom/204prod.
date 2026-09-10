import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { LandingTransitionOverlay } from './LandingTransitionOverlay';

interface LandingTransitionContextType {
}

const LandingTransitionContext = createContext<LandingTransitionContextType>({});

export function useLandingTransition() {
  return useContext(LandingTransitionContext);
}

export function LandingTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

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

  return (
    <LandingTransitionContext.Provider value={{}}>
      {children}
      {isTransitioning && (
        <LandingTransitionOverlay 
          onComplete={handleComplete} 
        />
      )}
    </LandingTransitionContext.Provider>
  );
}

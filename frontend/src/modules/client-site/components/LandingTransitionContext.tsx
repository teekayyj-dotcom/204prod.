import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingTransitionOverlay } from './LandingTransitionOverlay';

interface LandingTransitionContextType {
  navigateToLanding: () => void;
}

const LandingTransitionContext = createContext<LandingTransitionContextType | undefined>(undefined);

export function useLandingTransition() {
  const context = useContext(LandingTransitionContext);
  if (!context) {
    throw new Error('useLandingTransition must be used within a LandingTransitionProvider');
  }
  return context;
}

export function LandingTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const navigateToLanding = useCallback(() => {
    navigate('/');
  }, [navigate]);



  return (
    <LandingTransitionContext.Provider value={{ navigateToLanding }}>
      {children}
    </LandingTransitionContext.Provider>
  );
}

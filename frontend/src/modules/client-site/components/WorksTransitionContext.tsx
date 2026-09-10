import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type WorksTransitionContextType = {
  navigateToWorks: () => void;
};

const WorksTransitionContext = createContext<WorksTransitionContextType>({
  navigateToWorks: () => {},
});

export const useWorksTransition = () => useContext(WorksTransitionContext);

export function WorksTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToWorks = useCallback(() => {
    if (location.pathname === '/works') return;
    navigate('/works');
  }, [location.pathname, navigate]);

  return (
    <WorksTransitionContext.Provider value={{ navigateToWorks }}>
      {children}
    </WorksTransitionContext.Provider>
  );
}

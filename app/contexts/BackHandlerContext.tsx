import React, { createContext, ReactNode, useContext, useState } from 'react';

interface BackHandlerContextType {
  canGoBack: boolean;
  setCanGoBack: (value: boolean) => void;
}

const BackHandlerContext = createContext<BackHandlerContextType | undefined>(undefined);

export const useBackHandler = () => {
  const context = useContext(BackHandlerContext);
  if (!context) {
    throw new Error('useBackHandler must be used within a BackHandlerProvider');
  }
  return context;
};

interface BackHandlerProviderProps {
  children: ReactNode;
}

export const BackHandlerProvider: React.FC<BackHandlerProviderProps> = ({ children }) => {
  const [canGoBack, setCanGoBack] = useState(true);

  return (
    <BackHandlerContext.Provider value={{ canGoBack, setCanGoBack }}>
      {children}
    </BackHandlerContext.Provider>
  );
};

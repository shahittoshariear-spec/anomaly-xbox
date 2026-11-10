import React from 'react';
import {AnomalyPalette, resolvePalette} from './palette';

const AnomalyThemeContext = React.createContext<AnomalyPalette>(
  resolvePalette(),
);

export const AnomalyThemeProvider: React.FC<{
  themeId?: string;
  children: React.ReactNode;
}> = ({themeId, children}) => {
  const palette = React.useMemo(() => resolvePalette(themeId), [themeId]);
  return (
    <AnomalyThemeContext.Provider value={palette}>
      {children}
    </AnomalyThemeContext.Provider>
  );
};

export const useAnomalyTheme = () => React.useContext(AnomalyThemeContext);

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const backgrounds = [
  { id: 'default', name: 'Default', value: '#0a192f' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #1a3a5c 0%, #0a192f 100%)' },
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #2d1b4e 0%, #1a0a2e 100%)' },
  { id: 'forest', name: 'Forest', value: 'linear-gradient(135deg, #1a2f1a 0%, #0a1a0f 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' },
  { id: 'warm', name: 'Warm', value: 'linear-gradient(135deg, #2a1a0a 0%, #1a0a00 100%)' },
  { id: 'glass', name: 'Glass', value: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' },
];

export const ThemeProvider = ({ children }) => {
  const [background, setBackground] = useState(() => {
    return localStorage.getItem('appBackground') || 'default';
  });

  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    localStorage.setItem('appBackground', background);
  }, [background]);

  const getBackgroundStyle = () => {
    const bg = backgrounds.find(b => b.id === background);
    return bg ? bg.value : backgrounds[0].value;
  };

  return (
    <ThemeContext.Provider value={{
      background,
      setBackground,
      backgrounds,
      showSelector,
      setShowSelector,
      getBackgroundStyle
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
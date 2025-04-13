import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('solana-rps-theme');
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      return savedTheme as Theme;
    }
    // Use system preference as fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Update document when theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      document.body.style.backgroundColor = '#121212';
      document.body.style.color = '#e0e0e0';
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      document.body.style.backgroundColor = '#f5f5f5';
      document.body.style.color = '#333333';
    }

    // Save preference to localStorage
    localStorage.setItem('solana-rps-theme', theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('solana-rps-theme');
      // Only apply system preference if user hasn't set a preference
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Add event listener with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - older browsers
      mediaQuery.addListener(handleChange);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

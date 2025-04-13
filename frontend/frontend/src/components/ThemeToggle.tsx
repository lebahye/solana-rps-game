import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Get the appropriate icon based on the current theme
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️'; // Sun for light mode
      case 'dark':
        return '🌙'; // Moon for dark mode
      case 'system':
        return '⚙️'; // Gear for system preference
      default:
        return '🌓'; // Half moon as fallback
    }
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch theme, current theme: ${theme}`}
      title={`Current theme: ${theme}`}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;

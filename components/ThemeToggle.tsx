import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${className}
        relative inline-flex items-center justify-center
        rounded-full border-2 
        bg-theme-primary border-theme-primary
        text-theme-primary
        hover:bg-theme-secondary 
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        transition-all duration-300 ease-in-out
        shadow-md hover:shadow-lg
      `}
      title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
    >
      {/* Iconos con animación de transición */}
      <div className="relative">
        {/* Sol (tema claro) */}
        <SunIcon 
          className={`
            ${iconSize[size]}
            absolute inset-0 transition-all duration-300
            ${theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-50'
            }
          `} 
        />
        
        {/* Luna (tema oscuro) */}
        <MoonIcon 
          className={`
            ${iconSize[size]}
            absolute inset-0 transition-all duration-300
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-50'
            }
          `} 
        />
      </div>
      
      {/* Indicador visual adicional */}
      <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full 
        ${theme === 'dark' ? 'bg-yellow-400' : 'bg-blue-500'}
        transition-colors duration-300
      `} />
    </button>
  );
};

export default ThemeToggle;
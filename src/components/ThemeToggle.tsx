import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="btn-theme-toggle"
      aria-label={isDark ? 'Cambiar a Modo Claro de alto contraste' : 'Cambiar a Modo Oscuro'}
      title={isDark ? 'Cambiar a Modo Claro (Alto Contraste)' : 'Cambiar a Modo Oscuro (Slate 950)'}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer select-none ${
        isDark
          ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50'
          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-300" />
          {showLabel && <span>Modo Claro</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-sky-300 animate-in spin-in-180 duration-300" />
          {showLabel && <span>Modo Oscuro</span>}
        </>
      )}
    </button>
  );
};

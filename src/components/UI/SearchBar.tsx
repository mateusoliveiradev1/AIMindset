import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: string[];
  onSelectSuggestion?: (value: string) => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar artigos...",
  className = "",
  showClearButton = true,
  onFocus,
  onBlur,
  suggestions = [],
  onSelectSuggestion,
  isLoading = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % suggestions.length);
    }
    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setHighlightIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    }
    if (e.key === 'Enter' && suggestions.length > 0 && highlightIndex >= 0) {
      e.preventDefault();
      const sel = suggestions[highlightIndex];
      if (sel) {
        onSelectSuggestion?.(sel);
      }
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Search Icon */}
      <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
        isFocused ? 'text-lime-green scale-110' : 'text-futuristic-gray'
      }`}>
        <Search className="w-5 h-5" />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-12 py-4 
          bg-dark-surface/60 backdrop-blur-sm
          border-2 border-neon-purple/30 
          rounded-xl text-white placeholder-futuristic-gray/70
          transition-all duration-300 ease-out
          hover:border-neon-purple/50 hover:bg-dark-surface/80
          focus:outline-none focus:border-lime-green focus:ring-2 focus:ring-lime-green/20
          focus:bg-dark-surface/90 focus:shadow-lg focus:shadow-lime-green/10
          ${isFocused ? 'transform scale-[1.02]' : ''}
        `}
      />

      {/* Clear Button */}
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className={`
            absolute right-4 top-1/2 transform -translate-y-1/2
            p-1 rounded-full transition-all duration-200
            hover:bg-futuristic-gray/20 hover:scale-110
            text-futuristic-gray hover:text-white
          `}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lime-green" />
        </div>
      )}

      {/* Focus Ring Effect */}
      <div className={`
        absolute inset-0 rounded-xl pointer-events-none
        transition-all duration-300
        ${isFocused ? 'ring-2 ring-lime-green/30 ring-offset-2 ring-offset-dark-bg' : ''}
      `} />

      {/* Glow Effect */}
      <div className={`
        absolute inset-0 rounded-xl pointer-events-none
        transition-all duration-500
        ${isFocused ? 'shadow-lg shadow-lime-green/20' : ''}
      `} />
      {isFocused && suggestions.length > 0 && (
        <div className="absolute mt-2 left-0 right-0 bg-dark-surface/90 backdrop-blur-sm border-2 border-neon-purple/30 rounded-xl shadow-lg z-10">
          <ul className="max-h-48 overflow-auto py-2">
            {suggestions.map((s, idx) => (
              <li
                key={`${s}-${idx}`}
                onMouseDown={() => onSelectSuggestion?.(s)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-4 py-2 text-white cursor-pointer transition-colors duration-200 ${highlightIndex === idx ? 'bg-neon-purple/30' : 'hover:bg-neon-purple/20'}`}
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
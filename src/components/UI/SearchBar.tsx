import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar artigos...",
  className = "",
  showClearButton = true,
  onFocus,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
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
    </div>
  );
};

export default SearchBar;
import React, { useState } from 'react';
import { Zap, Info } from 'lucide-react';

interface VirtualizationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
  showTooltip?: boolean;
}

const VirtualizationToggle: React.FC<VirtualizationToggleProps> = ({
  enabled,
  onChange,
  className = "",
  showTooltip = true
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <label className="flex items-center gap-3 cursor-pointer group">
        {/* Custom Checkbox */}
        <div className="relative">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={`
            w-5 h-5 rounded border-2 transition-all duration-300 ease-out
            ${enabled 
              ? 'bg-lime-green border-lime-green shadow-lg shadow-lime-green/30' 
              : 'border-neon-purple/50 bg-dark-surface/60'
            }
            group-hover:border-lime-green/70 group-hover:shadow-md group-hover:shadow-lime-green/20
          `}>
            {enabled && (
              <svg 
                className="w-3 h-3 text-dark-bg absolute top-0.5 left-0.5 transition-all duration-200" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </div>
        </div>

        {/* Label */}
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 transition-colors duration-200 ${
            enabled ? 'text-lime-green' : 'text-futuristic-gray'
          }`} />
          <span className={`text-sm font-medium transition-colors duration-200 ${
            enabled ? 'text-white' : 'text-futuristic-gray'
          } group-hover:text-white`}>
            Virtualização
          </span>
          
          {/* Info Icon */}
          {showTooltip && (
            <button
              type="button"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="text-futuristic-gray hover:text-lime-green transition-colors duration-200"
            >
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>
      </label>

      {/* Tooltip */}
      {showTooltip && showInfo && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-dark-surface/95 backdrop-blur-md border border-neon-purple/30 rounded-lg p-3 shadow-xl shadow-black/50 max-w-xs">
            <p className="text-xs text-futuristic-gray leading-relaxed">
              A virtualização melhora a performance ao renderizar apenas os itens visíveis na tela. 
              Recomendado para listas com mais de 50 artigos.
            </p>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neon-purple/30"></div>
          </div>
        </div>
      )}

      {/* Performance Indicator */}
      {enabled && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-lime-green rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default VirtualizationToggle;
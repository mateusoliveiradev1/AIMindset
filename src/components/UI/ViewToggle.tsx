import React from 'react';
import { Grid, List, LayoutGrid, Rows } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center bg-dark-surface/60 backdrop-blur-sm rounded-lg border border-neon-purple/30 ${className}`}>
      {/* Grid View Button */}
      <button
        onClick={() => onViewModeChange('grid')}
        className={`
          ${sizeClasses[size]} rounded-l-lg transition-all duration-300 ease-out
          ${viewMode === 'grid' 
            ? 'bg-lime-green text-dark-bg shadow-lg shadow-lime-green/20' 
            : 'text-futuristic-gray hover:text-white hover:bg-neon-purple/10'
          }
        `}
        title="Visualização em Grade"
      >
        <LayoutGrid className={iconSizeClasses[size]} />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-neon-purple/30"></div>

      {/* List View Button */}
      <button
        onClick={() => onViewModeChange('list')}
        className={`
          ${sizeClasses[size]} rounded-r-lg transition-all duration-300 ease-out
          ${viewMode === 'list' 
            ? 'bg-lime-green text-dark-bg shadow-lg shadow-lime-green/20' 
            : 'text-futuristic-gray hover:text-white hover:bg-neon-purple/10'
          }
        `}
        title="Visualização em Lista"
      >
        <Rows className={iconSizeClasses[size]} />
      </button>
    </div>
  );
};

export default ViewToggle;
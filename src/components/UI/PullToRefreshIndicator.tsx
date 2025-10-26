import React from 'react';
import { RotateCcw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  isPulling: boolean;
  isThresholdReached: boolean;
  style?: React.CSSProperties;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isRefreshing,
  isPulling,
  isThresholdReached,
  style
}) => {
  if (!isPulling && !isRefreshing) return null;

  return (
    <div 
      className="flex justify-center items-center py-4 text-futuristic-blue"
      style={style}
    >
      <div className="flex flex-col items-center space-y-2">
        <RotateCcw 
          className={`w-6 h-6 transition-all duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          } ${
            isThresholdReached ? 'text-futuristic-green' : 'text-futuristic-blue'
          }`}
        />
        <span className="text-xs font-medium">
          {isRefreshing 
            ? 'Atualizando...' 
            : isThresholdReached 
              ? 'Solte para atualizar' 
              : 'Puxe para atualizar'
          }
        </span>
      </div>
    </div>
  );
};
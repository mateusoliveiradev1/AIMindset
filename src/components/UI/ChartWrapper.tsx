import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  height = 320,
  minWidth = 300,
  minHeight = 320,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: minWidth, height: minHeight });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(rect.width || minWidth, minWidth);
        const newHeight = Math.max(rect.height || minHeight, minHeight);
        
        console.log('📊 ChartWrapper - Dimensões calculadas:', { 
          rectWidth: rect.width, 
          rectHeight: rect.height,
          finalWidth: newWidth, 
          finalHeight: newHeight 
        });
        
        setDimensions({ width: newWidth, height: newHeight });
        setIsReady(true);
      }
    };

    // Aguardar um tick para garantir que o DOM esteja pronto
    const timer = setTimeout(() => {
      updateDimensions();
    }, 100);

    // Observer para mudanças de tamanho
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [minWidth, minHeight]);

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ 
        height: `${height}px`,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`
      }}
    >
      {isReady && dimensions.width > 0 && dimensions.height > 0 ? (
        <ResponsiveContainer 
          width="100%" 
          height="100%"
          minWidth={minWidth}
          minHeight={minHeight}
          aspect={undefined}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        <div 
          className="flex items-center justify-center bg-darker-surface/20 rounded-lg"
          style={{ height: `${height}px` }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
          <span className="ml-2 text-futuristic-gray text-sm">Carregando gráfico...</span>
        </div>
      )}
    </div>
  );
};

export default ChartWrapper;
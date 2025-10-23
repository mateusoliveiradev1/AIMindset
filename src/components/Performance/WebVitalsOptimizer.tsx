import React from 'react';

interface WebVitalsOptimizerProps {
  enableReporting?: boolean;
  enableOptimizations?: boolean;
  reportingEndpoint?: string;
  thresholds?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
}

// WebVitalsOptimizer COMPLETAMENTE DESABILITADO
export const WebVitalsOptimizer: React.FC<WebVitalsOptimizerProps> = () => {
  // TODOS OS SISTEMAS DE MONITORAMENTO DESABILITADOS
  // Não renderiza nada e não executa qualquer processamento
  return null;
};

export default WebVitalsOptimizer;
import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO timestamp
  className?: string;
  showProgress?: boolean; // mostra barra de progresso horizontal
}

// Função para formatar o tempo de forma mobile-friendly
const formatTimeRemaining = (timeLeft: number): string => {
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  // Mobile-first: formatos inteligentes baseado no tempo restante
  if (timeLeft < 60 * 60 * 1000) { // Menos de 1 hora
    return `Faltam ${minutes}min`;
  } else if (timeLeft < 24 * 60 * 60 * 1000) { // Menos de 24 horas
    return `Em ${hours}h ${minutes}m`;
  } else { // Mais de 24 horas
    const targetDate = new Date();
    targetDate.setTime(targetDate.getTime() + timeLeft);
    const hours = targetDate.getHours();
    return `Amanhã às ${hours}h`;
  }
};

// Componente otimizado para mobile - 60fps garantido
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '', showProgress = false }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  useEffect(() => {
    const targetTime = new Date(targetDate).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime - now);
      
      setTimeLeft(remaining);
      setIsUrgent(remaining < 60 * 60 * 1000); // Menos de 1h = urgente
      if (totalDuration === 0) {
        // Define a duração total na primeira atualização
        setTotalDuration(remaining);
      }
      
      // Auto-cleanup quando chegar a 0
      if (remaining === 0) {
        clearInterval(interval);
      }
    };

    // Atualização imediata
    updateTimer();
    
    // Atualização a cada segundo (otimizado para mobile)
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);

  // Não renderiza se já passou
  if (timeLeft <= 0) return null;

  const progress = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100)) : 0;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`text-sm font-medium ${
        isUrgent 
          ? 'text-red-500 animate-pulse' 
          : 'text-white/90'
      }`}>
        {formatTimeRemaining(timeLeft)}
      </span>
      {isUrgent && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      {showProgress && (
        <div className="relative w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full bg-gradient-to-r from-lime-400 to-fuchsia-500 transition-[width] duration-300 ease-out ${isUrgent ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
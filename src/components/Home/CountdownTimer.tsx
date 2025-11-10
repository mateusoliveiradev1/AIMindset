import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO timestamp
  className?: string;
  showProgress?: boolean; // mostra barra de progresso horizontal
}

// Função para formatar o tempo de forma mobile-friendly
const formatTimeRemaining = (timeLeft: number): string => {
  const now = new Date();
  const target = new Date(now.getTime() + timeLeft);

  // Diferença de dias com base no calendário local (corrige "amanhã" indevido)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const daysDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  // Regras desejadas:
  // - Hoje (mesmo dia): "publica hoje" (com urgência em minutos quando < 1h)
  // - Amanhã: "publica amanhã"
  // - 2 dias ou mais: "publica em X dias"
  if (daysDiff >= 2) {
    return `publica em ${daysDiff} dias`;
  }
  if (daysDiff === 1) {
    return 'publica amanhã';
  }

  // daysDiff === 0 -> hoje
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  if (timeLeft < 60 * 60 * 1000) { // Menos de 1 hora
    return `Faltam ${minutes}min`;
  }
  // Hoje, mas não urgente
  return 'publica hoje';
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
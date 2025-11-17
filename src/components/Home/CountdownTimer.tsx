import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO timestamp
  className?: string;
  showProgress?: boolean; // mostra barra de progresso horizontal
  progressOnHover?: boolean; // barra/percentual visíveis apenas no hover do grupo
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
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '', showProgress = false, progressOnHover = false }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  useEffect(() => {
    const targetTime = new Date(targetDate).getTime();
    let timer: any;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime - now);

      setTimeLeft(remaining);
      const urgent = remaining < 60 * 60 * 1000;
      setIsUrgent(urgent);
      if (totalDuration === 0) {
        setTotalDuration(remaining);
      }

      if (remaining === 0) return;

      const delay = urgent ? 1000 : 60000;
      timer = setTimeout(tick, delay);
    };

    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [targetDate, totalDuration]);

  // Não renderiza se já passou
  if (timeLeft <= 0) return null;

  const progress = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100)) : 0;
  const severityClass = timeLeft <= 60 * 60 * 1000
    ? 'from-red-500 to-red-400'
    : timeLeft <= 6 * 60 * 60 * 1000
      ? 'from-amber-400 to-amber-500'
      : 'from-lime-400 to-fuchsia-500';
  const targetLabel = new Date(targetDate).toLocaleString('pt-BR');
  const progressVisibilityClass = progressOnHover ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200' : '';
  const animationDuration = isUrgent ? 1000 : 60000;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} title={targetLabel}>
      <span className={`text-sm font-medium ${
        isUrgent 
          ? 'text-red-500 animate-pulse' 
          : 'text-white/90'
      }`} aria-live="polite">
        {formatTimeRemaining(timeLeft)}
      </span>
      {isUrgent && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      {showProgress && (
        <div
          className={`relative w-32 h-2 bg-white/20 rounded-full overflow-hidden ${progressVisibilityClass}`}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${severityClass} ease-out ${isUrgent ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%`, transition: `width ${animationDuration}ms linear`, willChange: 'width' }}
          />
          <div className="absolute inset-0 progress-shimmer" />
        </div>
      )}
      {showProgress && (
        <span className={`text-xs text-white/80 ${progressVisibilityClass}`}>{Math.round(progress)}%</span>
      )}
    </div>
  );
};
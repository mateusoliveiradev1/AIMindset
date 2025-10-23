import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'neon';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
}) => {
  const baseClasses = 'rounded-lg transition-all duration-300';
  
  const variants = {
    default: 'bg-dark-surface border border-neon-purple/20',
    glass: 'glass-effect',
    neon: 'neon-border bg-dark-surface/50',
  };
  
  const hoverClasses = hover ? 'hover-lift hover:shadow-lg hover:shadow-neon-purple/10' : '';
  
  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
export { Card };
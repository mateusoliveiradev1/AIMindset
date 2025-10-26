import React from 'react';
import { cn } from '../../utils/cn';
import { useTouchFeedback } from '../../hooks/useTouchFeedback';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}, ref) => {
  // Touch feedback hook
  const { touchFeedbackProps } = useTouchFeedback({
    type: variant === 'primary' ? 'primary' : variant === 'secondary' ? 'secondary' : 'primary',
    disabled
  });

  const baseClasses = 'inline-flex items-center justify-center font-montserrat font-semibold rounded-lg transition-all duration-300 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-purple disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-neon-gradient text-white hover:shadow-lg hover:shadow-neon-purple/25 neon-border',
    secondary: 'bg-lime-green text-primary-dark hover:bg-lime-green/90 hover:shadow-lg hover:shadow-lime-green/25',
    outline: 'border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white neon-border',
    ghost: 'text-futuristic-gray hover:text-lime-green hover:bg-lime-green/10',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      ref={ref}
      {...touchFeedbackProps}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        touchFeedbackProps.className,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
export { Button };
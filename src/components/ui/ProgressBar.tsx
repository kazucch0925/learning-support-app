import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  showValue?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  showValue = false,
  className = '',
  variant = 'primary',
  size = 'md',
  animated = false,
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  const baseStyles = 'w-full rounded-full bg-gray-200';
  
  const variantStyles = {
    primary: 'bg-teal-600',
    secondary: 'bg-purple-600',
    success: 'bg-green-600',
  };
  
  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const animationStyles = animated ? 'transition-all duration-500 ease-in-out' : '';
  
  return (
    <div className={`${baseStyles} ${sizeStyles[size]} ${className}`}>
      <div
        className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-full ${animationStyles}`}
        style={{ width: `${percentage}%` }}
      />
      {showValue && (
        <div className="mt-1 text-xs text-gray-600">
          {value} / {max} ({percentage}%)
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  width?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
  delay = 300,
  width = 'max-w-xs',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-1',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded shadow-sm ${width} ${positionStyles[position]} ${className}`}
          role="tooltip"
          style={{ whiteSpace: 'normal', wordBreak: 'keep-all', wordWrap: 'break-word' }}
        >
          {content}
          <div 
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'top' ? 'top-full -translate-x-1/2 -mt-1 left-1/2' :
              position === 'bottom' ? 'bottom-full -translate-x-1/2 -mb-1 left-1/2' :
              position === 'left' ? 'left-full -translate-y-1/2 -ml-1 top-1/2' :
              'right-full -translate-y-1/2 -mr-1 top-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip; 
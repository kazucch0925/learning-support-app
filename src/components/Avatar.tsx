import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: number; // Size in pixels (default: 48 for h-12 w-12)
  className?: string;
}

// Simple hash function to get a somewhat consistent color based on name/id
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a color from a limited palette based on a hash
function getColorFromHash(hash: number): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
    'bg-rose-500'
  ];
  return colors[hash % colors.length];
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 48, 
  className = '' 
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [showFallback, setShowFallback] = useState(!src);

  useEffect(() => {
    setImgSrc(src || null);
    setShowFallback(!src);
  }, [src]); // Update state if src prop changes

  const handleError = () => {
    // Only trigger fallback if we weren't already trying to show fallback
    if (!showFallback) {
      setShowFallback(true);
    }
  };

  const getInitials = (nameStr: string | null | undefined): string => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + (names[names.length - 1].charAt(0) || '')).toUpperCase();
  };

  const initials = getInitials(name);
  // Use name for color generation, fallback to 'default' if no name
  const colorHash = simpleHash(name || 'default'); 
  const backgroundColor = getColorFromHash(colorHash);

  const dimensionStyle = { width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` };

  if (!showFallback && imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${className}`}
        style={dimensionStyle}
        onError={handleError}
        loading="lazy" // Add lazy loading
      />
    );
  } else {
    // Render fallback with initials and background color
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-medium ${backgroundColor} ${className}`}
        style={dimensionStyle}
        aria-label={name || 'Avatar'} 
      >
        {initials}
      </div>
    );
  }
};

export default Avatar; 
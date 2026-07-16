"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string | React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  indicator?: "online" | "offline" | "busy" | "none";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  fallback,
  size = "md",
  indicator = "none",
  className = "",
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-24 h-24 text-2xl",
  };

  const indicatorSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5 border-4",
  };

  const indicatorColors = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    busy: "bg-brand-urgency",
    none: "hidden",
  };

  const getFallback = () => {
    if (typeof fallback === "string") {
      return fallback.substring(0, 2).toUpperCase();
    }
    if (fallback) {
      return fallback;
    }
    return <Icon icon="lucide:user" className="w-1/2 h-1/2 opacity-60" />;
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} {...props}>
      <div 
        className={`relative flex items-center justify-center rounded-full overflow-hidden bg-brand-primary/10 text-brand-primary font-semibold select-none shadow-sm ${sizeStyles[size]}`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          getFallback()
        )}
      </div>

      {indicator !== "none" && (
        <span 
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-white ${indicatorSizes[size]} ${indicatorColors[indicator]}`} 
        />
      )}
    </div>
  );
};

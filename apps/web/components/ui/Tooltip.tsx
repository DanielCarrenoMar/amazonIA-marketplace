"use client";

import React from "react";

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string; // Permite pasar clases adicionales al contenido del tooltip
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  // Distancias de separación para que el globo flote perfectamente
  const positions = {
    top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    left: "right-[calc(100%+8px)] top-1/2 -translate-y-1/2",
    right: "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
  };

  // Flechitas direccionales usando cuadrados rotados
  const arrows = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2",
    left: "right-[-4px] top-1/2 -translate-y-1/2",
    right: "left-[-4px] top-1/2 -translate-y-1/2",
  };

  return (
    <div className="relative inline-flex group items-center justify-center">
      {children}

      <div
        className={`absolute z-100 px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap shadow-lg 
        opacity-0 invisible pointer-events-none 
        group-hover:opacity-100 group-hover:visible transition-all duration-200 
        ${positions[position]} ${className}`}
      >
        {content}
        {/* Triángulo/Flecha Direccional */}
        <div 
          className={`absolute w-2.5 h-2.5 bg-gray-800 rotate-45 rounded-sm ${arrows[position]}`} 
        />
      </div>
    </div>
  );
};

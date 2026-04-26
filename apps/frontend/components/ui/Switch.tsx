"use client";

import React, { forwardRef } from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", label, description, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;

    return (
      <div className={`flex items-start gap-4 ${className}`}>
        {/* Switch Wrapper interactivo */}
        <label 
          htmlFor={switchId}
          className={`relative inline-flex items-center shrink-0 mt-[2px] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer group"}`}
        >
          <input
            type="checkbox"
            id={switchId}
            role="switch"
            ref={ref}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          
          {/* Fondo o Cápsula del Switch */}
          <div className={`
            w-11 h-6 rounded-full transition-colors duration-200
            bg-gray-200 border border-transparent 
            peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/30 peer-focus-visible:ring-offset-2
            peer-checked:bg-brand-primary peer-checked:border-brand-primary
            ${!disabled ? "group-hover:bg-gray-300 peer-checked:group-hover:bg-brand-primary-dark" : ""}
          `} />
          
          {/* Botón Circular (Thumb) */}
          <div className="
            absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5 shadow-sm 
            transition-all duration-300 transform 
            peer-checked:translate-x-5 peer-checked:shadow-md
          " />
        </label>

        {/* Textos: Label y Description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label 
                htmlFor={switchId} 
                className={`text-sm font-medium leading-none mt-[4px] transition-colors ${disabled ? "text-muted cursor-not-allowed" : "text-foreground cursor-pointer"}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-sm mt-1.5 ${disabled ? "text-muted/60 cursor-not-allowed" : "text-muted"}`}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

"use client";

import React, { forwardRef } from "react";
import { Icon } from "@iconify/react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, description, error, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <div className={`flex items-start gap-3 group ${className}`}>
        {/* Checkbox Wrapper */}
        <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-[2px]">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            disabled={disabled}
            className="peer w-full h-full absolute inset-0 opacity-0 z-20 m-0 p-0 cursor-pointer disabled:cursor-not-allowed"
            {...props}
          />
          
          {/* Custom Visual Box */}
          <div 
            className={`
              absolute inset-0 w-full h-full rounded transition-all duration-200 border bg-white z-0
              peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/30 peer-focus-visible:ring-offset-2
              peer-checked:bg-brand-primary peer-checked:border-brand-primary
              ${error ? "border-brand-urgency" : "border-border peer-hover:border-brand-primary"}
              ${disabled ? "opacity-60 bg-gray-50 border-gray-200 peer-hover:border-gray-200" : ""}
            `}
          />
          
          {/* Check Icon */}
          <Icon icon="lucide:check" 
            className="w-3.5 h-3.5 text-white opacity-0 scale-50 transition-all duration-200 peer-checked:opacity-100 peer-checked:scale-100 z-10 pointer-events-none" 
            strokeWidth={3.5}
          />
        </div>

        {/* Labels Content */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label 
                htmlFor={checkboxId} 
                className={`text-sm font-medium leading-none ${disabled ? "text-muted cursor-not-allowed" : "text-foreground cursor-pointer"} mt-[3px] transition-colors`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-sm mt-1.5 ${disabled ? "text-muted/60 cursor-not-allowed" : "text-muted"}`}>
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-brand-urgency mt-1.5 font-medium">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const baseStyles = "w-full flex items-center bg-white border rounded-xl shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:border-brand-primary";
    
    const stateStyles = error 
      ? "border-brand-urgency focus-within:ring-brand-urgency/20" 
      : disabled 
      ? "bg-gray-50 border-border opacity-70 cursor-not-allowed" 
      : "border-border hover:border-brand-primary/40 focus-within:ring-brand-primary/20";
    
    return (
      <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
            {label}
            {props.required && <span className="text-brand-urgency ml-1">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className={`${baseStyles} ${stateStyles}`}>
          {/* Left Icon (optional) */}
          {leftIcon && (
            <div className="pl-3.5 pr-1 flex items-center text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full bg-transparent text-sm text-foreground placeholder:text-muted/70 focus:outline-none ${
              leftIcon ? "py-3" : "py-3 pl-4"
            } ${rightIcon ? "pr-1" : "pr-4"} disabled:cursor-not-allowed`}
            {...props}
          />

          {/* Right Icon (optional) */}
          {rightIcon && (
            <div className="pr-3.5 pl-1 flex items-center text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error or Helper Text */}
        {error ? (
          <p className="text-xs text-brand-urgency font-medium -mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted -mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

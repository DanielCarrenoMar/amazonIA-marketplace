"use client";

import React, { forwardRef } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    // Estilos base alineados estéticamente con el Input.tsx
    const baseStyles =
      "min-h-[120px] w-full bg-transparent text-sm text-foreground placeholder:text-muted/70 focus:outline-none p-4 disabled:cursor-not-allowed resize-y rounded-xl custom-scrollbar";
      
    const wrapperStyles =
      "w-full flex flex-col bg-white border rounded-xl shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:border-brand-primary";

    const stateStyles = error
      ? "border-brand-urgency focus-within:ring-brand-urgency/20"
      : disabled
      ? "bg-gray-50 border-border opacity-70 cursor-not-allowed"
      : "border-border hover:border-brand-primary/40 focus-within:ring-brand-primary/20";

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
        {/* Label Superior */}
        {label && (
          <label htmlFor={textareaId} className="text-sm font-semibold text-foreground">
            {label}
            {props.required && <span className="text-brand-urgency ml-1">*</span>}
          </label>
        )}

        {/* Contenedor principal */}
        <div className={`${wrapperStyles} ${stateStyles}`}>
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            className={baseStyles}
            {...props}
          />
        </div>

        {/* Mensaje de Error o Ayuda Inferior */}
        {error ? (
          <p className="text-xs text-brand-urgency font-medium -mt-0.5 animate-in fade-in zoom-in-95">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted -mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

"use client";

import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, MenuItem as SelectOption } from "./DropdownMenu";

export type { SelectOption };

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftIcon,
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Selecciona una opción...",
      disabled,
      id,
      required,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Permite uso renderizado puro de prop `value` o gestionarlo internamente como no controlado
    const currentValue = value !== undefined ? value : internalValue;

    const selectedOption = options.find((opt) => opt.value === currentValue);

    const baseStyles = "w-full flex items-center justify-between text-left bg-white border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 relative";
    
    const stateStyles = error 
      ? "border-brand-urgency" 
      : disabled 
      ? "bg-gray-50 border-border opacity-70 cursor-not-allowed" 
      : `border-border hover:border-brand-primary/40 ${isOpen ? 'ring-2 ring-brand-primary/20 border-brand-primary' : ''}`;

    const handleSelect = (val: string) => {
      if (value === undefined) {
        setInternalValue(val);
      }
      onChange?.(val);
      setIsOpen(false);
    };

    return (
      <div 
        className={`flex flex-col w-full relative ${className}`} 
        ref={ref}
      >
        {/* Label y Tooltips */}
        <div className="flex flex-col space-y-1.5 w-full ">
          {label && (
            <label htmlFor={selectId} className="text-sm font-semibold text-foreground">
              {label}
              {required && <span className="text-brand-urgency ml-1">*</span>}
            </label>
          )}

          {/* Wrapper relativo para el trigger y el menú */}
          <div className="relative">
            {/* Trigger */}
            <button
              ref={triggerRef}
              type="button"
              id={selectId}
              disabled={disabled}
              onClick={() => setIsOpen(!isOpen)}
              className={`${baseStyles} ${stateStyles} cursor-pointer ${leftIcon ? "py-3 pl-12" : "py-3 pl-4"} pr-10`}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {leftIcon && (
                <div className="absolute left-4 flex items-center text-muted pointer-events-none">
                  {leftIcon}
                </div>
              )}

              <span className={`text-sm block truncate ${!selectedOption ? 'text-muted/70' : 'text-foreground'}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>

              <div className="absolute right-3.5 flex items-center text-muted pointer-events-none">
                <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Menú Dropdown extraído como componente independiente */}
            <DropdownMenu 
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              options={options}
              value={currentValue}
              onSelect={handleSelect}
              triggerRef={triggerRef}
            />
          </div>

          {/* Error or Helper Text */}
          {error ? (
            <p className="text-xs text-brand-urgency font-medium pt-1">{error}</p>
          ) : helperText ? (
            <p className="text-xs text-muted pt-1">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

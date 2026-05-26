"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

export interface MenuItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  options: MenuItem[];
  value?: string;
  onSelect: (value: string) => void;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function DropdownMenu({
  isOpen,
  onClose,
  options,
  value,
  onSelect,
  className = "",
  triggerRef,
}: DropdownMenuProps) {
  // Manejo de clic fuera del menú
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Ignorar clics en el botón/trigger que abrió el menú para no afectar su propio toggle.
      if (triggerRef?.current && triggerRef.current.contains(event.target as Node)) {
        return;
      }
      
      onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div 
      className={`absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-white border border-border rounded-xl shadow-xl z-9999 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${className}`}
      onClick={(e) => e.stopPropagation()} // Prevenir que el clic cierre contenedores padre por error
    >
      <ul className="max-h-64 overflow-y-auto p-1.5" role="listbox">
        {options.length === 0 ? (
          <li className="p-3 text-sm text-muted text-center cursor-default">No hay opciones</li>
        ) : (
          options.map((option) => {
            const isSelected = option.value === value;
            
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm cursor-pointer rounded-lg transition-colors
                  ${isSelected 
                    ? 'bg-brand-primary/10 text-brand-primary font-medium' 
                    : 'text-foreground hover:bg-brand-nature-bg hover:text-brand-primary-dark'
                  }
                `}
              >
                {option.icon && (
                  <span className={`shrink-0 ${isSelected ? 'text-brand-primary' : 'text-muted'}`}>
                    {option.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{option.label}</span>
                
                {isSelected && (
                  <Check className="w-4 h-4 text-brand-primary shrink-0" />
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

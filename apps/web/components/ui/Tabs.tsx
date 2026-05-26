"use client";

import React, { useState } from "react";

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  className = "",
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || (items.length > 0 ? items[0].key : "")
  );

  const currentKey = activeKey !== undefined ? activeKey : internalActiveKey;

  const handleSelect = (key: string) => {
    if (activeKey === undefined) {
      setInternalActiveKey(key);
    }
    if (onChange) {
      onChange(key);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Contenedor de Botones (Lista) */}
      <div 
        role="tablist"
        className="flex items-center gap-8 w-full overflow-x-auto no-scrollbar border-b border-transparent transition-all"
      >
        {items.map((tab) => {
          const isActive = currentKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab.key)}
              className={`
                relative inline-flex items-center justify-center whitespace-nowrap pb-3 pt-2 text-[12px] sm:text-xs font-semibold uppercase tracking-widest transition-colors duration-200
                focus-visible:outline-none focus-visible:text-brand-primary
                disabled:pointer-events-none disabled:opacity-50 cursor-pointer
                ${isActive 
                  ? "text-brand-primary" 
                  : "text-muted hover:text-foreground"
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-primary rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Area del Contenido */}
      <div className="mt-6">
        {items.map((tab) => {
          if (currentKey !== tab.key) return null;
          return (
            <div
              key={tab.key}
              role="tabpanel"
              className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

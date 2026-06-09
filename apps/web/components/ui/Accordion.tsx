"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  type = "single",
  defaultValue,
  className = "",
}) => {
  const [activeItems, setActiveItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const toggleItem = (id: string) => {
    setActiveItems((prev) => {
      if (type === "single") {
        return prev.includes(id) ? [] : [id];
      } else {
        return prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id];
      }
    });
  };

  return (
    <div className={`w-full divide-y divide-border border-b border-border ${className}`}>
      {items.map((item) => {
        const isOpen = activeItems.includes(item.id);

        return (
          <div key={item.id} className="w-full">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggleItem(item.id)}
              className="flex w-full flex-1 items-center cursor-pointer justify-between py-4 text-sm font-semibold transition-all hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {item.title}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-brand-primary" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-5 pt-1 text-sm text-muted leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

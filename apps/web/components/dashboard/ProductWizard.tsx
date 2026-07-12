"use client";
import React from "react";
import { Check } from "lucide-react";

interface ProductWizardProps {
  steps: string[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}

export function ProductWizard({ steps, currentStep, onStepChange }: ProductWizardProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary rounded-full z-0 transition-all duration-300" 
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onStepChange?.(index)}
                disabled={!isCompleted && !isActive}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 
                  ${isActive ? "bg-white border-brand-primary text-brand-primary" : 
                    isCompleted ? "bg-brand-primary border-brand-primary text-white" : 
                    "bg-gray-100 border-gray-200 text-gray-400"}
                  ${isCompleted ? "cursor-pointer" : "cursor-default"}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </button>
              <span className={`text-xs font-semibold ${isActive || isCompleted ? "text-foreground" : "text-muted"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

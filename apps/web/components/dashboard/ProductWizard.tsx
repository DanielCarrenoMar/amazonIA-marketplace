"use client";
import React from "react";
import { Icon } from "@iconify/react";

export interface WizardStep {
  id: string;
  label: string;
  title: string;
  icon: string;
}

interface ProductWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}

export function ProductWizard({ steps, currentStep, onStepChange }: ProductWizardProps) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between relative w-full md:w-[70%] mx-auto px-2 md:px-0">
        {/* Progress Line Background */}
        <div className="absolute left-4 md:left-6 right-4 md:right-6 top-1/2 -translate-y-1/2 h-[3px] bg-[#4A4A4A] z-0" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-[3px] bg-[#10b981] z-0 transition-all duration-300"
          style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 2rem)` }}
        />

        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center bg-white rounded-full">
              <button
                type="button"
                onClick={() => onStepChange?.(index)}
                disabled={!isCompleted && !isActive}
                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all
                  ${isCompleted
                    ? "bg-[#10b981] border-2 border-[#10b981] text-white"
                    : isActive 
                      ? "bg-white border-2 border-[#10b981] shadow-[0_0_0_4px_rgba(16,185,129,0.15)] text-[#10b981]" 
                      : "bg-white border-2 border-[#4A4A4A] text-[#4A4A4A] hover:bg-gray-50"
                  }
                `}
              >
                {isCompleted ? (
                  <Icon icon="lucide:check" className="w-6 h-6 md:w-7 md:h-7" />
                ) : (
                  <Icon icon={step.icon} className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>
              <span className={`absolute -bottom-7 text-[11px] md:text-sm font-bold ${isActive || isCompleted ? "text-[#10b981]" : "text-[#8a8a8a]"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

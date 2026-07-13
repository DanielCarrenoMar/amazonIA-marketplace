"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

export interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "highlight" | "warning";
}

export function StatsCard({ icon, label, value, subtitle, variant = "default" }: StatsCardProps) {
  const getStyles = () => {
    switch (variant) {
      case "highlight": return "bg-brand-nature-bg border-brand-primary-light text-brand-nature-content";
      case "warning": return "bg-brand-urgency/5 border-brand-urgency/20 text-brand-urgency-dark";
      default: return "bg-white border-border text-foreground";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "highlight": return "bg-brand-primary/10 text-brand-primary";
      case "warning": return "bg-brand-urgency/10 text-brand-urgency";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <Card padding="lg" className={`${getStyles()} border`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold opacity-80">{label}</p>
          <h3 className="text-3xl font-outfit font-bold tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs opacity-70 mt-1 max-w-[200px] leading-relaxed">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${getIconStyles()}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

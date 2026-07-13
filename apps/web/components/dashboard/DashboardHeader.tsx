"use client";
import React from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-outfit font-bold text-brand-nature-content">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

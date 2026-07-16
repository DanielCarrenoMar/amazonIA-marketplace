"use client";
import React from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
      <div>
        <h1 className="text-[42px] font-outfit font-extrabold text-[#333333] tracking-tight leading-none mb-2">{title}</h1>
        {subtitle && <p className="text-[17px] text-gray-500 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="mt-4 sm:mt-0">{action}</div>}
    </div>
  );
}

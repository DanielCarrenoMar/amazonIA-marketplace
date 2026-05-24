import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  number: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export function StatCard({ number, label, title, description, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-linear-to-r from-brand-secondary to-[#064e3b] rounded-2xl p-6 text-white flex flex-col sm:flex-row gap-6 items-center shadow-lg hover:-translate-y-1 transition-transform duration-300">
      <div className="flex flex-col items-center justify-center shrink-0 w-full sm:w-auto sm:mr-2">
        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
          <span className="text-4xl font-bold">{number}</span>
        </div>
        <span className="text-xs font-semibold text-white mt-1 text-center w-full">{label}</span>
      </div>

      <div className="flex flex-col w-full text-center sm:text-right">
        <h3 className="font-semibold text-2xl mb-1.5">{title}</h3>
        <p className="text-sm text-white/90 leading-tight font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}

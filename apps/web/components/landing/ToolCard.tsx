import React from 'react';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { Button } from '../ui/Button';

export interface ToolCardProps {
  id?: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export function ToolCard({ id, title, description, icon, href }: ToolCardProps) {
  return (
    <div
      id={id}
      className="bg-linear-to-br from-brand-secondary/40 to-[#064e3b]/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col shadow-2xl hover:-translate-y-2 transition-transform duration-300 group h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon icon={icon} className="w-7 h-7 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-semibold text-white mb-3 text-left">{title}</h3>
      <p className="text-sm text-white/70 leading-relaxed font-medium text-left grow mb-8">
        {description}
      </p>

      {href ? (
        <Link href={href} className="w-full">
          <Button
            variant="ghost"
            className="w-full py-3! rounded-2xl! bg-white/10! text-white! hover:bg-white/20!"
          >
            Explorar herramienta
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          className="w-full py-3! rounded-2xl! bg-white/10! text-white! hover:bg-white/20!"
        >
          Explorar herramienta
        </Button>
      )}
    </div>
  );
}
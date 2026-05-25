import React from "react";
import { LucideIcon } from "lucide-react";

export interface ImpactCardProps {
    title: string,
    description: string,
    icon: LucideIcon
}

export function ImpactCard({ title, description, icon: Icon }: ImpactCardProps) {
    return (
        <div className="flex gap-6 items-center p-6 bg-brand-nature-bg/90 rounded-2xl shadow-2xl shadow-black/20 hover:-translate-y-1 transition-transform duration-300">
            <Icon className="w-10 h-10 shrink-0 text-brand-primary" strokeWidth={1.5} />
            <div className="flex-1">
                <h3 className="font-bold text-lg text-brand-nature-content">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
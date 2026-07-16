import React from 'react';
import { ToolCard } from './ToolCard';

export function ToolsSection() {
  const tools = [
    {
      title: "Traductor Jivi",
      description: "Rompiendo barreras lingüísticas con traducción en tiempo real impulsada por IA para preservar y comunicar en lengua Jivi.",
      icon: "lucide:languages",
      id: "traductor-jivi"
    },
    {
      title: "Marketplace Artesanal",
      description: "Conecta directamente con compradores globales. Vende artesanías auténticas sin intermediarios y asegura un comercio justo.",
      icon: "lucide:shopping-bag",
      id: "marketplace",
      href: "/marketplace"
    },
    {
      title: "Reconocimiento IA",
      description: "Identificación de flora, fauna y productos locales mediante visión artificial para catalogar y valorar la biodiversidad amazónica.",
      icon: "lucide:scan-eye",
      id: "reconocimiento-ia"
    }
  ];

  return (
    <section id="soluciones" className="w-full bg-linear-to-b from-brand-primary to-[#064e3b] py-24 px-6 md:px-12 flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.15]">
          Tecnología al servicio <br className="hidden md:block" />
          de tu comunidad
        </h2>
        <p className="text-white/90 text-base md:text-lg leading-relaxed font-medium">
          Soluciones diseñadas específicamente para empoderar a las comunidades amazónicas.
        </p>
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tools.map((tool, index) => (
          <ToolCard key={index} {...tool} />
        ))}
      </div>
    </section >
  );
}
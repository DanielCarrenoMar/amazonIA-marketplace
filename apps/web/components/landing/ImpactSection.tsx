import React, { useEffect, useState } from 'react';
import { ImpactCard } from './ImpactCards';
import { getImpactStats, ImpactStats } from '../../lib/api/stats';

export function ImpactSection() {
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    getImpactStats().then(data => {
      if (data) {
        setStats(data);
      }
    });
  }, []);

  const mockData = [
    {
      title: stats ? `${stats.artisansCount} Artesanos apoyados` : "Integración Económica",
      description: "Conectamos a las comunidades con mercados globales de comercio justo.",
      icon: "lucide:users"
    },
    {
      title: stats ? `${stats.transactionsCount} Transacciones exitosas` : "Sostenibilidad",
      description: "Promovemos prácticas que protegen el medio ambiente amazónico.",
      icon: "lucide:shopping-bag"
    },
    {
      title: stats ? `$${stats.totalVolume.toLocaleString()} Valor generado` : "Preservación Cultural",
      description: "Documentamos y difundimos el conocimiento ancestral.",
      icon: "lucide:trending-up"
    },
    {
      title: stats ? `${stats.activeProducts} Productos activos` : "Impacto medible",
      description: "Cada transacción contribuye directamente al bienestar de las comunidades.",
      icon: "lucide:package"
    }
  ];

  return (
    <section id="impacto" className="w-full bg-linear-to-b from-brand-primary to-[#064e3b] min-h-[90vh] flex items-center py-24 px-6 md:px-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-5">
          {mockData.map((stat, index) => (
            <ImpactCard key={index} {...stat} />
          ))}
        </div>

        <div className="flex flex-col gap-6 h-full justify-center text-right">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.15]">
            Autonomía tecnológica para los pueblos originarios
          </h2>
          <p className="text-white/90 text-base md:text-lg leading-relaxed font-medium">
            Nuestra plataforma empodera a las comunidades indígenas para comercializar sus productos de manera justa y preservar sus conocimientos ancestrales.
          </p>
        </div>
      </div>
    </section>
  );
}

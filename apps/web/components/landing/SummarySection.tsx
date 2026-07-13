import React from 'react';
import { Icon } from "@iconify/react";
import { StatCard } from './StatCard';

export function SummarySection() {
  const stats = [
    {
      number: "70%",
      label: "Pérdida Crítica",
      title: "Acceso a Mercados",
      description: "Las comunidades enfrentan comercio injusto e intermediarios que reducen sus ganancias hasta un 70%.",
      icon: "lucide:trending-down"
    },
    {
      number: "2,000+",
      label: "lenguas en peligro",
      title: "Preservación Cultural",
      description: "Miles de lenguas indígenas están en riesgo de extinción, junto con conocimientos ancestrales únicos.",
      icon: "lucide:book-open"
    },
    {
      number: "<20%",
      label: "conectividad rural",
      title: "Brecha Digital",
      description: "Menos del 20% de comunidades rurales amazónicas tienen acceso a herramientas tecnológicas adaptadas.",
      icon: "lucide:globe"
    }
  ];

  return (
    <section id="resumen" className="w-full bg-brand-nature-bg min-h-[90vh] flex items-center py-24 px-6 md:px-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <div className="flex flex-col gap-6 h-full justify-center">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-nature-content leading-[1.15]">
            La Amazonía necesita un puente hacia el futuro
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed font-medium">
            Las comunidades indígenas amazónicas poseen conocimientos invaluables y productos únicos, pero enfrentan barreras que limitan su desarrollo económico y ponen en riesgo su herencia cultural.
          </p>
          <a href="#soluciones" className="text-brand-primary font-medium flex items-center gap-2 hover:text-brand-primary-dark transition-colors mt-2 w-max group text-lg">
            Ver soluciones
            <Icon icon="lucide:arrow-right" className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </a>
        </div>

        <div className="flex flex-col gap-5">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

      </div>
    </section>
  );
}

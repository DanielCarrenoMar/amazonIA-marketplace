"use client";

import React from "react";

interface DesignSystemProps {
  onBack: () => void;
}

export function DesignSystem({ onBack }: DesignSystemProps) {
  const colors = [
    { name: "Primary (Emerald)", class: "bg-brand-primary", text: "text-white", hex: "#059669" },
    { name: "Primary Dark", class: "bg-brand-primary-dark", text: "text-white", hex: "#064e3b" },
    { name: "Secondary (Teal)", class: "bg-brand-secondary", text: "text-white", hex: "#0d9488" },
    { name: "Accent (Amber)", class: "bg-brand-accent", text: "text-brand-primary-dark", hex: "#fbbf24" },
    { name: "Urgency", class: "bg-brand-urgency", text: "text-white", hex: "#ef4444" },
    { name: "Nature BG", class: "bg-brand-nature-bg", text: "text-brand-nature-content", border: "border-brand-primary-light", hex: "#ecfdf5" },
  ];

  return (
    <div className="min-h-screen bg-background p-8 md:p-20 font-sans">
      <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-outfit font-bold tracking-tight text-brand-primary-dark">
            Amazonia IA <span className="text-brand-primary">Design System</span>
          </h1>
        </div>
        <button 
          onClick={onBack}
          className="px-6 cursor-pointer py-2 rounded-full border-2 border-brand-primary text-brand-primary font-semibold hover:bg-brand-primary hover:text-white transition-all order-first md:order-last"
        >
          ← Volver al Inicio
        </button>
      </header>

      <main className="max-w-6xl mx-auto space-y-20">
        {/* Color Palette section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-primary pl-4">Paleta de Colores</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {colors.map((color) => (
              <div 
                key={color.name} 
                className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ${color.class} ${color.text} ${color.border ? `border-2 ${color.border}` : ""}`}
              >
                <span className="font-bold text-sm mb-2 opacity-90">{color.name}</span>
                <span className="text-xs font-mono bg-black/10 px-2 py-1 rounded-md uppercase">{color.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* UI Elements Preview */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Typography section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-secondary pl-4">Tipografía</h2>
            <div className="bg-brand-nature-bg p-8 rounded-3xl border border-brand-primary-light space-y-4 font-sans">
              <h1 className="text-5xl font-outfit font-extrabold text-brand-nature-content">Heading 1</h1>
              <h2 className="text-4xl font-outfit font-bold text-brand-nature-content">Heading 2</h2>
              <h3 className="text-3xl font-outfit font-semibold text-brand-nature-content">Heading 3</h3>
              <p className="text-lg text-foreground leading-relaxed">
                Este es un ejemplo de cuerpo de texto en Poppins. Amazonia IA utiliza una estética orgánica para conectar a los usuarios con la biodiversidad del Amazonas.
              </p>
              <p className="text-sm text-brand-nature-content italic">
                Títulos en Outfit para mayor claridad y modernidad.
              </p>
            </div>
          </section>

          {/* Components section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-accent pl-4">Componentes Base</h2>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-border shadow-sm space-y-8">
              <div className="flex flex-wrap gap-4">
                <button className="bg-brand-primary text-white px-6 py-3 rounded-full font-medium hover:bg-brand-primary-dark transition-all transform hover:scale-105 active:scale-95 shadow-md">
                  Botón Primario
                </button>
                <button className="border-2 border-brand-secondary text-brand-secondary px-6 py-3 rounded-full font-medium hover:bg-brand-secondary hover:text-white transition-all">
                  Secundario
                </button>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-brand-primary-light rounded-xl border border-brand-primary/20">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-sm text-brand-primary-dark font-medium">Información sobre comercio justo cargada.</p>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-6 h-6 text-brand-accent fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-muted font-medium">5.0 (24 reviews)</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

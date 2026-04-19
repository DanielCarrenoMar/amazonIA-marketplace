"use client";

import React from "react";
import { 
  Leaf, 
  Trees, 
  Waves, 
  Store, 
  Globe, 
  ShieldCheck, 
  Heart, 
  Star, 
  ArrowLeft,
  ShoppingBag
} from "lucide-react";
import { Button } from "./ui/Button";

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

  const icons = [
    { Icon: Leaf, label: "Naturaleza", color: "text-brand-primary" },
    { Icon: Trees, label: "Selva", color: "text-brand-primary-dark" },
    { Icon: Waves, label: "Ríos", color: "text-brand-secondary" },
    { Icon: Store, label: "Mercado", color: "text-brand-primary" },
    { Icon: Globe, label: "Global", color: "text-brand-secondary" },
    { Icon: ShieldCheck, label: "Seguridad", color: "text-brand-primary-dark" },
    { Icon: Heart, label: "Justicia", color: "text-brand-urgency" },
    { Icon: Star, label: "Calidad", color: "text-brand-accent" }
  ];

  return (
    <div className="min-h-screen bg-background p-8 md:p-20 font-sans">
      <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-outfit font-bold tracking-tight text-brand-primary-dark">
            Amazonia IA <span className="text-brand-primary">Design System</span>
          </h1>
        </div>
        <Button 
          onClick={onBack}
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="order-first md:order-last"
        >
          Volver al Inicio
        </Button>
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
              <div className="flex items-center gap-2 p-4 bg-brand-primary-light rounded-xl border border-brand-primary/20">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <p className="text-sm text-brand-primary-dark font-medium">Información sobre comercio justo cargada.</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-6 h-6 text-brand-accent fill-current" />
                ))}
                <span className="ml-2 text-sm text-muted font-medium">5.0 (24 reviews)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Icons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-primary-dark pl-4">Iconografía</h2>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-border shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8">
              {icons.map(({ Icon, label, color }, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 ${color} transition-transform hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-accent pl-4">Botones</h2>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-border shadow-sm space-y-10">
            
            {/* Variantes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Variantes</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            {/* Tamaños */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Tamaños</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Leaf className="w-5 h-5" /></Button>
              </div>
            </div>

            {/* Con iconos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Con Iconos</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button leftIcon={<ShoppingBag className="w-4 h-4" />}>Marketplace</Button>
                <Button variant="secondary" rightIcon={<Globe className="w-4 h-4" />}>Explorar</Button>
                <Button variant="outline" leftIcon={<Heart className="w-4 h-4" />}>Favorito</Button>
              </div>
            </div>

            {/* Estados */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Estados</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button isLoading>Cargando...</Button>
                <Button disabled>Deshabilitado</Button>
                <Button variant="danger" isLoading>Procesando</Button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

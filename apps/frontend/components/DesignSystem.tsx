"use client";

import React, { useState } from "react";
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
  ShoppingBag,
  Package,
  TrendingUp,
  Users
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from "./ui/Card";
import { Modal } from "./ui/Modal";

interface DesignSystemProps {
  onBack: () => void;
}


export function DesignSystem({ onBack }: DesignSystemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <Card variant="nature" padding="lg" rounded="3xl">
              <div className="space-y-4 font-sans">
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
            </Card>
          </section>

          {/* Components section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-accent pl-4">Componentes Base</h2>
            <Card padding="lg" rounded="3xl">
              <div className="space-y-8">
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
            </Card>
          </section>
        </div>

        {/* Icons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-primary-dark pl-4">Iconografía</h2>
          <Card padding="lg" rounded="3xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8">
              {icons.map(({ Icon, label, color }, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl bg-gray-50 ${color} transition-transform hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium text-muted">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Buttons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-accent pl-4">Botones</h2>
          <Card padding="lg" rounded="3xl">
            <div className="space-y-10">
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
          </Card>
        </section>

        {/* Badges section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-secondary pl-4">Badges</h2>
          <Card padding="lg" rounded="3xl">
            <div className="space-y-10">
              {/* Variantes */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Variantes</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge variant="primary">Sostenible</Badge>
                  <Badge variant="secondary">Artesanal</Badge>
                  <Badge variant="accent">Destacado</Badge>
                  <Badge variant="danger">Agotado</Badge>
                  <Badge variant="outline">General</Badge>
                  <Badge variant="nature">Orgánico</Badge>
                </div>
              </div>

              {/* Tamaños */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Tamaños</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge variant="secondary" size="sm">Teal SM</Badge>
                  <Badge variant="accent" size="md">Amber MD</Badge>
                </div>
              </div>

              {/* Ejemplo de uso */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Ejemplo de Uso</h3>
                <div className="flex items-center gap-3 p-4 bg-brand-nature-bg rounded-xl border border-brand-primary-light">
                  <span className="text-brand-nature-content font-medium">Cacao Amazónico Premium</span>
                  <Badge variant="primary" size="sm">Comercio Justo</Badge>
                  <Badge variant="nature" size="sm">100% Natural</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-primary pl-4">Cards</h2>

          {/* Variantes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Variantes</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {(["default", "bordered", "elevated", "nature", "glass"] as const).map(
                (variant) => (
                  <Card key={variant} variant={variant} hoverable>
                    <CardHeader>
                      <CardTitle>{variant.charAt(0).toUpperCase() + variant.slice(1)}</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <CardDescription>
                        Card con variante <strong>{variant}</strong>. Haz hover para ver el efecto de elevación.
                      </CardDescription>
                    </CardBody>
                  </Card>
                )
              )}
            </div>
          </div>

          {/* Cards compuestas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Cards Compuestas</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Producto card */}
              <Card variant="default" hoverable>
                <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl">
                  <div className="w-full h-48 bg-linear-to-br from-brand-primary/20 via-brand-secondary/15 to-brand-accent/20 flex items-center justify-center">
                    <Package className="w-16 h-16 text-brand-primary/40" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="primary" size="sm">Orgánico</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Café de Altura Amazónico</CardTitle>
                  <CardDescription>Granos selectos cultivados a 1.800 msnm por comunidades indígenas del Amazonas peruano.</CardDescription>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-brand-accent fill-current" />
                    ))}
                    <span className="ml-1 text-xs text-muted">4.9 (128)</span>
                  </div>
                  <p className="text-2xl font-outfit font-bold text-brand-primary">$24.99</p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" className="flex-1">Añadir al Carrito</Button>
                  <Button size="icon" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Stats card */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Ventas Mensuales</CardTitle>
                    <div className="p-2 rounded-xl bg-brand-primary/10">
                      <TrendingUp className="w-5 h-5 text-brand-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-4xl font-outfit font-bold text-foreground mb-1">$12,450</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">+18.2%</Badge>
                    <span className="text-sm text-muted">vs. mes anterior</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">Artesanías</span>
                        <span className="text-muted">45%</span>
                      </div>
                      <div className="h-1.5 w-full bg-brand-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: "45%" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">Café y Cacao</span>
                        <span className="text-muted">30%</span>
                      </div>
                      <div className="h-1.5 w-full bg-brand-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-secondary rounded-full transition-all" style={{ width: "30%" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">Textiles</span>
                        <span className="text-muted">25%</span>
                      </div>
                      <div className="h-1.5 w-full bg-brand-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent rounded-full transition-all" style={{ width: "25%" }} />
                      </div>
                    </div>
                  </div>
                </CardBody>
                <CardFooter>
                  <Button variant="ghost" size="sm" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
                    Ver detalles
                  </Button>
                </CardFooter>
              </Card>

              {/* Community card */}
              <Card variant="nature" hoverable>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-primary/15">
                      <Users className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <CardTitle>Comunidad Achuar</CardTitle>
                      <CardDescription>Amazonas, Perú</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Artesanos activos</span>
                      <span className="font-semibold text-foreground">47</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Productos publicados</span>
                      <span className="font-semibold text-foreground">132</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Impacto generado</span>
                      <span className="font-semibold text-brand-primary">$8,740</span>
                    </div>
                    <div className="w-full bg-brand-primary/10 rounded-full h-2 mt-2">
                      <div className="bg-brand-primary h-2 rounded-full" style={{ width: "72%" }} />
                    </div>
                    <p className="text-xs text-muted text-right">72% de la meta mensual</p>
                  </div>
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm" className="flex-1">Conocer más</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Modal section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-outfit font-semibold border-l-4 border-brand-accent pl-4">Modales</h2>
          <Card padding="lg" rounded="3xl">
            <div className="space-y-4">
              <p className="text-muted">
                Este componente se encarga de bloquear el scroll, atrapar el foco, cerrar con teclado (tecla ESC), clic en el fondo oscuro y gestionar variantes de tamaños.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>Abrir Modal de Ejemplo</Button>
            </div>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              size="md"
              title="New Collection"
              footer={
                <>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsModalOpen(false)}>Create Collection</Button>
                </>
              }
            >
              <div className="py-2 text-foreground">
                Este es un modal de prueba.
              </div>
            </Modal>
          </Card>
        </section>

      </main>
    </div>
  );
}

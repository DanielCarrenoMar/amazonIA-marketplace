"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { 
  Button, 
  Badge, 
  Input, 
  Select, 
  Tooltip, 
  Checkbox, 
  Switch, 
  Radio, 
  FileDrop, 
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  Modal,
  Avatar,
  ToastProvider, 
  useToast,
  Tabs,
  Accordion 
} from "./ui";

interface DesignSystemProps {
  onBack: () => void;
}

const ToastShowcase = () => {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-4">
      <Button onClick={() => toast({ title: "Acción exitosa", description: "Los cambios se guardaron.", variant: "success" })}>
        Toast de Éxito
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Error de conexión", description: "Fallo al validar credenciales.", variant: "error" })}>
        Toast de Error
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Información", description: "Tienes 3 mensajes nuevos sin leer.", variant: "info" })}>
        Toast de Info
      </Button>
      <Button variant="ghost" onClick={() => toast({ title: "Cuidado", description: "La imagen pesa mucho pero fue aceptada.", variant: "warning" })}>
        Toast de Alerta
      </Button>
    </div>
  );
};


export function DesignSystem({ onBack }: DesignSystemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const colors = [
    { name: "Primary (Emerald)", class: "bg-brand-primary", text: "text-white", hex: "#059669" },
    { name: "Primary Dark", class: "bg-brand-primary-dark", text: "text-white", hex: "#064e3b" },
    { name: "Secondary (Teal)", class: "bg-brand-secondary", text: "text-white", hex: "#0d9488" },
    { name: "Accent (Amber)", class: "bg-brand-accent", text: "text-brand-primary-dark", hex: "#fbbf24" },
    { name: "Urgency", class: "bg-brand-urgency", text: "text-white", hex: "#ef4444" },
    { name: "Nature BG", class: "bg-brand-nature-bg", text: "text-brand-nature-content", border: "border-brand-primary-light", hex: "#ecfdf5" },
    { name: "Background", class: "bg-background", text: "text-foreground", border: "border-border", hex: "#fbfbfb" },
    { name: "Foreground (Texto)", class: "bg-foreground", text: "text-background", hex: "#3e3e3e" },
  ];

  const icons = [
    { icon: "lucide:leaf", label: "Naturaleza", color: "text-brand-primary" },
    { icon: "lucide:trees", label: "Selva", color: "text-brand-primary-dark" },
    { icon: "lucide:waves", label: "Ríos", color: "text-brand-secondary" },
    { icon: "lucide:store", label: "Mercado", color: "text-brand-primary" },
    { icon: "lucide:globe", label: "Global", color: "text-brand-secondary" },
    { icon: "lucide:shield-check", label: "Seguridad", color: "text-brand-primary-dark" },
    { icon: "lucide:heart", label: "Justicia", color: "text-brand-urgency" },
    { icon: "lucide:star", label: "Calidad", color: "text-brand-accent" }
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background p-8 md:p-20 font-sans">
      <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-poppins font-bold tracking-tight text-brand-primary-dark">
            Amazonia IA <span className="text-brand-primary">Design System</span>
          </h1>
        </div>
        <Button 
          onClick={onBack}
          variant="outline"
          size="sm"
          leftIcon={<Icon icon="lucide:arrow-left" className="w-4 h-4" />}
          className="order-first md:order-last"
        >
          Volver al Inicio
        </Button>
      </header>

      <main className="max-w-6xl mx-auto space-y-20">
        {/* Color Palette section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-primary pl-4">Paleta de Colores</h2>
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

        {/* Typography section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-secondary pl-4">Tipografía</h2>
          <Card variant="nature" padding="lg" rounded="3xl">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-brand-primary font-bold">Poppins (Títulos)</span>
                <div className="space-y-1">
                  <h1 className="text-5xl font-poppins font-extrabold text-brand-primary-dark">Heading 1</h1>
                  <h2 className="text-4xl font-poppins font-bold text-brand-primary-dark">Heading 2</h2>
                  <h3 className="text-3xl font-poppins font-semibold text-brand-primary-dark">Heading 3</h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-brand-secondary font-bold">Outfit (Cuerpo / UI)</span>
                <div className="space-y-4">
                  <p className="text-lg text-foreground leading-relaxed font-sans">
                    Este es un ejemplo de cuerpo de texto en Outfit. Proporciona una lectura clara y geométrica, ideal para la navegación y componentes de UI. Amazonia IA utiliza esta estética para conectar a los usuarios con la biodiversidad del Amazonas.
                  </p>
                  <p className="text-sm text-foreground/80 font-sans italic">
                    "La selva no es solo verde, es un diálogo constante entre tecnología y ancestros."
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Icons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-primary-dark pl-4">Iconografía</h2>
          <Card padding="lg" rounded="3xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8">
              {icons.map(({ icon, label, color }, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl bg-gray-50 ${color} transition-transform hover:scale-110`}>
                    <Icon icon={icon} className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium text-muted">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Buttons section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Botones</h2>
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
                  <Button size="icon"><Icon icon="lucide:leaf" className="w-5 h-5" /></Button>
                </div>
              </div>

              {/* Con iconos */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Con Iconos</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button leftIcon={<Icon icon="lucide:shopping-bag" className="w-4 h-4" />}>Marketplace</Button>
                  <Button variant="secondary" rightIcon={<Icon icon="lucide:globe" className="w-4 h-4" />}>Explorar</Button>
                  <Button variant="outline" leftIcon={<Icon icon="lucide:heart" className="w-4 h-4" />}>Favorito</Button>
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
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-secondary pl-4">Badges</h2>
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

        {/* Form Inputs section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-primary pl-4">Formularios (Inputs & Selects)</h2>
          <Card padding="lg" rounded="3xl" overflowVisible>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Basic Inputs */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Estados Básicos</h3>
                <div className="space-y-4">
                  <Input label="Nombre completo" placeholder="Ej. María Fernández" />
                  <Input label="Correo electrónico" type="email" placeholder="maria@ejemplo.com" helperText="Nunca compartiremos tu correo con externos." />
                  <Input label="Bio" value="Amante de la naturaleza" disabled />
                  <Input label="Nombre de usuario" error="Este usuario ya está en uso." defaultValue="maria_amazonia" />
                </div>
              </div>

              {/* Inputs with Icons */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Con Iconos</h3>
                <div className="space-y-4">
                  <Input 
                    label="Buscar productos" 
                    placeholder="Café, cacao, artesanías..." 
                    leftIcon={<Icon icon="lucide:search" className="w-5 h-5" />} 
                  />
                  <Input 
                    label="Doble Icono" 
                    placeholder="Ingresa tu email" 
                    leftIcon={<Icon icon="lucide:mail" className="w-5 h-5" />} 
                    rightIcon={<div className="w-6 h-6 bg-brand-primary/10 rounded flex items-center justify-center"><Icon icon="lucide:search" className="w-3 h-3 text-brand-primary" /></div>}
                  />
                  <Input 
                    label="Contraseña" 
                    type="password" 
                    placeholder="••••••••" 
                    leftIcon={<Icon icon="lucide:lock" className="w-5 h-5" />} 
                  />
                </div>
              </div>

              {/* Selects */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Selects</h3>
                <div className="space-y-4">
                  <Select 
                    label="Categoría" 
                    placeholder="Selecciona categoría..."
                    options={[
                      { value: "artesanias", label: "Artesanías" },
                      { value: "alimentos", label: "Café y Cacao" },
                      { value: "textiles", label: "Textiles" }
                    ]}
                  />
                  
                  <Select 
                    label="Comunidad (Icono)" 
                    leftIcon={<Icon icon="lucide:map-pin" className="w-5 h-5" />}
                    placeholder="Selecciona comunidad..."
                    options={[
                      { value: "amazonas", label: "Achuar, Perú", icon: <Icon icon="lucide:globe" className="w-4 h-4"/> },
                      { value: "loreto", label: "Kichwa, Loreto", icon: <Icon icon="lucide:leaf" className="w-4 h-4"/> }
                    ]}
                  />

                  <Select 
                    label="Estatus" 
                    disabled 
                    value="1"
                    options={[
                      { value: "1", label: "Cuenta Inactiva" }
                    ]}
                  />

                  <Select 
                    label="Talla Producto" 
                    error="Debes seleccionar una opción." 
                    placeholder="Elige tu medida..."
                    options={[
                      { value: "s", label: "Pequeña" },
                      { value: "m", label: "Mediana" }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Fila intermedia de Form Inputs: Textareas */}
            <div className="mt-8 pt-6 border-t border-border border-dashed">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Textareas</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Textarea 
                  label="Biografía / Descripción del Vendedor"
                  placeholder="Menciona historia, locación y especialidad..."
                  helperText="Este texto será el perfil público que verán los compradores."
                />
                <Textarea 
                  label="Detalle Interno"
                  error="La justificación de rechazo no puede estar vacía."
                  placeholder="Por favor elabora por qué..."
                />
              </div>
            </div>

            {/* Fila inferior de Form Inputs: File Uploads */}
            <div className="mt-8 pt-6 border-t border-border border-dashed">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Carga y Subida de Archivos</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <FileDrop 
                  label="Subir documento legal"
                  accept=".pdf, .docx, .jpg, .jpeg, .png"
                  maxSizeMB={5}
                  helperText="Formatos: PDF, Word o Imágenes (JPG/PNG). Menos de 5MB."
                />
                <FileDrop 
                  label="Galería del Producto"
                  accept="image/*"
                  multiple
                  maxFiles={3}
                  helperText="Puedes seleccionar y arrastrar hasta 3 imágenes."
                />
              </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-border my-10" />

            {/* Checkboxes */}
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Checkboxes</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Checkbox 
                  label="Recordar mi sesión" 
                  defaultChecked 
                />
                
                <Checkbox 
                  label="Términos y reglas" 
                  description="Al aceptar nos permites operar tu info."
                />

                <Checkbox 
                  label="Recibir correos" 
                  description="Deshabilitado temporalmente."
                  defaultChecked
                  disabled
                />

                <Checkbox 
                  label="Confirmar compra" 
                  error="Debes marcar esta casilla."
                />
              </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-border my-10" />

            {/* Radio Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Radio Buttons</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Radio 
                  name="plan"
                  label="Plan Básico" 
                  description="Ideal para empezar."
                />
                
                <Radio 
                  name="plan"
                  label="Plan Premium" 
                  description="Todas las comisiones incluidas."
                  defaultChecked
                />

                <Radio 
                  name="status"
                  label="Vendedor Verificado" 
                  description="Insignia asignada."
                  defaultChecked
                  disabled
                />

                <Radio 
                  name="status"
                  label="Vendedor Suspendido" 
                  error="Requiere apelación."
                />
              </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-border my-10" />

            {/* Switches */}
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">Toggles / Switches</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Switch 
                  label="Perfil Público" 
                />
                
                <Switch 
                  label="Notificaciones Push" 
                  description="Recibe alertas en tu teléfono sobre ventas."
                  defaultChecked
                />

                <Switch 
                  label="Seguridad Extendida" 
                  description="Protección activa indisponible."
                  defaultChecked
                  disabled
                />

                <Switch 
                  label="Modo Oscuro" 
                  disabled
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Cards section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-primary pl-4">Cards</h2>

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
                    <Icon icon="lucide:package" className="w-16 h-16 text-brand-primary/40" />
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
                      <Icon icon="lucide:star" key={i} className="w-4 h-4 text-brand-accent fill-current" />
                    ))}
                    <span className="ml-1 text-xs text-muted">4.9 (128)</span>
                  </div>
                  <p className="text-2xl font-poppins font-bold text-brand-primary">$24.99</p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" className="flex-1">Añadir al Carrito</Button>
                  <Button size="icon" variant="outline">
                    <Icon icon="lucide:heart" className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Stats card */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Ventas Mensuales</CardTitle>
                    <div className="p-2 rounded-xl bg-brand-primary/10">
                      <Icon icon="lucide:trending-up" className="w-5 h-5 text-brand-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-4xl font-poppins font-bold text-foreground mb-1">$12,450</p>
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
                  <Button variant="ghost" size="sm" rightIcon={<Icon icon="lucide:arrow-left" className="w-4 h-4 rotate-180" />}>
                    Ver detalles
                  </Button>
                </CardFooter>
              </Card>

              {/* Community card */}
              <Card variant="nature" hoverable>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-primary/15">
                      <Icon icon="lucide:users" className="w-6 h-6 text-brand-primary" />
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

        {/* Tooltips section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Tooltips</h2>
          <Card padding="lg" rounded="3xl" overflowVisible>
            <div className="space-y-4">
              <p className="text-muted mb-8">
                Componente sumamente liviano en performance (basado en selectores de grupo CSS de Tailwind) con 4 posiciones que aparece al hacer hover sobre cualquier elemento.
              </p>
              <div className="flex flex-wrap gap-12 items-center py-6">
                <Tooltip content="Tooltip superior ideal para menús" position="top">
                  <Button variant="outline">Top (Arriba)</Button>
                </Tooltip>

                <Tooltip content="Se muestra hacia la derecha" position="right">
                  <Button variant="outline">Right (Derecha)</Button>
                </Tooltip>
                
                <Tooltip content="Se muestra por debajo" position="bottom">
                  <Button variant="outline">Bottom (Abajo)</Button>
                </Tooltip>

                <Tooltip content="Se muestra hacia la izquierda" position="left">
                  <Button variant="outline">Left (Izquierda)</Button>
                </Tooltip>

                <Tooltip content="Despacho en 48 horas laborales" position="top" className="bg-brand-primary-dark">
                  <span className="cursor-help flex items-center text-sm font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">
                    <Icon icon="lucide:info" className="w-5 h-5 mr-1.5" />
                    Info. de Envío
                  </span>
                </Tooltip>
              </div>
            </div>
          </Card>
        </section>

        {/* Tabs section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Navegación (Tabs)</h2>
          <Card padding="lg" rounded="3xl">
            <Tabs 
              defaultActiveKey="perfil" 
              className="w-full"
              items={[
                {
                  key: "perfil",
                  label: "Perfil Público",
                  content: (
                    <div className="p-6 bg-gray-50/50 rounded-2xl border border-border">
                      <h4 className="font-semibold text-foreground mb-2">Información Pública</h4>
                      <p className="text-sm text-muted">Aquí puedes editar la apariencia de tu perfil dentro del catálogo general, subir fotos de tu comunidad productora y agregar una bella biografía.</p>
                    </div>
                  )
                },
                {
                  key: "seguridad",
                  label: "Configuración de Seguridad",
                  content: (
                    <div className="p-6 bg-brand-urgency/5 rounded-2xl border border-brand-urgency/20">
                      <h4 className="font-semibold text-brand-urgency mb-2">Protección de Cuenta</h4>
                      <p className="text-sm text-brand-urgency/80">Cambia tu contraseña regularmente. Tus métricas de ventas y facturación son confidenciales, asegúrate de activar el factor 2FA antes de fin de mes.</p>
                      <Button variant="outline" size="sm" className="mt-4 border-brand-urgency text-brand-urgency hover:bg-brand-urgency hover:text-white">Cambiar Clave</Button>
                    </div>
                  )
                },
                {
                  key: "facturacion",
                  label: "Facturación (Bloqueado)",
                  disabled: true,
                  content: <></>
                }
              ]}
            />
          </Card>
        </section>

        {/* Accordion section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Acordeón (Desplegables)</h2>
          <Card padding="lg" rounded="3xl">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Selección Única (FAQ Style)</h3>
                <Accordion 
                  type="single"
                  defaultValue="item-1"
                  items={[
                    {
                      id: "item-1",
                      title: "¿Cómo funciona el envío a comunidades remotas?",
                      content: "Utilizamos una red de logística fluvial coordinada con las federaciones indígenas para asegurar que los productos lleguen intactos y los artesanos reciban su pago de forma segura."
                    },
                    {
                      id: "item-2",
                      title: "¿Es posible rastrear mi pedido en tiempo real?",
                      content: "Sí, recibirás un código de seguimiento que te informará desde la recolección en la maloca hasta la entrega final en tu domicilio."
                    },
                    {
                      id: "item-3",
                      title: "Políticas de devolución",
                      content: "Dada la naturaleza artesanal y el impacto social de los productos, las devoluciones se gestionan caso por caso para no perjudicar la economía de la comunidad productora."
                    }
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Selección Múltiple</h3>
                <Accordion 
                  type="multiple"
                  items={[
                    {
                      id: "acc-1",
                      title: "Especificaciones Técnicas",
                      content: "Materiales: Fibra de chambira, tintes naturales orgánicos. Peso: 450g aprox. Dimensiones: 30x40cm."
                    },
                    {
                      id: "acc-2",
                      title: "Cuidado del Producto",
                      content: "No exponer directamente al sol por tiempos prolongados. Limpiar con un paño ligeramente húmedo. No usar químicos agresivos."
                    }
                  ]}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Avatars section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Avatar & Perfiles</h2>
          <Card padding="lg" rounded="3xl">
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Escalas / Tamaños</h3>
                <div className="flex items-end flex-wrap gap-6">
                  <Avatar size="sm" fallback="SM" />
                  <Avatar size="md" fallback="MD" />
                  <Avatar size="lg" fallback="LG" />
                  <Avatar size="xl" fallback="XL" />
                  <Avatar size="2xl" fallback="2X" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Fotos y Estados de Actividad</h3>
                <div className="flex items-end flex-wrap gap-8">
                  <Avatar size="lg" src="https://i.pravatar.cc/150?img=32" indicator="online" />
                  <Avatar size="lg" src="https://i.pravatar.cc/150?img=12" indicator="busy" />
                  <Avatar size="lg" src="https://i.pravatar.cc/150?img=11" indicator="offline" />
                  <Avatar size="lg" src="https://bad-url-para-probar-fallback.com" fallback="MF" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Toasts section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Toasts (Notificaciones Temporales)</h2>
          <Card padding="lg" rounded="3xl" overflowVisible>
            <div className="space-y-4">
              <p className="text-muted mb-6">
                Avisos flotantes controlados nativamente a través de un Context Provider. Aparecen en pila e incorporan autodestrucción con soporte de cerrado manual.
              </p>
              <ToastShowcase />
            </div>
          </Card>
        </section>

        {/* Modal section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-poppins font-semibold border-l-4 border-brand-accent pl-4">Modales</h2>
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
    </ToastProvider>
  );
}

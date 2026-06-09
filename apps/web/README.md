# 🎨 AmazonIA Frontend — Aplicación Moderna

La interfaz de usuario principal de **AmazonIA Marketplace**, construida para ser rápida, accesible y visualmente impactante.

## ⚡ Stack Tecnológico

- **Framework:** Next.js 16 (App Router).
- **Core:** React 19.
- **Estilos:** Tailwind CSS v4 (con soporte nativo de variables CSS).
- **Tipado:** TypeScript + DTOs compartidos del paquete `dtos`.

## 🌟 Características

- **Server Components (RSC):** Renderizado en servidor para carga instantánea y SEO optimizado.
- **Geolocalización:** Integración con Mapas (Mapbox/Leaflet) para visualizar tribus y productos cercanos.
- **Diseño Responsive:** Optimizado para dispositivos móviles y escritorio.
- **Validación Estricta:** Formularios validados con los mismos esquemas que usa el backend gracias al paquete compartido.

---

## 🚀 Desarrollo

### Ejecución
```bash
# Desde la raíz del monorepo
pnpm dev --filter frontend

# O en esta carpeta
pnpm run dev
```

### Estructura de Carpetas
- `app/`: Rutas, layouts y componentes de servidor.
- `components/`: Componentes de UI reutilizables (Client & Server).
- `hooks/`: Lógica compartida de React hooks.
- `lib/`: Clientes de API, utilidades y configuraciones.

---

## 🔗 Conexión con el Backend
Configurá la URL de la API en tu `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

# 🌳 Amazonia IA - Design System Foundation

Este documento establece las bases visuales y estructurales para el marketplace de **Amazonia IA**. El objetivo es mantener una estética coherente basada en la naturaleza, el comercio justo y la tecnología avanzada.

## 🎨 Paleta de Colores (Brand Tokens)

Nuestros colores están inspirados en el ecosistema amazónico: la selva (Esmeralda) y sus ríos (Teal).

### Colores Primarios (Naturaleza)
| Token | HEX | Uso |
| :--- | :--- | :--- |
| `brand-primary` | `#059669` | Acciones principales, botones, enlaces destacados. |
| `brand-primary-dark` | `#064e3b` | Títulos, logotipos, estados de contraste. |
| `brand-primary-light` | `#d1fae5` | Fondos de componentes resaltados, iconos suaves. |
| `brand-nature-bg` | `#ecfdf5` | Fondos generales de secciones o contenedores. |

### Colores Secundarios (Agua & Servicios)
| Token | HEX | Uso |
| :--- | :--- | :--- |
| `brand-secondary` | `#0d9488` | Categorías de marketplace, insignias, botones secundarios. |
| `brand-secondary-light`| `#f0fdfa` | Fondos de categorías y etiquetas suaves. |

### Acentos y Estados
| Token | HEX | Uso |
| :--- | :--- | :--- |
| `brand-accent` | `#fbbf24` | **Calificaciones**, estrellas, destacados especiales. |
| `brand-urgency` | `#ef4444` | Alertas de stock, errores, estados críticos. |

---

## ✍️ Tipografía

Usamos una combinación de fuentes modernas y legibles que refuerzan la identidad tecnológica y amigable del proyecto.

*   **Principal / Display:** **Poppins** (Sans Serif)
    *   *Uso:* Encabezados (`h1`, `h2`, `h3`), títulos de secciones y elementos destacados. Aporta un toque moderno y distintivo.
*   **Secundaria:** **Outfit** (Sans Serif)
    *   *Uso:* Cuerpo de texto, botones, componentes de UI y navegación. Proporciona una lectura clara y geométrica.

---

## 🛠️ Uso en Código (Tailwind CSS v4)

Los colores y fuentes están registrados en `app/globals.css` bajo el bloque `@theme`.

```tsx
// Ejemplo de uso de fuentes
<h1 className="font-poppins text-brand-primary-dark">Título en Poppins</h1>
<p className="font-sans">Cuerpo de texto en Outfit</p>
```

// Ejemplo de una tarjeta con fondo natural
<div className="bg-brand-nature-bg border border-brand-primary-light p-6 rounded-xl">
  <h2 className="text-brand-primary-dark font-bold text-xl">Artesanía Tikuna</h2>
  <p className="text-muted">Apoya el comercio justo...</p>
</div>
```

---

## ✨ Principios de Diseño
1.  **Orgánico pero Limpio:** El uso de colores naturales debe equilibrarse con mucho espacio en blanco para que la app se sienta moderna y no saturada.
2.  **Accesibilidad:** Asegurar siempre un contraste mínimo de 4.5:1 para textos. El color `brand-primary-dark` es ideal para textos sobre fondos claros.
3.  **Micro-interacciones:** Los cambios de estado (Hover/Active) deben ser suaves y seguir la paleta definida (ej. oscurecer un tono el verde principal).

---

*Última actualización: 26 de Abril de 2026*

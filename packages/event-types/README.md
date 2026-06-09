# 📦 @amazonia/dtos — Single Source of Truth

Este paquete contiene todos los **Data Transfer Objects (DTOs)**, tipos e interfaces compartidos entre el frontend y los diferentes microservicios del ecosistema AmazonIA.

## 🎯 ¿Por qué este paquete?

En una arquitectura de monorepo, el mayor beneficio es evitar la duplicación de código. Al tener los DTOs aquí:
1. **Validación Unificada:** Si cambias una regla de validación (ej. largo mínimo de un nombre), se aplica instantáneamente tanto en el formulario del frontend como en la API del backend.
2. **Tipado Estricto:** Se eliminan los errores de "interface mismatch" entre aplicaciones.
3. **Mantenibilidad:** El contrato de datos está documentado en un solo lugar.

## 🛠️ Stack

- **TypeScript:** Para definición de interfaces y tipos.
- **class-validator:** Decoradores para validación en tiempo de ejecución (usado por NestJS).
- **class-transformer:** Para transformar objetos planos a instancias de clase.

## 🚀 Uso

### Instalación en una App
Dentro de `package.json` de cualquier aplicación:
```json
"dependencies": {
  "dtos": "workspace:*"
}
```

### Importación
```typescript
import { CreateProductDto } from 'dtos';
```

## 🏗️ Desarrollo
Para compilar los cambios mientras trabajas:
```bash
pnpm dev --filter dtos
```
o `pnpm build` para generar el directorio `dist/`.

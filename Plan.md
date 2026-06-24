# Plan: Configurar MongooseModule.forRootAsync() en el API Principal

## Objetivo

Integrar MongoDB Atlas en el API principal (`apps/api`) mediante un `MongoModule` dedicado que use `MongooseModule.forRootAsync()` con `serverSelectionTimeoutMS` reducido, importando `MongoTelemetryModule` desde un nuevo paquete compartido `packages/database`.

## Requisitos

- `MongooseModule.forRootAsync()` configurado en un `MongoModule` dedicado dentro de `apps/api`
- `serverSelectionTimeoutMS` configurado a `5000ms` para evitar bloqueos largos del hilo principal
- `MongoTelemetryModule` importado desde `packages/database`
- Variable de entorno `MONGODB_URI` documentada en `apps/api/.env.example`
- El API arranca y responde correctamente en rutas transaccionales aun si MongoDB no esta disponible (degradacion elegante)
- Si `MONGODB_URI` no esta definida, la app lanza error claro al iniciar

## Stack

- **Framework:** NestJS + TypeScript
- **ODM:** `@nestjs/mongoose` + `mongoose`
- **Monorepo:** pnpm workspaces + Turborepo

## Arquitectura

```
packages/database/                          (NUEVO - paquete compartido)
  src/
    mongo-telemetry/
      schemas/
        climate-event.schema.ts             (movido desde telemetry-worker)
        shipment-event.schema.ts            (movido desde telemetry-worker)
      mongo-telemetry.module.ts             (MongooseModule.forFeature + exports)
    index.ts                                (barrel export)

apps/api/src/mongo/
  mongo.module.ts                           (NUEVO - forRootAsync + importa MongoTelemetryModule)

apps/api/src/app.module.ts                  (actualizado - importa MongoModule)
apps/api/.env.example                       (actualizado - documenta MONGODB_URI)

apps/telemetry-worker/src/mongo/
  mongo.module.ts                           (refactorizado - importa desde packages/database)
```

### Flujo de dependencias

```
AppModule (apps/api)
  └── MongoModule (apps/api/src/mongo/)
        ├── MongooseModule.forRootAsync()    ← conexion + serverSelectionTimeoutMS: 5000
        └── MongoTelemetryModule (packages/database)
              └── MongooseModule.forFeature() ← schemas climate + shipment
```

## Pasos de Implementacion

### Paso 1: Crear `packages/database/`

**`packages/database/package.json`**
- Name: `"database"` (bare name, siguiendo convencion de `event-types` y `messaging`)
- `main`: `./dist/index.js`, `types`: `./dist/index.d.ts`
- `exports` con condiciones `types` y `default` apuntando a `./dist/`
- Build: `tsc`
- Dependencias: `@nestjs/mongoose`, `mongoose`, `@nestjs/common`

**`packages/database/tsconfig.json`**
- `target`: `es2022`, `module`: `commonjs`
- `experimentalDecorators`: true, `emitDecoratorMetadata`: true
- `declaration`: true, `declarationMap`: true, `sourceMap`: true
- `outDir`: `./dist`, `rootDir`: `./src`
- `strict`: true, `strictPropertyInitialization`: false

**`packages/database/src/mongo-telemetry/schemas/climate-event.schema.ts`**
- Copiado sin cambios desde `apps/telemetry-worker/src/mongo/schemas/climate-event.schema.ts`

**`packages/database/src/mongo-telemetry/schemas/shipment-event.schema.ts`**
- Copiado sin cambios desde `apps/telemetry-worker/src/mongo/schemas/shipment-event.schema.ts`

**`packages/database/src/mongo-telemetry/mongo-telemetry.module.ts`**
- `@Module` con `MongooseModule.forFeature()` registrando ambos schemas
- `exports: [MongooseModule]` para que consumidores usen `@InjectModel()`

**`packages/database/src/index.ts`**
- Barrel export: `MongoTelemetryModule`, schemas, types de documentos

### Paso 2: Crear `apps/api/src/mongo/mongo.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    MongoTelemetryModule,
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
```

- `config.getOrThrow('MONGODB_URI')` → lanza error claro si no esta definida
- `serverSelectionTimeoutMS: 5000` → timeout de 5s para seleccion de servidor
- Importa `MongoTelemetryModule` desde `database`
- Exporta `MongooseModule` para que otros modulos del API puedan usar `@InjectModel()`

### Paso 3: Actualizar `apps/api/src/app.module.ts`

- Agregar `import { MongoModule } from './mongo/mongo.module'`
- Agregar `MongoModule` al array de `imports`

### Paso 4: Actualizar `apps/api/.env.example`

- Documentar `MONGODB_URI` con comentario descriptivo (la linea ya existe vacia)

```env
# MongoDB Atlas connection string (telemetry time-series data)
MONGODB_URI=
```

### Paso 5: Refactorizar `apps/telemetry-worker/`

- Agregar `"database": "workspace:*"` a `apps/telemetry-worker/package.json`
- Eliminar schemas locales (`climate-event.schema.ts`, `shipment-event.schema.ts`)
- Importar `MongoTelemetryModule` desde `database` en `MongoModule`
- `MongoModule` de telemetry-worker solo hace `forRootAsync()` + importa `MongoTelemetryModule`

### Paso 6: Verificar

- `pnpm install` → linkea el nuevo workspace package
- `pnpm turbo build` → verifica compilacion topologica (packages primero, apps despues)
- Validar que `apps/api` arranca correctamente con `MONGODB_URI` definida
- Validar que `apps/api` lanza error claro sin `MONGODB_URI`
- Validar que `apps/telemetry-worker` sigue funcionando con el refactor

## Archivos Involucrados

| Archivo | Accion |
|---|---|
| `packages/database/package.json` | NUEVO |
| `packages/database/tsconfig.json` | NUEVO |
| `packages/database/src/index.ts` | NUEVO |
| `packages/database/src/mongo-telemetry/mongo-telemetry.module.ts` | NUEVO |
| `packages/database/src/mongo-telemetry/schemas/climate-event.schema.ts` | NUEVO (movido) |
| `packages/database/src/mongo-telemetry/schemas/shipment-event.schema.ts` | NUEVO (movido) |
| `apps/api/src/mongo/mongo.module.ts` | NUEVO |
| `apps/api/src/app.module.ts` | MODIFICADO |
| `apps/api/.env.example` | MODIFICADO |
| `apps/telemetry-worker/src/mongo/mongo.module.ts` | MODIFICADO |
| `apps/telemetry-worker/src/mongo/schemas/climate-event.schema.ts` | ELIMINADO |
| `apps/telemetry-worker/src/mongo/schemas/shipment-event.schema.ts` | ELIMINADO |
| `apps/telemetry-worker/package.json` | MODIFICADO |

## Notas

- `apps/api` ya tiene `@nestjs/mongoose: ^11.0.4` y `mongoose: ^8.24.0` en su `package.json`
- El paquete `database` compila a CommonJS (`module: "commonjs"`) para compatibilidad con decoradores de NestJS
- `apps/api` usa `module: "nodenext"` pero puede importar paquetes CJS sin problema via `resolvePackageJsonExports: true`
- `serverSelectionTimeoutMS: 5000` aplica solo a la seleccion inicial de servidor; queries individuales tienen su propio timeout

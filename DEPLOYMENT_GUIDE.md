# Guía de Despliegue y Ejecución Local (Arquitectura Híbrida)

Esta guía explica cómo está estructurado el monorepo y cómo ejecutarlo tanto en entornos locales de desarrollo como en producción.

## 1. Ejecución Local (Desarrollo)

El proyecto utiliza **Turborepo** y **pnpm** para gestionar las múltiples aplicaciones y paquetes compartidos.

### Pasos para iniciar el entorno:
1.  **Instalación:** Ejecuta `pnpm install` en la raíz del proyecto. Esto instalará todas las dependencias y vinculará los paquetes compartidos (ej. `packages/event-types`).
2.  **Iniciar Servicios:** Ejecuta `pnpm run dev` en la raíz. Turborepo iniciará en paralelo:
    *   La aplicación Web (`apps/web` en puerto 3000).
    *   La API Principal (`apps/api` en puerto 3001 o el que esté configurado).
    *   Los microservicios de ingesta y procesamiento (cuando estén implementados).
3.  **Variables de Entorno (`.env`):** Cada aplicación debe tener su propio archivo `.env`. Para desarrollo local, **no necesitas instalar bases de datos localmente**. Configura las URLs para que apunten directamente a los clústeres de desarrollo en la nube:
    *   `DATABASE_URL` -> Neon (PostgreSQL)
    *   `MONGODB_URI` -> MongoDB Atlas (Asegúrate de incluir `?readPreference=secondary` en el modelo de IA).
    *   `REDIS_URL` -> Upstash Redis (Serverless Streams)

### Simulador IoT
El simulador de datos (en `apps/iot-simulator`) **no se ejecuta automáticamente** con `pnpm run dev` para evitar inyectar basura mientras desarrollas la web.
Para probarlo, abre una terminal separada y navega a la carpeta del simulador, o ejecuta su script específico.

---

## 2. Estrategia de Despliegue (Producción)

Dado que usamos una arquitectura de microservicios dentro de un monorepo, cada servicio debe desplegarse de manera independiente para aislar fallos y escalar según la carga.

### Bases de Datos y Broker (Managed Services)
No requieren despliegue de nuestra parte, solo obtener las credenciales de producción desde sus plataformas:
*   **Neon:** Base de datos principal relacional.
*   **Upstash:** Cluster de Redis Serverless (Streams).
*   **MongoDB Atlas:** Data Lake de series temporales (con Replica Sets activados).

### Aplicación Web (`apps/web`)
*   **Plataforma Recomendada:** Vercel o Netlify.
*   **Configuración:** Vercel detecta automáticamente que el proyecto usa Turborepo. Solo debes seleccionar la carpeta raíz y elegir `apps/web` como el *Root Directory* o simplemente dejar que Turborepo maneje el build.
*   **Escalabilidad:** Automática y global.

### Microservicios Backend (`apps/api`, `apps/ingestor-service`, `apps/telemetry-worker`)
*   **Plataformas Recomendadas:** Render, Railway, AWS Elastic Beanstalk o DigitalOcean App Platform.
*   **Configuración:** Crearás **3 servicios web distintos** en tu plataforma (apuntando al mismo repo de GitHub).
    *   **Root Directory:** Dejar en blanco o apuntar a la raíz.
    *   **Build Command:** Depende del servicio. Ej: `cd apps/api && pnpm install && pnpm run build`.
    *   **Start Command:** Ej: `cd apps/api && pnpm run start:prod`.
*   **Escalabilidad:** 
    *   Si hay un pico de envíos masivos IoT, puedes aumentar las instancias del **Ingestor** en el panel de control de Render/Railway, sin afectar ni reiniciar la API principal del marketplace.

### Modelo Predictivo de IA (`apps/ml-engine`)
*   Si expones el modelo a través de una API (ej. FastAPI), se despliega de la misma forma que los microservicios backend.
*   Recordatorio: El modelo de IA se conectará a MongoDB leyendo de los nodos secundarios para garantizar **cero bloqueos (locks)** en la base de datos operativa.

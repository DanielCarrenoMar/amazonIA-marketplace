# 📜 Blockchain Notary Microservice

Bienvenido al microservicio **Notario Digital** del ecosistema AmazonIA Marketplace. 

## 🏗️ ¿Qué hace este microservicio?

Este servicio, construido sobre **NestJS** y **Web3.js**, tiene una única y exclusiva responsabilidad: actuar como un notario inmutable. 

Recibe datos de transacciones previamente validadas por el **Backend Principal** y se encarga de registrarlas de forma segura y permanente en un Smart Contract en la Blockchain (ej. Arbitrum).

Toda la comunicación de red con la blockchain y el manejo de billeteras y gas se aísla aquí para no sobrecargar la API principal.

## 🔒 Seguridad y Flujo

1. **Autenticación Interna:** El servicio no es público. Solo el Backend Principal puede consumirlo. Se protege mediante una **API Key** estática enviada en los headers de la petición (`x-api-key`).
2. **Billetera Corporativa:** El servicio asume el costo de transacción (Gas). Para ello, utiliza la clave privada (`PRIVATE_KEY`) de una billetera administrativa precargada con fondos.
3. **Soporte de Nodos (RPC):** Es agnóstico a la infraestructura. Puedes usar nodos públicos (gratis) o proveedores robustos como Alchemy, Infura, etc. Soporta tanto keys en la URL como autenticación estricta por HTTP Headers.

---

## ⚙️ Configuración del Entorno (.env)

Para levantar este microservicio localmente, primero copia la plantilla de ejemplo:

```bash
cp .env.example .env
```

Luego, llena las variables necesarias en tu archivo `.env`:

| Variable | Descripción | ¿Requerida? |
|----------|-------------|-------------|
| `API_KEY` | La clave compartida con el Backend Principal. El backend debe enviar exactamente esta misma clave en sus peticiones para que este microservicio lo autorice. | **Sí** |
| `RPC_URL` | La URL de tu nodo de Blockchain. Ej: `https://arb1.arbitrum.io/rpc`. | **Sí** |
| `RPC_API_KEY` | Clave de API para el nodo RPC. Se inyecta en los headers (`x-api-key`, `Authorization`). Déjala vacía si tu proveedor requiere la key embebida en la propia URL. | No |
| `PRIVATE_KEY` | La clave privada hexadecimal de tu billetera (sin el 0x inicial en muchos casos, o con él, dependiendo del proveedor, asegúrate que sea cuenta de desarrollo). ¡Nunca uses una cuenta real en local! | **Sí** |
| `CONTRACT_ADDRESS` | La dirección hexadecimal donde está desplegado el Smart Contract del notario. | **Sí** |

## 🚀 Cómo ejecutarlo

Asegúrate de haber instalado las dependencias desde la raíz del monorepo y ejecuta:

```bash
# Desde la raíz del workspace (Turborepo)
pnpm run dev --filter blockchain-notary

# O directamente desde esta carpeta:
pnpm run start:dev
```

## 📡 Endpoint Principal

`POST /api/v1/transactions/register` (La ruta base puede variar según configuración de Nest)

**Headers esperados:**
- `x-api-key`: `[TU_API_KEY]`

---
*Nota de Arquitectura: Si el contrato inteligente falla, no hay fondos, o el nodo RPC cae, este servicio devuelve un error 500 controlado que el backend sabrá interpretar.*

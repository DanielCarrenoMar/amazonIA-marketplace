# 📜 Blockchain Notary Microservice

Bienvenido al microservicio **Notario Digital** del ecosistema AmazonIA Marketplace.

## 🏗️ ¿Qué hace este microservicio?

Este servicio, construido sobre **NestJS** y **ethers.js v6**, tiene una única y exclusiva responsabilidad: actuar como un notario inmutable.

Recibe datos de transacciones previamente validadas por el **Backend Principal** y se encarga de registrarlas de forma segura y permanente en un Smart Contract en la Blockchain (actualmente configurado para **Arbitrum**).

Toda la comunicación de red con la blockchain, el manejo de proveedores RPC, la gestión de la billetera administrativa y el cálculo de gas se aísla aquí para no sobrecargar la API principal.

## 🔒 Seguridad y Flujo

1. **Autenticación Interna:** El servicio no es público. Solo el Backend Principal puede consumirlo. Se protege mediante una **API Key** estática enviada en los headers de la petición (`x-api-key`).
2. **Billetera Corporativa:** El servicio asume el costo de transacción (Gas). Para ello, utiliza la clave privada (`PRIVATE_KEY`) de una billetera administrativa precargada con fondos.
3. **Soporte de Nodos (RPC):** Es agnóstico a la infraestructura. Soporta tanto keys embebidas en la URL como autenticación por headers.

---

## ⚙️ Configuración del Entorno (.env)

Copia la plantilla de ejemplo y llena las variables:

```bash
cp .env.example .env
```

| Variable | Descripción | ¿Requerida? |
|----------|-------------|-------------|
| `API_KEY` | Clave compartida con el Backend Principal para autorizar peticiones. | **Sí** |
| `RPC_URL` | URL del nodo de Blockchain. Ej: `https://arb1.arbitrum.io/rpc`. | **Sí** |
| `PRIVATE_KEY` | Clave privada hexadecimal de la billetera administrativa (con o sin `0x`). | **Sí** |
| `CONTRACT_ADDRESS` | Dirección del Smart Contract `NotaryRegistry` desplegado. | **Sí** |
| `NETWORK_NAME` | Nombre de la red para logs (default: `arbitrum`). | No |

---

## 🚀 Ejecución

### Desde la raíz del monorepo (Recomendado)
```bash
pnpm dev --filter blockchain-notary
```

### Directamente en esta carpeta
```bash
pnpm install
pnpm run dev
```

## 📡 API Endpoints

### Health Check
`GET /health`
Verifica la conexión con la base de datos local y el nodo RPC de la blockchain.

### Registro de Transacción
`POST /api/v1/transactions/register`

**Headers:**
- `x-api-key`: `[TU_API_KEY]`

**Cuerpo (JSON):**
```json
{
  "orderId": "uuid-de-la-orden",
  "amount": 150.50,
  "paymentMethod": "STRIPE",
  "productHash": "sha256-del-producto",
  "buyerId": "uuid-comprador",
  "sellerId": "uuid-vendedor"
}
```

---
*Nota de Arquitectura: Si el contrato inteligente falla, no hay fondos, o el nodo RPC cae, este servicio devuelve un error 500 controlado que el backend sabrá interpretar para reintentos posteriores.*

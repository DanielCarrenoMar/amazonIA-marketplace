# 🌿 Prueba IoT Amazonia

Simulador de dispositivo IoT para el ecosistema **AmazonIA Marketplace**.  
Genera telemetría ficticia de envíos (GPS, temperatura, vibraciones) y la publica en un broker MQTT (HiveMQ Cloud) mediante TLS. El simulador puede ejecutarse como servicio `systemd` para comportarse como un dispositivo de hardware real.

### Flujo de datos

1. **sensor.js** genera payloads de telemetría cada 5 segundos.
2. Cada payload incluye: coordenadas GPS (variación aleatoria alrededor de 6 checkpoints), temperatura ambiente, fuerza G de impacto, y estado del envío.
3. Se publica en el tópico `amazonia/iot/shipment` con **QoS 1** (entrega garantizada al menos una vez).
4. En producción, el **Ingestor API** del backend consume los mismos tópicos.

---

## 📁 Estructura del proyecto

```
Prueba-IoT-Amazonia/
├── sensor.js                  # Simulador IoT (publicador MQTT)
├── start-all.sh               # Ejecuta 3 sensores en paralelo
├── amazonia-sensor.service    # Plantilla de unidad systemd
├── install-systemd.sh         # Instalador portable del servicio
├── package.json
├── .env                       # Variables de entorno (no versionado)
├── .env.example               # Plantilla de variables
└── README.md
```

---

## 🚀 Inicio rápido

### Prerrequisitos

- **Node.js** ≥ 18
- **pnpm** (o npm/yarn)
- Cuenta en [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) (plan gratuito disponible)

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd Prueba-IoT-Amazonia
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con las credenciales reales de HiveMQ
```

---

## 💻 Modo local (tu PC de desarrollo)

> Usa este modo cuando estés desarrollando o probando.  
> El sensor se ejecuta **solo mientras tengas la terminal abierta**.  
> Al cerrar la terminal o presionar `Ctrl+C`, se detiene y no consume recursos.

### Iniciar el sensor

```bash
npm start
```

### Detener el sensor

Presiona **`Ctrl+C`** en la terminal donde ejecutaste `npm start`. El proceso se cerrará limpiamente (graceful shutdown) y liberará todos los recursos.

### Iniciar múltiples sensores en paralelo

Para ejecutar los 3 sensores simultáneamente (clima01, clima02, sensor02):

```bash
npm run start:all
```

Este comando ejecuta `start-all.sh`, que:

1. Carga las variables compartidas (`HIVEMQ_HOST`, `HIVEMQ_PORT`, `HIVEMQ_PASSWORD`) desde `.env`.
2. Lanza 3 procesos `node sensor.js` en paralelo, cada uno con un `HIVEMQ_USERNAME` diferente.
3. Captura `Ctrl+C` para detener los 3 procesos limpiamente.

| Sensor | Usuario | ID Generado | Tópico MQTT |
|---|---|---|---|
| Clima 01 | `clima01` | `CRM-001` | `amazonia/iot/weather` |
| Clima 02 | `clima02` | `CRM-002` | `amazonia/iot/weather` |
| Paquete 02 | `sensor02` | `ORD-002` | `amazonia/iot/shipment` |

> **Nota:** Los sensores de clima se fijan a una estación meteorológica y reportan humedad, presión, viento y UV. Los sensores de paquete recorren la ruta Manaos → Belém reportando temperatura e impactos.

---

## 🖥️ Modo servidor (producción – siempre activo)

> Usa este modo **únicamente en el servidor web** donde se despliega AmazonIA Marketplace.  
> El sensor arranca automáticamente con el sistema operativo, se reinicia si falla, y corre en segundo plano 24/7.  
> **No instales esto en tu PC personal** a menos que quieras que corra permanentemente.

### Instalar el servicio systemd

```bash
npm run setup:systemd
```

Esto ejecuta `install-systemd.sh`, que:

1. Detecta el usuario actual y la ruta de `node`.
2. Genera dinámicamente la unidad systemd con las rutas correctas.
3. Carga las variables de `.env` mediante `EnvironmentFile`.
4. Habilita e inicia el servicio automáticamente.

### Comandos de administración (servidor)

```bash
# Ver estado del servicio
systemctl status amazonia-sensor --no-pager

# Seguir logs en tiempo real
journalctl -u amazonia-sensor -f

# Detener el servicio temporalmente
sudo systemctl stop amazonia-sensor 

# Detener y deshabilitar arranque automático
sudo systemctl stop amazonia-sensor
sudo systemctl disable amazonia-sensor
```